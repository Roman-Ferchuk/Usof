export const avatarUrl = (a) => {
  if (!a) return null;
  return /^(https?:)?\/\//.test(a) || a.startsWith('/') ? a : `/${a}`;
};

export default function Avatar({ user, size = 32 }) {
  const src = avatarUrl(user && user.avatar);
  const style = { width: size, height: size, fontSize: size * 0.42 };
  if (src) return <img className="avatar" src={src} alt="" style={style} />;
  return <span className="avatar" style={style} aria-hidden="true">{(user && user.login ? user.login : '?')[0]}</span>;
}
