import { get } from '../api.js';
import { h, link, statusBadge, fmtDate, ratingEl, badge } from '../ui.js';

export async function dashboardView() {
  const { counts: c, latestPosts, topUsers } = await get('/api/admin/stats');

  const tile = (href, value, label) => h('a', { class: 'card tile', href }, h('b', { class: 'num' }, value), h('span', label));

  const attention = [
    [c.inactivePosts, 'inactive posts', '#/posts?status=inactive'],
    [c.lockedPosts, 'locked posts', '#/posts?locked=true'],
    [c.inactiveComments, 'inactive comments', '#/comments?status=inactive'],
    [c.unconfirmed, 'users with unconfirmed email', '#/users?emailConfirmed=false'],
  ];

  return h('section', { class: 'page' },
    h('div', { class: 'page-head' }, h('div', h('h1', 'Overview'), h('p', 'Community status and what needs moderation'))),
    h('div', { class: 'tiles' },
      tile('#/users', c.users, `users (admins: ${c.admins})`),
      tile('#/posts', c.posts, 'posts'),
      tile('#/comments', c.comments, 'comments'),
      tile('#/likes', c.likes, 'reactions'),
      tile('#/categories', c.categories, 'categories')),
    h('div', { class: 'cols' },
      h('div', { class: 'card panel attention' },
        h('h2', 'Needs attention'),
        h('ul', { class: 'list' }, attention.map(([n, label, href]) =>
          h('li', h('span', link(href, `${n} ${label}`)), n ? badge('review', 'warn') : badge('all good', 'ok'))))),
      h('div', { class: 'card panel' },
        h('h2', 'Latest posts'),
        latestPosts.length
          ? h('ul', { class: 'list' }, latestPosts.map((p) => h('li',
              h('span', link(`#/posts?q=${encodeURIComponent(p.title)}`, p.title), h('div', { class: 'cell-sub' }, `${p.authorLogin} · ${fmtDate(p.publishDate)}`)),
              statusBadge(p.status))))
          : h('p', { class: 'muted' }, 'No posts yet')),
      h('div', { class: 'card panel' },
        h('h2', 'Top rated'),
        h('ul', { class: 'list' }, topUsers.map((u) => h('li',
          h('span', link(`#/users?q=${encodeURIComponent(u.login)}`, u.login), h('div', { class: 'cell-sub' }, u.fullName)),
          ratingEl(u.rating)))))));
}
