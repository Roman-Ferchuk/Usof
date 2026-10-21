import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, navigate } from '../router';
import { qs } from '../api/client';
import { logout } from '../store/authSlice';
import Avatar from './Avatar';

export default function Header() {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [q, setQ] = useState('');

  const onSearch = (e) => {
    e.preventDefault();
    navigate(`/${qs({ q: q.trim() })}`);
  };
  const onLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  return (
    <header className="header">
      <div className="header__row">
        <Link to="/" className="brand">usof</Link>
        <form className="search" onSubmit={onSearch} role="search">
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search questions"
            aria-label="Search questions"
          />
        </form>
        <div className="who">
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
        <Link to="/">Questions</Link>
        <Link to="/?sort=likes">Top rated</Link>
        {user && <Link to="/new">Ask a question</Link>}
        {user && <Link to={`/profile/${user.id}`}>My posts</Link>}
        {user && <Link to="/favorites">Favorites</Link>}
        {user && user.role === 'admin' && <Link to="/admin">Admin</Link>}
      </nav>
    </header>
  );
}
