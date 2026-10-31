import { get, post, patch, del } from '../api.js';
import { h, btn, badge, avatar, ratingEl, formModal, confirmBox, toast, link } from '../ui.js';
import { listPage } from '../listPage.js';

const ROLES = [{ value: 'user', label: 'User' }, { value: 'admin', label: 'Administrator' }];

export function usersView({ query, me, changed }) {
  const page = listPage({
    title: 'Users',
    hint: 'Profiles, roles and access to the service',
    query,
    load: (p) => get('/api/admin/users', p),
    filters: [
      { name: 'q', type: 'search', label: 'Search', placeholder: 'login, name or email' },
      { name: 'role', type: 'select', label: 'Role', options: ROLES },
      { name: 'emailConfirmed', type: 'select', label: 'Email', options: [{ value: 'true', label: 'Confirmed' }, { value: 'false', label: 'Unconfirmed' }] },
    ],
    columns: [
      { label: 'ID', render: (u) => h('span', { class: 'num muted' }, u.id) },
      { label: 'User', render: (u) => h('div', { class: 'user-cell' }, avatar(u), h('div', h('span', { class: 'cell-title' }, u.login), h('span', { class: 'cell-sub' }, u.fullName))) },
      { label: 'Email', render: (u) => h('div', h('span', { class: 'cell-sub' }, u.email), h('div', u.emailConfirmed ? badge('confirmed', 'ok') : badge('unconfirmed', 'warn'))) },
      { label: 'Role', render: (u) => u.role === 'admin' ? badge('admin', 'info') : badge('user') },
      { label: 'Rating', render: (u) => ratingEl(u.rating) },
      { label: 'Activity', render: (u) => h('span', { class: 'cell-sub' }, link(`#/posts?authorId=${u.id}`, `${u.postsCount} posts`), ' · ', link(`#/comments?authorId=${u.id}`, `${u.commentsCount} comments`)) },
    ],
    toolbar: (refresh) => [btn('Add user', { kind: 'primary', onclick: () => createUser(refresh) })],
    rowActions: (u, refresh) => {
      const isMe = Number(u.id) === Number(me.id);
      return [
        btn('Edit', { kind: 'small', onclick: () => editUser(u, isMe, refresh) }),
        btn('Password', { kind: 'small', onclick: () => setPassword(u) }),
        u.emailConfirmed ? null : btn('Confirm email', { kind: 'small', onclick: async () => { try { await run(() => patch(`/api/admin/users/${u.id}/confirm-email`), 'Email confirmed'); refresh(); } catch { /* the error toast is already shown */ } } }),
        btn('Delete', { kind: 'small danger', disabled: isMe, title: isMe ? 'You cannot delete your own account' : '', onclick: () => remove(u, refresh) }),
      ];
    },
  });

  async function run(fn, okMsg) {
    try { const r = await fn(); toast(okMsg); changed(); return r; } catch (e) { toast(e.message, 'error'); throw e; }
  }

  function createUser(refresh) {
    formModal({
      title: 'New user',
      submitLabel: 'Create',
      fields: [
        { name: 'login', label: 'Login', required: true, hint: '3–45 characters: letters, digits, _ . -' },
        { name: 'fullName', label: 'Full name', hint: 'If empty, the login will be used' },
        { name: 'email', label: 'Email', type: 'email', required: true },
        { name: 'password', label: 'Password', type: 'password', required: true, hint: 'At least 8 characters' },
        { name: 'passwordConfirmation', label: 'Repeat password', type: 'password', required: true },
        { name: 'role', label: 'Role', type: 'select', options: ROLES, value: 'user' },
        { name: 'confirmEmail', label: 'Confirm email immediately (otherwise the user cannot sign in)', type: 'checkbox', value: true },
      ],
      onSubmit: async (v) => {
        const { confirmEmail, ...payload } = v;
        const user = await post('/api/users', payload);
        if (confirmEmail) await patch(`/api/admin/users/${user.id}/confirm-email`);
        toast(`User ${user.login} created`);
        changed(); refresh();
      },
    });
  }

  function editUser(u, isMe, refresh) {
    formModal({
      title: `Edit: ${u.login}`,
      fields: [
        { name: 'login', label: 'Login', value: u.login, required: true },
        { name: 'fullName', label: 'Full name', value: u.fullName, required: true },
        { name: 'email', label: 'Email', type: 'email', value: u.email, required: true, hint: 'After changing the email it must be confirmed again' },
        { name: 'role', label: 'Role', type: 'select', value: u.role, options: ROLES, hint: isMe ? 'You cannot change your own role' : '' },
      ],
      onSubmit: async (v) => {
        const data = {};
        for (const k of ['login', 'fullName', 'email']) if (v[k] !== u[k]) data[k] = v[k];
        if (Object.keys(data).length) await patch(`/api/users/${u.id}`, data);
        if (v.role !== u.role) {
          if (isMe) throw new Error('You cannot change your own role');
          await patch(`/api/users/${u.id}/role`, { role: v.role });
        }
        toast('Profile updated');
        changed(); refresh();
      },
    });
  }

  function setPassword(u) {
    formModal({
      title: `New password: ${u.login}`,
      submitLabel: 'Change password',
      fields: [
        { name: 'newPassword', label: 'New password', type: 'password', required: true, hint: 'At least 8 characters' },
        { name: 'newPasswordConfirmation', label: 'Repeat password', type: 'password', required: true },
      ],
      onSubmit: async (v) => { await patch(`/api/admin/users/${u.id}/password`, v); toast('Password changed'); },
    });
  }

  async function remove(u, refresh) {
    const ok = await confirmBox({
      title: 'Delete user?', danger: true, confirmLabel: 'Delete',
      message: `User “${u.login}” will be deleted along with all their posts, comments and likes. This cannot be undone.`,
    });
    if (!ok) return;
    try { await del(`/api/users/${u.id}`); toast('User deleted'); changed(); refresh(); } catch (e) { toast(e.message, 'error'); }
  }

  return page.el;
}
