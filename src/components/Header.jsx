import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, navigate, useLocation } from '../router';
import { qs } from '../api/client';
import { logout } from '../store/authSlice';
import { clearFavorites } from '../store/favSlice';
import Avatar from './Avatar';
import ThemeToggle from './ThemeToggle';

export default function Header() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const { path, params } = useLocation();
  const [q, setQ] = useState(params.q || '');
  const searchRef = useRef(null);

  // keep the box in sync when the query changes from elsewhere (reset button, back button)
  useEffect(() => { setQ(path === '/' ? params.q || '' : ''); }, [path, params.q]);

  // "/" focuses the search box, like on GitHub (ignored while typing in a field)
  useEffect(() => {
    const onKey = (e) => {
      const tag = e.target.tagName;
      if (e.key !== '/' || e.ctrlKey || e.metaKey || ['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      e.preventDefault();
      searchRef.current.focus();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/${qs({ q: q.trim() })}`);
  };
  const onLogout = async () => {
    await dispatch(logout());
    dispatch(clearFavorites());
    navigate('/login');
  };

  const link = (to, label, active) => <Link to={to} className={active ? 'is-active' : undefined} aria-current={active ? 'page' : undefined}>{label}</Link>;
  const onHome = path === '/';
  const top = onHome && params.sort === 'likes';

  return (
    <header className="header">
      <div className="header__row">
        <Link to="/" className="brand">usof</Link>
        <form className="search" onSubmit={onSearch} role="search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            ref={searchRef}
            placeholder="Search questions  ( / )"
            aria-label="Search questions"
          />
        </form>
        <div className="who">
          <ThemeToggle />
          {user ? (
            <>
              <Link to={`/profile/${user.id}`} className="who__me" title="Your profile">
                <Avatar user={user} />
                <span>{user.login}<small>{user.role}</small></span>
              </Link>
              <button type="button" className="btn btn--ghost" onClick={onLogout}>Log out</button>
            </>
          ) : (
            <>
              <span className="who__me"><Avatar user={null} /><span>guest<small>not signed in</small></span></span>
              <Link to="/login" className="btn btn--ghost">Log in</Link>
              <Link to="/register" className="btn">Sign up</Link>
            </>
          )}
        </div>
      </div>
      <nav className="menu" aria-label="Main">
        {link('/', 'Latest', onHome && !top)}
        {link('/?sort=likes', 'Top rated', top)}
        {user && link('/new', 'Ask a question', path === '/new')}
        {user && link(`/profile/${user.id}`, 'My profile', path === `/profile/${user.id}`)}
        {user && link('/favorites', 'Saved', path === '/favorites')}
        {link('/stats', 'Statistics', path === '/stats')}
        {user && user.role === 'admin' && link('/admin', 'Admin', path === '/admin')}
      </nav>
    </header>
  );
}
