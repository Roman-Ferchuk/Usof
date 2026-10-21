import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api, asList, norm } from '../api/client';
import { fetchCategories } from '../store/feedSlice';

export default function Admin() {
  const me = useSelector((s) => s.auth.user);
  const categories = useSelector((s) => s.feed.categories);
  const dispatch = useDispatch();
  const [users, setUsers] = useState([]);
  const [title, setTitle] = useState('');
  const [error, setError] = useState('');
  const isAdmin = me && me.role === 'admin';

  const loadUsers = () => api.users()
    .then((d) => setUsers(asList(d, 'users').map(norm.user)))
    .catch((e) => setError(e.message));

  useEffect(() => { if (isAdmin) loadUsers(); }, [isAdmin]);

  if (!isAdmin) return <p className="empty">This page is for admins.</p>;

  const run = async (fn) => {
    try { await fn(); setError(''); } catch (e) { setError(e.message); }
  };
  const addCategory = (e) => {
    e.preventDefault();
    if (!title.trim()) { setError('Enter a category title'); return; }
    run(async () => { await api.createCategory({ title: title.trim() }); setTitle(''); dispatch(fetchCategories()); });
  };

  return (
    <>
      <h1>Admin</h1>
      {error && <p className="field__error" role="alert">{error}</p>}
      <h2 className="section-title">Categories</h2>
      <form className="filters" onSubmit={addCategory}>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="New category" aria-label="New category" />
        <button type="submit" className="btn">Add category</button>
      </form>
      <ul className="admin-list">
        {categories.map((c) => (
          <li key={c.id}>
            <span>{c.title}</span>
            <span className="row__actions">
              <button type="button" className="link" onClick={() => {
                const next = window.prompt('New title', c.title);
                if (next && next.trim()) run(async () => { await api.updateCategory(c.id, { title: next.trim() }); dispatch(fetchCategories()); });
              }}
              >
                Rename
              </button>
              <button type="button" className="link" onClick={() => window.confirm(`Delete “${c.title}”?`) && run(async () => { await api.deleteCategory(c.id); dispatch(fetchCategories()); })}>Delete</button>
            </span>
          </li>
        ))}
      </ul>
      <h2 className="section-title">Users</h2>
      <ul className="admin-list">
        {users.map((u) => (
          <li key={u.id}>
            <span>{u.login} <small className="muted">{u.email}</small></span>
            <span className="row__actions">
              <select value={u.role} aria-label={`Role of ${u.login}`} onChange={(e) => run(async () => { await api.changeRole(u.id, e.target.value); loadUsers(); })}>
                <option value="user">user</option>
                <option value="admin">admin</option>
              </select>
              {u.id !== me.id && (
                <button type="button" className="link" onClick={() => window.confirm(`Delete ${u.login}?`) && run(async () => { await api.deleteUser(u.id); loadUsers(); })}>Delete</button>
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
