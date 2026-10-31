import { get, post, patch, del } from '../api.js';
import { h, btn, formModal, confirmBox, toast, link, truncate } from '../ui.js';
import { listPage } from '../listPage.js';

export function categoriesView({ query, changed }) {
  const page = listPage({
    title: 'Categories',
    hint: 'Topics used to group posts',
    query,
    pageSize: 15,
    // /api/categories returns the whole list, so search + pagination are done locally
    load: async ({ q = '', page = 1, limit = 15 }) => {
      const all = await get('/api/categories');
      const needle = q.toLowerCase();
      const rows = needle ? all.filter((c) => `${c.title} ${c.description || ''}`.toLowerCase().includes(needle)) : all;
      return { total: rows.length, page, limit, pages: Math.max(1, Math.ceil(rows.length / limit)), data: rows.slice((page - 1) * limit, page * limit) };
    },
    filters: [{ name: 'q', type: 'search', label: 'Search', placeholder: 'title or description' }],
    columns: [
      { label: 'ID', render: (c) => h('span', { class: 'num muted' }, c.id) },
      { label: 'Title', render: (c) => h('span', { class: 'cell-title' }, c.title) },
      { label: 'Description', render: (c) => h('span', { class: 'cell-snippet cell-sub' }, c.description ? truncate(c.description, 160) : '—') },
      { label: 'Posts', render: (c) => link(`#/posts?categoryId=${c.id}`, 'View') },
    ],
    toolbar: (refresh) => [btn('Add category', { kind: 'primary', onclick: () => form(null, refresh) })],
    rowActions: (c, refresh) => [
      btn('Edit', { kind: 'small', onclick: () => form(c, refresh) }),
      btn('Delete', { kind: 'small danger', onclick: () => remove(c, refresh) }),
    ],
  });

  function form(c, refresh) {
    formModal({
      title: c ? `Category: ${c.title}` : 'New category',
      submitLabel: c ? 'Save' : 'Create',
      fields: [
        { name: 'title', label: 'Title', value: c?.title, required: true },
        { name: 'description', label: 'Description', type: 'textarea', value: c?.description || '' },
      ],
      onSubmit: async (v) => {
        if (c) await patch(`/api/categories/${c.id}`, v); else await post('/api/categories', v);
        toast(c ? 'Category updated' : 'Category created');
        changed(); refresh();
      },
    });
  }

  async function remove(c, refresh) {
    const ok = await confirmBox({
      title: 'Delete category?', danger: true, confirmLabel: 'Delete',
      message: `Category “${c.title}” will be deleted and its posts will lose the link to it. The posts themselves will remain.`,
    });
    if (!ok) return;
    try { await del(`/api/categories/${c.id}`); toast('Category deleted'); changed(); refresh(); } catch (e) { toast(e.message, 'error'); }
  }

  return page.el;
}
