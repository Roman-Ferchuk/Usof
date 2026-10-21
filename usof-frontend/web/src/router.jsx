import { useSyncExternalStore } from 'react';

const subscribe = (cb) => {
  window.addEventListener('hashchange', cb);
  return () => window.removeEventListener('hashchange', cb);
};
const getHash = () => window.location.hash.slice(1) || '/';

export const useLocation = () => {
  const raw = useSyncExternalStore(subscribe, getHash);
  const [path, query = ''] = raw.split('?');
  return { path, params: Object.fromEntries(new URLSearchParams(query)) };
};

export const navigate = (to) => { window.location.hash = to; };

export function Link({ to, children, ...rest }) {
  return <a href={`#${to}`} {...rest}>{children}</a>;
}

export const matchPath = (pattern, path) => {
  const a = pattern.split('/');
  const b = path.split('/');
  if (a.length !== b.length) return null;
  const out = {};
  for (let i = 0; i < a.length; i += 1) {
    if (a[i].startsWith(':')) out[a[i].slice(1)] = decodeURIComponent(b[i]);
    else if (a[i] !== b[i]) return null;
  }
  return out;
};
