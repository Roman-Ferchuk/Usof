/*
 * The only file that knows the backend contract (routes, query names, field names).
 */
const BASE = '/api';

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
  let res;
  try {
    res = await fetch(`${BASE}${path}`, { method, headers, body: payload });
  } catch (e) {
    throw new Error('Cannot reach the server. Is the API running?');
  }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch (e) { data = text; }
  if (res.status === 401 && token && !/^\/auth\/(login|logout)/.test(path)) {
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('usof:unauthorized'));
  }
  if (!res.ok) {
    const err = new Error((data && (data.message || data.error)) || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

/* Backend returns paths such as "uploads/avatars/a.png"; the dev server proxies /uploads. */
export const fileUrl = (path) => {
  if (!path || /default-avatar/.test(path)) return null;
  return /^(https?:)?\/\//.test(path) || path.startsWith('/') ? path : `/${path}`;
};

const author = (a = {}, id) => ({
  id: a.id ?? id,
  login: a.login || 'unknown',
  fullName: a.fullName || '',
  avatar: fileUrl(a.profilePicture),
});

export const norm = {
  user: (u = {}) => ({
    id: u.id,
    login: u.login || 'guest',
    fullName: u.fullName || '',
    email: u.email || '',
    role: u.role || 'user',
    rating: Number(u.rating) || 0,
    avatar: fileUrl(u.profilePicture),
  }),
  post: (p = {}) => ({
    id: p.id,
    title: p.title || '',
    content: p.content || '',
    status: p.status,
    locked: Boolean(p.locked),
    author: author(p.author, p.authorId),
    authorId: p.authorId,
    date: p.publishDate,
    rating: Number(p.rating) || 0,
    likes: Number(p.likesCount) || 0,
    dislikes: Number(p.dislikesCount) || 0,
    myReaction: p.myReaction || null,
    isFavorite: Boolean(p.isFavorite),
    commentsCount: Number(p.commentsCount) || 0,
    views: Number(p.viewsCount) || 0,
    categories: p.categories || [],
    images: (p.images || []).map((i) => ({ id: i.id, url: fileUrl(i.imagePath) })).filter((i) => i.url),
  }),
  comment: (c = {}) => ({
    id: c.id,
    content: c.content || '',
    author: author(c.author, c.authorId),
    authorId: c.authorId,
    date: c.publishDate,
    rating: Number(c.rating) || 0,
    myReaction: c.myReaction || null,
    status: c.status,
    locked: Boolean(c.locked),
    parentId: c.parentId || null,
  }),
};

export const api = {
  login: (body) => request('/auth/login', { method: 'POST', body }),
  register: (body) => request('/auth/register', { method: 'POST', body }),
  confirmEmail: (token) => request(`/auth/confirm-email/${token}`),
  logout: () => request('/auth/logout', { method: 'POST' }),
  resetRequest: (body) => request('/auth/password-reset', { method: 'POST', body }),
  resetConfirm: (token, newPassword) => request(`/auth/password-reset/${token}`, { method: 'POST', body: { newPassword } }),

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

  /* params: page, limit, sort, order, categoryIds, dateFrom, dateTo, status, search, authorId */
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
  addPostImages: (id, files) => {
    const form = new FormData();
    files.forEach((f) => form.append('images', f));
    return request(`/posts/${id}/images`, { method: 'POST', form });
  },
  deletePostImage: (id, imageId) => request(`/posts/${id}/images/${imageId}`, { method: 'DELETE' }),
  updatePost: (id, body) => request(`/posts/${id}`, { method: 'PATCH', body }),
  /*
   * Admin moderation hides a post AND locks it, so the author cannot simply show it again
   * (authors may hide/show their own posts, but not a locked one).
   */
  moderatePost: async (id, hidden) => {
    if (hidden) {
      await request(`/posts/${id}`, { method: 'PATCH', body: { status: 'inactive' } });
      await request(`/posts/${id}/lock`, { method: 'PATCH', body: { locked: true } });
    } else {
      await request(`/posts/${id}/lock`, { method: 'PATCH', body: { locked: false } });
      await request(`/posts/${id}`, { method: 'PATCH', body: { status: 'active' } });
    }
  },
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

  viewPost: (id) => request(`/posts/${id}/view`, { method: 'POST' }),
  stats: () => request('/stats'),

  /* admin-only lists: params are page, limit and the filters of each list */
  adminStats: () => request('/admin/stats'),
  adminList: (kind, params) => request(`/admin/${kind}${qs(params)}`),
  adminDeleteLike: (id) => request(`/admin/likes/${id}`, { method: 'DELETE' }),
  adminConfirmEmail: (id) => request(`/admin/users/${id}/confirm-email`, { method: 'PATCH' }),
  adminSetPassword: (id, body) => request(`/admin/users/${id}/password`, { method: 'PATCH', body }),

  favorites: (params) => request(`/users/favorites${qs(params)}`),
  addFavorite: (id) => request(`/posts/${id}/favorite`, { method: 'POST' }),
  removeFavorite: (id) => request(`/posts/${id}/favorite`, { method: 'DELETE' }),
};
