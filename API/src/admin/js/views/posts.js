import { get, post, patch, del } from '../api.js';
import { h, btn, formFields, statusBadge, lockBadge, ratingEl, formModal, confirmBox, toast, link, modal, fmtDate, truncate } from '../ui.js';
import { listPage } from '../listPage.js';

export async function postsView({ query, changed }) {
  const categories = await get('/api/categories');
  const catOptions = categories.map((c) => ({ value: c.id, label: c.title }));

  const page = listPage({
    title: 'Posts',
    hint: 'All posts are shown, including inactive ones. Post content cannot be edited.',
    query,
    load: (p) => get('/api/admin/posts', p),
    dimmed: (p) => p.status !== 'active',
    filters: [
      { name: 'q', type: 'search', label: 'Search', placeholder: 'title or text' },
      { name: 'status', type: 'select', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
      { name: 'categoryId', type: 'select', label: 'Category', options: catOptions },
      { name: 'locked', type: 'select', label: 'Locking', options: [{ value: 'true', label: 'Locked' }, { value: 'false', label: 'Unlocked' }] },
      { name: 'authorId', type: 'number', label: 'Author ID' },
    ],
    columns: [
      { label: 'ID', render: (p) => h('span', { class: 'num muted' }, p.id) },
      { label: 'Post', render: (p) => h('div',
          h('a', { href: '#', class: 'cell-title', onclick: (e) => { e.preventDefault(); openPost(p.id, refresh); } }, p.title),
          h('div', { class: 'chips' }, p.categories.map((c) => h('span', { class: 'chip' }, c.title)))) },
      { label: 'Author', render: (p) => link(`#/posts?authorId=${p.authorId}`, p.authorLogin) },
      { label: 'State', render: (p) => h('div', { class: 'badges' }, statusBadge(p.status), lockBadge(p.locked)) },
      { label: 'Rating', render: (p) => ratingEl(p.rating) },
      { label: 'Comments', render: (p) => link(`#/comments?postId=${p.id}`, p.commentsCount) },
      { label: 'Date', render: (p) => h('span', { class: 'cell-sub' }, fmtDate(p.publishDate)) },
    ],
    toolbar: (r) => [btn('Add post', { kind: 'primary', onclick: () => create(r) })],
    rowActions: (p, r) => [
      btn('Open', { kind: 'small', onclick: () => openPost(p.id, r) }),
      btn(p.status === 'active' ? 'Hide' : 'Activate', { kind: 'small', onclick: () => act(() => patch(`/api/posts/${p.id}`, { status: p.status === 'active' ? 'inactive' : 'active' }), 'Status updated', r) }),
      btn(p.locked ? 'Unlock' : 'Lock', { kind: 'small', onclick: () => act(() => patch(`/api/posts/${p.id}/lock`, { locked: !p.locked }), p.locked ? 'Post unlocked' : 'Post locked', r) }),
      btn('Delete', { kind: 'small danger', onclick: () => remove(p, r) }),
    ],
  });
  const refresh = () => page.refresh();

  async function act(fn, okMsg, r) {
    try { await fn(); toast(okMsg); changed(); r(); } catch (e) { toast(e.message, 'error'); }
  }

  function create(r) {
    formModal({
      title: 'New post',
      submitLabel: 'Publish',
      fields: [
        { name: 'title', label: 'Title', required: true, hint: '3–255 characters' },
        { name: 'content', label: 'Text', type: 'textarea', required: true },
        { name: 'categories', label: 'Categories', type: 'checkboxes', options: catOptions, required: true },
      ],
      onSubmit: async (v) => { await post('/api/posts', v); toast('Post created'); changed(); r(); },
    });
  }

  async function remove(p, r) {
    const ok = await confirmBox({
      title: 'Delete post?', danger: true, confirmLabel: 'Delete',
      message: `Post “${truncate(p.title, 80)}” will be deleted along with its comments and likes.`,
    });
    if (!ok) return;
    await act(() => del(`/api/posts/${p.id}`), 'Post deleted', r);
  }

  async function openPost(id, r) {
    let p;
    try { p = await get(`/api/posts/${id}`); } catch (e) { toast(e.message, 'error'); return; }

    const images = (p.images || []).filter((i) => i.imagePath?.startsWith('uploads/'));
    const form = h('form', { class: 'form' });
    const status = formFields([
      { name: 'status', label: 'Status', type: 'segmented', value: p.status, options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
    ]);
    const lock = h('input', { type: 'checkbox', id: 'drawer-lock', checked: p.locked });
    const cats = formFields([{ name: 'categories', label: 'Categories', type: 'checkboxes', options: catOptions, value: (p.categories || []).map((c) => c.id) }]);
    const err = h('p', { class: 'form-error', role: 'alert', hidden: true });
    const save = h('button', { type: 'submit', class: 'btn primary' }, 'Save changes');

    form.append(
      h('dl', { class: 'meta-grid' },
        h('dt', 'Author'), h('dd', link(`#/posts?authorId=${p.authorId}`, p.author?.login || `user #${p.authorId}`)),
        h('dt', 'Published'), h('dd', fmtDate(p.publishDate)),
        h('dt', 'Links'), h('dd', link(`#/comments?postId=${p.id}`, 'Comments'), ' · ', link(`#/likes?postId=${p.id}`, 'Likes'))),
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Content (read-only)'), h('div', { class: 'readonly-box' }, p.content)),
      images.length ? h('div', { class: 'images' }, images.map((i) => h('img', { src: `/${i.imagePath}`, alt: 'Post image' }))) : null,
      status.el,
      h('div', { class: 'field inline' }, lock, h('label', { for: 'drawer-lock' }, 'Lock (comments and likes disabled)')),
      cats.el, err,
      h('div', { class: 'form-actions' },
        btn('Delete', { kind: 'danger', onclick: async () => { m.close(); await remove(p, r); } }), save));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      err.hidden = true; save.disabled = true;
      try {
        const newStatus = status.read('status');
        const newCats = cats.read('categories');
        await patch(`/api/posts/${p.id}`, { status: newStatus, categories: newCats });
        if (lock.checked !== p.locked) await patch(`/api/posts/${p.id}/lock`, { locked: lock.checked });
        toast('Post updated'); changed(); r(); m.close();
      } catch (ex) { err.textContent = ex.message; err.hidden = false; } finally { save.disabled = false; }
    });

    const m = modal({ title: p.title, drawer: true, body: form });
  }

  return page.el;
}
