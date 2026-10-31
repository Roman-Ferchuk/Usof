import { api, get, post, session } from './api.js';
import { h, btn, avatar, toast } from './ui.js';
import { dashboardView } from './views/dashboard.js';
import { usersView } from './views/users.js';
import { postsView } from './views/posts.js';
import { commentsView } from './views/comments.js';
import { categoriesView } from './views/categories.js';
import { likesView } from './views/likes.js';

const app = document.getElementById('app');

const ROUTES = {
  dashboard: { title: 'Overview', view: dashboardView },
  users: { title: 'Users', view: usersView, badge: 'unconfirmed' },
  posts: { title: 'Posts', view: postsView, badge: 'inactivePosts' },
  comments: { title: 'Comments', view: commentsView, badge: 'inactiveComments' },
  categories: { title: 'Categories', view: categoriesView },
  likes: { title: 'Likes', view: likesView },
};

let navLinks = {};
let main;
let renderToken = 0;

/* ---------- routing ---------- */
function parseHash() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  return { path: path || 'dashboard', query: new URLSearchParams(qs) };
}

function start() {
  const { path } = parseHash();
  const [name, token] = path.split('/');
  if (name === 'reset' && token) return renderReset(decodeURIComponent(token));

  const s = session.get();
  if (!s?.token || s.user?.role !== 'admin') return renderLogin();
  renderShell(s.user);
  route();
}

async function route() {
  const { path, query } = parseHash();
  const name = ROUTES[path] ? path : 'dashboard';
  const my = ++renderToken;

  for (const [k, a] of Object.entries(navLinks)) {
    if (k === name) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
  }
  document.title = `${ROUTES[name].title} · usof admin`;
  main.replaceChildren(h('div', { class: 'state-box', role: 'status' }, 'Loading…'));
  main.focus();

  try {
    const me = session.get().user;
    const el = await ROUTES[name].view({ query, me, changed: refreshBadges });
    if (my === renderToken) main.replaceChildren(el);
  } catch (e) {
    if (my === renderToken) main.replaceChildren(h('div', { class: 'state-box', role: 'alert' }, h('strong', 'Could not open this section'), e.message));
  }
}

window.addEventListener('hashchange', () => (navLinks.dashboard && !parseHash().path.startsWith('reset') ? route() : start()));
window.addEventListener('usof:unauthorized', () => { session.clear(); toast('Your session has expired. Please sign in again.', 'error'); renderLogin(); });

/* ---------- shell ---------- */
function renderShell(user) {
  navLinks = {};
  main = h('main', { class: 'main', tabindex: '-1' });

  const nav = h('nav', { class: 'nav', 'aria-label': 'Sections' }, Object.entries(ROUTES).map(([key, r]) => {
    const count = h('span', { class: 'count', hidden: true, 'data-badge': r.badge || '' });
    const a = h('a', { href: `#/${key}` }, h('span', r.title), count);
    navLinks[key] = a;
    return a;
  }));

  const side = h('aside', { class: 'side' },
    h('div', { class: 'brand' },
      h('span', { class: 'brand-mark', 'aria-hidden': 'true' }, 'u'),
      h('span', 'usof', h('small', 'Admin panel'))),
    nav,
    h('div', { class: 'me' },
      h('div', { class: 'me-row' }, avatar(user), h('div', { style: 'min-width:0' }, h('strong', user.login), h('small', user.email))),
      btn('Sign out', { onclick: logout })));

  app.replaceChildren(h('div', { class: 'shell' }, side, main));
  refreshBadges();
}

async function refreshBadges() {
  try {
    const { counts } = await get('/api/admin/stats');
    document.querySelectorAll('[data-badge]').forEach((el) => {
      const n = counts[el.dataset.badge];
      el.hidden = !n;
      el.textContent = n || '';
      el.title = n ? 'Needs attention' : '';
    });
  } catch { /* badges are non-critical */ }
}

async function logout() {
  try { await post('/api/auth/logout'); } catch { /* token may already be invalid */ }
  session.clear();
  location.hash = '';
  renderLogin();
}

