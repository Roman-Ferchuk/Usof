import { useSelector } from 'react-redux';
import { Link, useLocation } from '../router';
import Dashboard from './admin/Dashboard';
import Users from './admin/Users';
import Posts from './admin/Posts';
import Comments from './admin/Comments';
import Categories from './admin/Categories';
import Reactions from './admin/Reactions';

const TABS = [
  ['dashboard', 'Overview', Dashboard],
  ['users', 'Users', Users],
  ['posts', 'Posts', Posts],
  ['comments', 'Comments', Comments],
  ['categories', 'Categories', Categories],
  ['reactions', 'Reactions', Reactions],
];

/* The whole admin panel lives inside the web app: one login, one design, guarded by the user's role. */
export default function Admin() {
  const me = useSelector((s) => s.auth.user);
  const { params } = useLocation();

  if (!me || me.role !== 'admin') {
    return <p className="empty">This page is for admins. <Link to="/login">Log in</Link> with an admin account.</p>;
  }

  const [current, , Tab] = TABS.find(([key]) => key === params.tab) || TABS[0];

  return (
    <>
      <h1>Admin panel</h1>
      <nav className="tabs" aria-label="Admin sections">
        {TABS.map(([key, label]) => (
          <Link
            key={key}
            to={key === 'dashboard' ? '/admin' : `/admin?tab=${key}`}
            className={key === current ? 'is-active' : undefined}
            aria-current={key === current ? 'page' : undefined}
          >
            {label}
          </Link>
        ))}
      </nav>
      <Tab key={current} />
    </>
  );
}
