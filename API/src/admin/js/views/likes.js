import { get, post, del } from '../api.js';
import { h, btn, badge, formModal, confirmBox, toast, link, fmtDate, truncate } from '../ui.js';
import { listPage } from '../listPage.js';

const RESULT = { created: 'Reaction added', updated: 'Reaction changed', removed: 'That reaction already existed — it has been removed' };

export function likesView({ query, changed }) {
  const page = listPage({
    title: 'Likes',
    hint: 'All reactions on posts and comments',
    query,
    load: (p) => get('/api/admin/likes', p),
    filters: [
      { name: 'type', type: 'select', label: 'Type', options: [{ value: 'like', label: 'Like' }, { value: 'dislike', label: 'Dislike' }] },
      { name: 'target', type: 'select', label: 'On', options: [{ value: 'post', label: 'Post' }, { value: 'comment', label: 'Comment' }] },
      { name: 'postId', type: 'number', label: 'Post ID' },
      { name: 'commentId', type: 'number', label: 'Comment ID' },
      { name: 'authorId', type: 'number', label: 'Author ID' },
    ],
    columns: [
      { label: 'ID', render: (l) => h('span', { class: 'num muted' }, l.id) },
      { label: 'Type', render: (l) => l.type === 'like' ? badge('like', 'ok') : badge('dislike', 'danger') },
      { label: 'Author', render: (l) => link(`#/likes?authorId=${l.authorId}`, l.authorLogin) },
      { label: 'Target', render: (l) => l.postId
          ? h('div', link(`#/posts?q=${encodeURIComponent(l.postTitle)}`, `Post #${l.postId}`), h('div', { class: 'cell-sub' }, truncate(l.postTitle, 80)))
          : h('div', h('span', `Comment #${l.commentId}`), h('div', { class: 'cell-sub' }, truncate(l.commentContent, 80))) },
      { label: 'Date', render: (l) => h('span', { class: 'cell-sub' }, fmtDate(l.publishDate)) },
    ],
    toolbar: (r) => [btn('Add reaction', { kind: 'primary', onclick: () => create(r) })],
    rowActions: (l, r) => [btn('Delete', { kind: 'small danger', onclick: () => remove(l, r) })],
  });

  function create(r) {
    formModal({
      title: 'Reaction from your profile',
      submitLabel: 'Add',
      intro: 'You can have only one reaction per post or comment. Repeating the same one removes it; the opposite one replaces it.',
      fields: [
        { name: 'target', label: 'On', type: 'select', value: query.get('commentId') ? 'comments' : 'posts', options: [{ value: 'posts', label: 'Post' }, { value: 'comments', label: 'Comment' }] },
        { name: 'id', label: 'ID', type: 'number', required: true, value: Number(query.get('postId') || query.get('commentId')) || '' },
        { name: 'type', label: 'Reaction', type: 'segmented', value: 'like', options: [{ value: 'like', label: 'Like' }, { value: 'dislike', label: 'Dislike' }] },
      ],
      onSubmit: async (v) => {
        const res = await post(`/api/${v.target}/${v.id}/like`, { type: v.type });
        toast(RESULT[res.action] || 'Done'); changed(); r();
      },
    });
  }

  async function remove(l, r) {
    const ok = await confirmBox({ title: 'Delete reaction?', danger: true, confirmLabel: 'Delete', message: `The reaction by “${l.authorLogin}” will be deleted.` });
    if (!ok) return;
    try { await del(`/api/admin/likes/${l.id}`); toast('Reaction deleted'); changed(); r(); } catch (e) { toast(e.message, 'error'); }
  }

  return page.el;
}