/* ---------- auth screens ---------- */
function authCard(...kids) {
  navLinks = {};
  app.replaceChildren(h('div', { class: 'auth' }, h('div', { class: 'auth-card' },
    h('div', { class: 'brand' }, h('span', { class: 'brand-mark', style: 'color:#fff', 'aria-hidden': 'true' }, 'u'), h('span', 'usof', h('small', { class: 'muted' }, 'Admin panel'))),
    kids)));
  document.title = 'Sign in · usof admin';
}

function field(label, attrs) {
  const input = h('input', { class: 'input', ...attrs });
  return { input, el: h('div', { class: 'field' }, h('label', { for: attrs.id }, label), input) };
}

function renderLogin() {
  const login = field('Login or email', { id: 'login', autocomplete: 'username', required: true });
  const pass = field('Password', { id: 'password', type: 'password', autocomplete: 'current-password', required: true });
  const err = h('p', { class: 'form-error', role: 'alert', hidden: true });
  const submit = h('button', { class: 'btn primary', type: 'submit' }, 'Sign in');

  const form = h('form', { class: 'form', novalidate: true }, login.el, pass.el, err, submit);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    if (!login.input.value.trim() || !pass.input.value) { err.textContent = 'Enter your login and password'; err.hidden = false; return; }
    submit.disabled = true;
    try {
      const res = await api('POST', '/api/auth/login', { login: login.input.value.trim(), password: pass.input.value });
      if (res.user.role !== 'admin') throw new Error('This area is available to administrators only.');
      session.set({ token: res.token, user: res.user });
      location.hash = '#/dashboard';
      start();
    } catch (ex) { err.textContent = ex.message; err.hidden = false; submit.disabled = false; }
  });

  authCard(h('h1', 'Administrator sign in'), form,
    h('div', { class: 'auth-links' }, h('button', { type: 'button', class: 'link-btn', onclick: renderForgot }, 'Forgot your password?')));
  login.input.focus();
}

function renderForgot() {
  const email = field('Account email', { id: 'email', type: 'email', autocomplete: 'email', required: true });
  const msg = h('p', { hidden: true });
  const submit = h('button', { class: 'btn primary', type: 'submit' }, 'Send reset link');
  const form = h('form', { class: 'form', novalidate: true }, h('p', { class: 'muted' }, 'We will email you a link to create a new password. The link is valid for 15 minutes.'), email.el, msg, submit);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submit.disabled = true; msg.hidden = true;
    try {
      const res = await post('/api/auth/password-reset', { email: email.input.value.trim() });
      msg.className = 'ok-box'; msg.textContent = res.message;
    } catch (ex) { msg.className = 'form-error'; msg.textContent = ex.message; }
    msg.hidden = false; submit.disabled = false;
  });
  authCard(h('h1', 'Reset password'), form,
    h('div', { class: 'auth-links' }, h('button', { type: 'button', class: 'link-btn', onclick: renderLogin }, 'Back to sign in')));
  email.input.focus();
}

function renderReset(token) {
  const pass = field('New password', { id: 'np', type: 'password', autocomplete: 'new-password', required: true });
  const msg = h('p', { hidden: true });
  const submit = h('button', { class: 'btn primary', type: 'submit' }, 'Save password');
  const form = h('form', { class: 'form', novalidate: true }, pass.el, h('p', { class: 'muted' }, 'At least 8 characters.'), msg, submit);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    submit.disabled = true; msg.hidden = true;
    try {
      await post(`/api/auth/password-reset/${encodeURIComponent(token)}`, { newPassword: pass.input.value });
      msg.className = 'ok-box'; msg.textContent = 'Password changed. You can now sign in.'; msg.hidden = false;
      setTimeout(() => { location.hash = ''; start(); }, 1500);
    } catch (ex) { msg.className = 'form-error'; msg.textContent = ex.message; msg.hidden = false; submit.disabled = false; }
  });
  authCard(h('h1', 'New password'), form,
    h('div', { class: 'auth-links' }, h('button', { type: 'button', class: 'link-btn', onclick: () => { location.hash = ''; start(); } }, 'Back to sign in')));
  pass.input.focus();
}

start();
