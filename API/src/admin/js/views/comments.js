import { get, post, patch, del } from '../api.js';
import { h, btn, statusBadge, lockBadge, ratingEl, formModal, confirmBox, toast, link, fmtDate, truncate } from '../ui.js';
import { listPage } from '../listPage.js';

export function commentsView({ query, changed }) {
  const page = listPage({
    title: 'Comments',
    hint: 'Comment content cannot be edited — only status and locking',
    query,
    load: (p) => get('/api/admin/comments', p),
    dimmed: (c) => c.status !== 'active',
    filters: [
      { name: 'q', type: 'search', label: 'Search', placeholder: 'comment text' },
      { name: 'status', type: 'select', label: 'Status', options: [{ value: 'active', label: 'Active' }, { value: 'inactive', label: 'Inactive' }] },
      { name: 'locked', type: 'select', label: 'Locking', options: [{ value: 'true', label: 'Locked' }, { value: 'false', label: 'Unlocked' }] },
      { name: 'postId', type: 'number', label: 'Post ID' },
      { name: 'authorId', type: 'number', label: 'Author ID' },
    ],
    columns: [
      { label: 'ID', render: (c) => h('span', { class: 'num muted' }, c.id) },
      { label: 'Comment', render: (c) => h('div', { class: 'cell-snippet' }, c.parentId ? h('div', { class: 'cell-sub' }, `reply to #${c.parentId}`) : null, truncate(c.content, 220)) },
      { label: 'Author', render: (c) => link(`#/comments?authorId=${c.authorId}`, c.authorLogin) },
      { label: 'Post', render: (c) => link(`#/comments?postId=${c.postId}`, truncate(c.postTitle, 50)) },
      { label: 'State', render: (c) => h('div', { class: 'badges' }, statusBadge(c.status), lockBadge(c.locked)) },
      { label: 'Rating', render: (c) => ratingEl(c.rating) },
      { label: 'Date', render: (c) => h('span', { class: 'cell-sub' }, fmtDate(c.publishDate)) },
    ],
    toolbar: (r) => [btn('Add comment', { kind: 'primary', onclick: () => create(r) })],
    rowActions: (c, r) => [
      btn(c.status === 'active' ? 'Hide' : 'Activate', { kind: 'small', onclick: () => act(() => patch(`/api/comments/${c.id}`, { status: c.status === 'active' ? 'inactive' : 'active' }), 'Status updated', r) }),
      btn(c.locked ? 'Unlock' : 'Lock', { kind: 'small', onclick: () => act(() => patch(`/api/comments/${c.id}/lock`, { locked: !c.locked }), c.locked ? 'Comment unlocked' : 'Comment locked', r) }),
      btn('Delete', { kind: 'small danger', onclick: () => remove(c, r) }),
    ],
  });

  async function act(fn, okMsg, r) {
    try { await fn(); toast(okMsg); changed(); r(); } catch (e) { toast(e.message, 'error'); }
  }

  function create(r) {
    formModal({
      title: 'New comment',
      submitLabel: 'Add',
      fields: [
        { name: 'postId', label: 'Post ID', type: 'number', required: true, value: Number(query.get('postId')) || '', hint: 'The post must be active and not locked' },
        { name: 'content', label: 'Text', type: 'textarea', required: true },
      ],
      onSubmit: async (v) => { await post(`/api/posts/${v.postId}/comments`, { content: v.content }); toast('Comment added'); changed(); r(); },
    });
  }

  async function remove(c, r) {
    const ok = await confirmBox({ title: 'Delete comment?', danger: true, confirmLabel: 'Delete', message: `“${truncate(c.content, 100)}” will be deleted along with its replies and likes.` });
    if (ok) await act(() => del(`/api/comments/${c.id}`), 'Comment deleted', r);
  }

  return page.el;
}
