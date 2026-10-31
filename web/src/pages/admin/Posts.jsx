import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from '../../router';
import { api } from '../../api/client';
import { toast } from '../../store/uiSlice';
import { excerpt, formatDate } from '../../utils';
import useAdminList from './useAdminList';
import ListShell from './ListShell';

export default function Posts() {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '', locked: '' });
  const list = useAdminList('posts', filters);
  const patch = (p) => setFilters({ ...filters, ...p });

  const act = (fn, okText) => async () => {
    try {
      await fn();
      dispatch(toast(okText, 'ok'));
      list.reload();
    } catch (e) { dispatch(toast(e.message)); }
  };

  const bar = (
    <form
      className="filters"
      aria-label="Post filters"
      onSubmit={(e) => { e.preventDefault(); patch({ q: draft.trim() }); }}
    >
      <label className="filters__item">
        <span>Search</span>
        <input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Title or text" />
      </label>
      <label className="filters__item">
        <span>Status</span>
        <select value={filters.status} onChange={(e) => patch({ status: e.target.value })}>
          <option value="">Any</option>
          <option value="active">Active</option>
          <option value="inactive">Hidden</option>
        </select>
      </label>
      <label className="filters__item">
        <span>Locked</span>
        <select value={filters.locked} onChange={(e) => patch({ locked: e.target.value })}>
          <option value="">Any</option>
          <option value="true">Locked</option>
          <option value="false">Not locked</option>
        </select>
      </label>
      <button type="submit" className="btn filters__reset">Search</button>
    </form>
  );

  return (
    <ListShell list={list} noun="post" filters={bar}>
      <table className="table">
        <thead>
          <tr><th>Post</th><th>Author</th><th>Date</th><th>Rating</th><th>Comments</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {list.rows.map((p) => {
            const hidden = p.status === 'inactive';
            return (
              <tr key={p.id}>
                <td>
                  <Link to={`/posts/${p.id}`}>{p.title}</Link>
                  {hidden && <span className="badge badge--warn">hidden</span>}
                  {p.locked && <span className="badge">locked</span>}
                  <small className="muted table__excerpt">{excerpt(p.content, 90)}</small>
                </td>
                <td><Link to={`/profile/${p.authorId}`}>{p.authorLogin}</Link></td>
                <td>{formatDate(p.publishDate)}</td>
                <td>{p.rating}</td>
                <td>{p.commentsCount}</td>
                <td className="row__actions">
                  <button type="button" className="link" onClick={act(() => api.updatePost(p.id, { status: hidden ? 'active' : 'inactive' }), hidden ? 'Post is visible again' : 'Post hidden')}>
                    {hidden ? 'Show' : 'Hide'}
                  </button>
                  <button type="button" className="link" onClick={act(() => api.lockPost(p.id, !p.locked), p.locked ? 'Unlocked' : 'Locked')}>
                    {p.locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    type="button"
                    className="link"
                    onClick={() => window.confirm('Delete this post with its comments and votes?') && act(() => api.deletePost(p.id), 'Post deleted')()}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </ListShell>
  );
}
