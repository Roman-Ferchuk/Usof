import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from '../../router';
import { api } from '../../api/client';
import { toast } from '../../store/uiSlice';
import useAdminList from './useAdminList';
import ListShell from './ListShell';
import Field from '../../components/Field';
import { maxLen, minLen, pattern, required, rules, validate } from '../../utils';

export default function Users() {
  const me = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [draft, setDraft] = useState('');
  const [filters, setFilters] = useState({ q: '', role: '', emailConfirmed: '' });
  const list = useAdminList('users', filters);
  const [editing, setEditing] = useState(null);
  const [errors, setErrors] = useState({});

  const startEdit = (u) => {
    setErrors({});
    setEditing({
      id: u.id, login: u.login, fullName: u.fullName, email: u.email, password: '',
    });
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    const rulesSet = {
      login: rules.login,
      fullName: rules.fullName,
      email: [required('Enter an e-mail'), pattern(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Enter a valid e-mail'), maxLen(255)],
    };
    if (editing.password) rulesSet.password = [minLen(8)];
    const errs = validate(editing, rulesSet);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const data = { login: editing.login.trim(), fullName: editing.fullName.trim(), email: editing.email.trim() };
    if (editing.password) data.password = editing.password;
    try {
      await api.updateUser(editing.id, data);
      dispatch(toast('User saved', 'ok'));
      setEditing(null);
      list.reload();
    } catch (err) { setErrors({ form: err.message }); }
  };

  const act = (fn, okText) => async () => {
    try {
      await fn();
      dispatch(toast(okText, 'ok'));
      list.reload();
    } catch (e) { dispatch(toast(e.message)); }
  };
  const patch = (p) => setFilters({ ...filters, ...p });

  const bar = (
    <form
      className="filters"
      aria-label="User filters"
      onSubmit={(e) => { e.preventDefault(); patch({ q: draft.trim() }); }}
    >
      <label className="filters__item">
        <span>Search</span>
        <input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Login, name or e-mail" />
      </label>
      <label className="filters__item">
        <span>Role</span>
        <select value={filters.role} onChange={(e) => patch({ role: e.target.value })}>
          <option value="">Any</option>
          <option value="user">user</option>
          <option value="admin">admin</option>
        </select>
      </label>
      <label className="filters__item">
        <span>E-mail</span>
        <select value={filters.emailConfirmed} onChange={(e) => patch({ emailConfirmed: e.target.value })}>
          <option value="">Any</option>
          <option value="true">Confirmed</option>
          <option value="false">Not confirmed</option>
        </select>
      </label>
      <button type="submit" className="btn filters__reset">Search</button>
    </form>
  );

  const editor = editing && (
    <form className="editor panel" onSubmit={saveEdit} noValidate aria-label="Edit user">
      <h2>Edit {editing.login}</h2>
      <Field label="Login" error={errors.login}>
        <input value={editing.login} onChange={(e) => setEditing({ ...editing, login: e.target.value })} />
      </Field>
      <Field label="Full name" error={errors.fullName}>
        <input value={editing.fullName} onChange={(e) => setEditing({ ...editing, fullName: e.target.value })} />
      </Field>
      <Field label="E-mail (a changed address must be confirmed again)" error={errors.email}>
        <input type="email" value={editing.email} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
      </Field>
      <Field label="New password (leave empty to keep the old one)" error={errors.password}>
        <input type="password" autoComplete="new-password" value={editing.password} onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
      </Field>
      {errors.form && <p className="field__error" role="alert">{errors.form}</p>}
      <div className="row__actions">
        <button type="submit" className="btn">Save</button>
        <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
      </div>
    </form>
  );

  return (
    <ListShell list={list} noun="user" filters={bar} before={editor}>
      <table className="table">
        <thead>
          <tr><th>User</th><th>E-mail</th><th>Rating</th><th>Posts</th><th>Role</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {list.rows.map((u) => {
            const self = String(u.id) === String(me.id);
            return (
              <tr key={u.id}>
                <td><Link to={`/profile/${u.id}`}>{u.login}</Link><small className="muted"> {u.fullName}</small></td>
                <td>
                  {u.email}
                  {!u.emailConfirmed && <span className="badge badge--warn">unconfirmed</span>}
                </td>
                <td>{u.rating}</td>
                <td>{u.postsCount}</td>
                <td>
                  <select
                    value={u.role}
                    disabled={self}
                    title={self ? 'You cannot change your own role' : undefined}
                    aria-label={`Role of ${u.login}`}
                    onChange={(e) => act(() => api.changeRole(u.id, e.target.value), 'Role changed')()}
                  >
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                </td>
                <td className="row__actions">
                  <button type="button" className="link" onClick={() => startEdit(u)}>Edit</button>
                  {!u.emailConfirmed && (
                    <button type="button" className="link" onClick={act(() => api.adminConfirmEmail(u.id), 'E-mail confirmed')}>Confirm e-mail</button>
                  )}
                  {!self && (
                    <button
                      type="button"
                      className="link"
                      onClick={() => window.confirm(`Delete ${u.login}? Their posts and comments are deleted too.`) && act(() => api.deleteUser(u.id), 'User deleted')()}
                    >
                      Delete
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ListShell>
  );
}
