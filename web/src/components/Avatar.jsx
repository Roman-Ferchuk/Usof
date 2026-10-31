import { useEffect, useState } from 'react';

/* Shows the picture; falls back to the first letter when there is none or it cannot be loaded. */
export default function Avatar({ user, size = 32 }) {
  const [broken, setBroken] = useState(false);
  const style = { width: size, height: size, fontSize: size * 0.42 };
  const src = user && user.avatar;

  useEffect(() => { setBroken(false); }, [src]);

  if (src && !broken) {
    return <img className="avatar" src={src} alt="" style={style} onError={() => setBroken(true)} />;
  }
  return <span className="avatar" style={style} aria-hidden="true">{(user && user.login ? user.login : '?')[0]}</span>;
}
