/** Thin fetch wrapper around the usof REST API + session storage for the admin JWT. */

const KEY = 'usof_admin_session';

export const session = {
  get() {
    try { return JSON.parse(sessionStorage.getItem(KEY)); } catch { return null; }
  },
  set(value) { sessionStorage.setItem(KEY, JSON.stringify(value)); },
  clear() { sessionStorage.removeItem(KEY); },
};

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/**
 * @param {string} method HTTP verb
 * @param {string} path  path starting with /api
 * @param {object} [body] JSON body (GET: converted to query string)
 */
export async function api(method, path, body) {
  const headers = {};
  const token = session.get()?.token;
  if (token) headers.Authorization = `Bearer ${token}`;

  let url = path;
  const init = { method, headers };

  if (method === 'GET' && body) {
    const qs = new URLSearchParams();
    for (const [k, v] of Object.entries(body)) {
      if (v !== undefined && v !== null && v !== '') qs.set(k, v);
    }
    const s = qs.toString();
    if (s) url += `?${s}`;
  } else if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
    init.body = JSON.stringify(body);
  }

  let res;
  try {
    res = await fetch(url, init);
  } catch {
    throw new ApiError(0, 'Cannot reach the server. Make sure the backend is running.');
  }

  let data = null;
  const text = await res.text();
  if (text) { try { data = JSON.parse(text); } catch { data = null; } }

  if (!res.ok) {
    const message = data?.error || data?.message || `Error ${res.status}`;
    if (res.status === 401 && token) window.dispatchEvent(new Event('usof:unauthorized'));
    throw new ApiError(res.status, message);
  }
  return data;
}

export const get = (p, q) => api('GET', p, q);
export const post = (p, b = {}) => api('POST', p, b);
export const patch = (p, b = {}) => api('PATCH', p, b);
export const del = (p) => api('DELETE', p);
