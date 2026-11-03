import { useEffect, useState } from 'react';
import { Link } from '../../router';
import { api } from '../../api/client';
import { formatDate } from '../../utils';

const ATTENTION = [
  ['unconfirmed', 'users with an unconfirmed e-mail', 'users'],
  ['inactivePosts', 'hidden posts', 'posts'],
  ['inactiveComments', 'hidden comments', 'comments'],
  ['lockedPosts', 'locked posts', 'posts'],
];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.adminStats().then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <p className="field__error" role="alert">{error}</p>;
  if (!data) return <p className="muted">Loading…</p>;

  const { counts } = data;
  return (
    <>
      <div className="tiles">
        {['users', 'posts', 'comments', 'categories', 'likes'].map((k) => (
          <div className="tile" key={k}><b>{counts[k]}</b><span>{k}</span></div>
        ))}
      </div>

      <h2 className="section-title">Needs attention</h2>
      <ul className="admin-list">
        {ATTENTION.map(([key, label, tab]) => (
          <li key={key}>
            <span><b>{counts[key]}</b> {label}</span>
            <Link to={`/admin?tab=${tab}`}>Open {tab}</Link>
          </li>
        ))}
      </ul>

      <div className="grid-2">
        <section className="panel">
          <h2>Latest posts</h2>
          <ol className="board">
            {data.latestPosts.map((p) => (
              <li key={p.id}>
                <Link to={`/posts/${p.id}`} className="board__title">{p.title}</Link>
                <small className="muted">{p.authorLogin} · {formatDate(p.publishDate)}</small>
              </li>
            ))}
          </ol>
        </section>
        <section className="panel">
          <h2>Top users</h2>
          <ol className="board">
            {data.topUsers.map((u) => (
              <li key={u.id}>
                <Link to={`/profile/${u.id}`} className="board__title">{u.login}</Link>
                <b>{u.rating}</b>
              </li>
            ))}
          </ol>
        </section>
      </div>
    </>
  );
}
