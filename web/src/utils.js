import { IMAGE_TYPES, MAX_IMAGE_MB } from './config';

/* Validation rules mirror the backend rules, so the user sees the message before the request. */
export const required = (msg = 'This field is required') => (v) => (v && String(v).trim() ? '' : msg);
export const minLen = (n, label = 'Use') => (v) => (v && String(v).trim().length >= n ? '' : `${label} at least ${n} characters`);
export const maxLen = (n) => (v) => (!v || String(v).trim().length <= n ? '' : `Use at most ${n} characters`);
export const pattern = (re, msg) => (v) => (!v || re.test(v) ? '' : msg);
export const email = () => (v) => (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || '').trim()) ? '' : 'Enter a valid email address');
export const matches = (field, msg) => (v, all) => (v === all[field] ? '' : msg);

export const rules = {
  login: [required('Pick a login'), minLen(3), maxLen(45), pattern(/^[a-zA-Z0-9_.-]+$/, 'Letters, digits, dot, dash and underscore only')],
  fullName: [required('Enter your name'), minLen(2), maxLen(45)],
  password: [required('Enter a password'), minLen(8)],
};

export const validate = (form, ruleSet) => {
  const errors = {};
  Object.entries(ruleSet).forEach(([field, fns]) => {
    const msg = fns.map((fn) => fn(form[field], form)).find(Boolean);
    if (msg) errors[field] = msg;
  });
  return errors;
};

export const formatDate = (d) => (d
  ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  : '');

export const formatDateTime = (d) => (d
  ? new Date(d).toLocaleString(undefined, { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
  : '');

export const excerpt = (text = '', n = 180) => {
  const clean = text.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return clean.length > n ? `${clean.slice(0, n).trimEnd()}…` : clean;
};

/* Same id may arrive as a number (API) or as a string (URL), so compare as strings. */
export const sameId = (a, b) => a !== undefined && a !== null && b !== undefined && b !== null && String(a) === String(b);

/* Returns an error message for an unsuitable image, or '' when the file is fine. */
export const validateImage = (file) => {
  if (!IMAGE_TYPES.includes(file.type)) return `“${file.name}” is not a JPEG, PNG or WEBP image`;
  if (file.size > MAX_IMAGE_MB * 1024 * 1024) return `“${file.name}” is larger than ${MAX_IMAGE_MB} MB`;
  return '';
};

/* About 200 words a minute, never less than one minute. */
export const readingMinutes = (text = '') => Math.max(1, Math.round(text.trim().split(/\s+/).length / 200));

export const plural = (n, one, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;
