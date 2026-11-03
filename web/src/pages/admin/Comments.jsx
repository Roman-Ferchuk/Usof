import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from '../../router';
import { api } from '../../api/client';
import { toast } from '../../store/uiSlice';
import { excerpt, formatDate } from '../../utils';
import useAdminList from './useAdminList';
import ListShell from './ListShell';

export default function Comments() {
  const dispatch = useDispatch();
  const [draft, setDraft] = useState('');
  const [filters, setFilters] = useState({ q: '', status: '', locked: '' });
  const list = useAdminList('comments', filters);
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
      aria-label="Comment filters"
      onSubmit={(e) => { e.preventDefault(); patch({ q: draft.trim() }); }}
    >
      <label className="filters__item">
        <span>Search</span>
        <input type="search" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Comment text" />
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
    <ListShell list={list} noun="comment" filters={bar}>
      <table className="table">
        <thead>
          <tr><th>Comment</th><th>Author</th><th>Post</th><th>Date</th><th>Rating</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {list.rows.map((c) => {
            const hidden = c.status === 'inactive';
            return (
              <tr key={c.id}>
                <td>
                  {excerpt(c.content, 120)}
                  {hidden && <span className="badge badge--warn">hidden</span>}
                  {c.locked && <span className="badge">locked</span>}
                  {c.parentId && <small className="muted table__excerpt">reply to #{c.parentId}</small>}
                </td>
                <td><Link to={`/profile/${c.authorId}`}>{c.authorLogin}</Link></td>
                <td><Link to={`/posts/${c.postId}`}>{excerpt(c.postTitle, 40)}</Link></td>
                <td>{formatDate(c.publishDate)}</td>
                <td>{c.rating}</td>
                <td className="row__actions">
                  <button type="button" className="link" onClick={act(() => api.setCommentStatus(c.id, hidden ? 'active' : 'inactive'), hidden ? 'Comment is visible again' : 'Comment hidden')}>
                    {hidden ? 'Show' : 'Hide'}
                  </button>
                  <button type="button" className="link" onClick={act(() => api.lockComment(c.id, !c.locked), c.locked ? 'Unlocked' : 'Locked')}>
                    {c.locked ? 'Unlock' : 'Lock'}
                  </button>
                  <button
                    type="button"
                    className="link"
                    onClick={() => window.confirm('Delete this comment and its replies?') && act(() => api.deleteComment(c.id), 'Comment deleted')()}
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
