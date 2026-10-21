/*
 * Single place that knows the backend contract. If your usof-backend uses
 * different routes / field names, adjust ONLY this file.
 */
const BASE = '/api';

const pick = (o, ...keys) => {
  const k = keys.find((key) => o && o[key] !== undefined && o[key] !== null);
  return k ? o[k] : undefined;
};

export const qs = (params) => {
  const p = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== '') p.set(k, v);
  });
  const s = p.toString();
  return s ? `?${s}` : '';
};

async function request(path, { method = 'GET', body, form } = {}) {
  const headers = {};
  const token = localStorage.getItem('token');
  if (token) headers.Authorization = `Bearer ${token}`;
  let payload;
  if (form) payload = form;
  else if (body) {
    headers['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }
  const res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (!res.ok) {
    const err = new Error((data && (data.message || data.error)) || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const norm = {
  user: (u = {}) => ({
    id: pick(u, 'id', 'userId'),
    login: pick(u, 'login', 'username') || 'guest',
    fullName: pick(u, 'fullName', 'full_name') || '',
    email: u.email || '',
    role: u.role || 'user',
    rating: u.rating || 0,
    avatar: pick(u, 'avatar', 'profilePicture', 'profile_picture'),
  }),
  post: (p = {}) => ({
    id: p.id,
    title: p.title || '',
    content: p.content || '',
    status: p.status,
    locked: !!pick(p, 'locked', 'is_locked'),
    author: pick(p, 'author', 'login', 'authorLogin') || 'unknown',
    authorId: pick(p, 'authorId', 'author_id', 'userId', 'user_id'),
    date: pick(p, 'publishDate', 'publish_date', 'createdAt', 'created_at'),
    likes: pick(p, 'likes', 'rating', 'likesCount') || 0,
    commentsCount: pick(p, 'commentsCount', 'comments_count') || 0,
    categories: (p.categories || []).map((c) => (typeof c === 'string' ? { id: c, title: c } : c)),
  }),
  comment: (c = {}) => ({
    id: c.id,
    content: c.content || '',
    author: pick(c, 'author', 'login', 'authorLogin') || 'unknown',
    authorId: pick(c, 'authorId', 'author_id', 'userId', 'user_id'),
    date: pick(c, 'publishDate', 'publish_date', 'createdAt', 'created_at'),
    likes: pick(c, 'likes', 'rating', 'likesCount') || 0,
    status: c.status,
    locked: !!pick(c, 'locked', 'is_locked'),
    parentId: pick(c, 'parentId', 'parent_id', 'commentId', 'comment_id') || null,
  }),
};

export const asList = (d, ...keys) => {
  if (Array.isArray(d)) return d;
  const k = keys.concat('data', 'items').find((key) => Array.isArray(d && d[key]));
  return k ? d[k] : [];
};

export const pageInfo = (d, items, page, limit) => {
  const total = pick(d || {}, 'total', 'totalCount', 'count');
  const pages = pick(d || {}, 'totalPages', 'pages');
  if (pages) return pages;
  if (total) return Math.max(1, Math.ceil(total / limit));
  return items.length >= limit ? page + 1 : page;
};

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  confirmEmail: (token) => request(`/auth/confirm-email/${token}`),
  logout: () => request('/auth/logout', { method: 'POST' }),
  resetRequest: (body) => request('/auth/password-reset', { method: 'POST', body }),
  resetConfirm: (token, body) => request(`/auth/password-reset/${token}`, { method: 'POST', body }),

  users: () => request('/users'),
  user: (id) => request(`/users/${id}`),
  createUser: (body) => request('/users', { method: 'POST', body }),
  updateUser: (id, body) => request(`/users/${id}`, { method: 'PATCH', body }),
  changeRole: (id, role) => request(`/users/${id}/role`, { method: 'PATCH', body: { role } }),
  deleteUser: (id) => request(`/users/${id}`, { method: 'DELETE' }),
  uploadAvatar: (file) => {
    const form = new FormData();
    form.append('avatar', file);
    return request('/users/avatar', { method: 'PATCH', form });
  },

  posts: (params) => request(`/posts${qs(params)}`),
  post: (id) => request(`/posts/${id}`),
  createPost: (body, files = []) => {
    if (!files.length) return request('/posts', { method: 'POST', body });
    const form = new FormData();
    form.append('title', body.title);
    form.append('content', body.content);
    body.categories.forEach((c) => form.append('categories', c));
    files.forEach((f) => form.append('images', f));
    return request('/posts', { method: 'POST', form });
  },
  updatePost: (id, body) => request(`/posts/${id}`, { method: 'PATCH', body }),
  lockPost: (id, locked) => request(`/posts/${id}/lock`, { method: 'PATCH', body: { locked } }),
  deletePost: (id) => request(`/posts/${id}`, { method: 'DELETE' }),
  subscription: (id) => request(`/posts/${id}/subscribe`),
  subscribe: (id) => request(`/posts/${id}/subscribe`, { method: 'POST' }),
  unsubscribe: (id) => request(`/posts/${id}/subscribe`, { method: 'DELETE' }),

  comments: (postId) => request(`/posts/${postId}/comments`),
  addComment: (postId, body) => request(`/posts/${postId}/comments`, { method: 'POST', body }),
  replyToComment: (id, body) => request(`/comments/${id}/reply`, { method: 'POST', body }),
  setCommentStatus: (id, status) => request(`/comments/${id}`, { method: 'PATCH', body: { status } }),
  lockComment: (id, locked) => request(`/comments/${id}/lock`, { method: 'PATCH', body: { locked } }),
  deleteComment: (id) => request(`/comments/${id}`, { method: 'DELETE' }),

  react: (kind, id, type) => request(`/${kind}/${id}/like`, { method: 'POST', body: { type } }),
  unreact: (kind, id) => request(`/${kind}/${id}/like`, { method: 'DELETE' }),

  categories: () => request('/categories'),
  createCategory: (body) => request('/categories', { method: 'POST', body }),
  updateCategory: (id, body) => request(`/categories/${id}`, { method: 'PATCH', body }),
  deleteCategory: (id) => request(`/categories/${id}`, { method: 'DELETE' }),

  favorites: () => request('/users/favorites'),
  addFavorite: (id) => request(`/posts/${id}/favorite`, { method: 'POST' }),
  removeFavorite: (id) => request(`/posts/${id}/favorite`, { method: 'DELETE' }),
};
