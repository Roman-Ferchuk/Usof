export const required = (msg = 'This field is required') => (v) => (v && String(v).trim() ? '' : msg);
export const minLen = (n) => (v) => (v && v.length >= n ? '' : `Use at least ${n} characters`);
export const email = () => (v) => (/^\S+@\S+\.\S+$/.test(v || '') ? '' : 'Enter a valid email address');
export const matches = (field, msg) => (v, all) => (v === all[field] ? '' : msg);

export const validate = (form, rules) => {
  const errors = {};
  Object.entries(rules).forEach(([field, fns]) => {
    const msg = fns.map((fn) => fn(form[field], form)).find(Boolean);
    if (msg) errors[field] = msg;
  });
  return errors;
};

export const formatDate = (d) => (d
  ? new Date(d).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
  : '');

export const excerpt = (html = '', n = 180) => {
  const text = html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > n ? `${text.slice(0, n).trimEnd()}…` : text;
};
