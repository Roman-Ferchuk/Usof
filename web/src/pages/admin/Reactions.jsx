import { useState } from 'react';
import { useDispatch } from 'react-redux';
import { Link } from '../../router';
import { api } from '../../api/client';
import { toast } from '../../store/uiSlice';
import { excerpt, formatDateTime } from '../../utils';
import useAdminList from './useAdminList';
import ListShell from './ListShell';

export default function Reactions() {
  const dispatch = useDispatch();
  const [filters, setFilters] = useState({ type: '', target: '' });
  const list = useAdminList('likes', filters);
  const patch = (p) => setFilters({ ...filters, ...p });

  const remove = async (id) => {
    if (!window.confirm('Delete this reaction? The rating changes accordingly.')) return;
    try {
      await api.adminDeleteLike(id);
      dispatch(toast('Reaction deleted', 'ok'));
      list.reload();
    } catch (e) { dispatch(toast(e.message)); }
  };

  const bar = (
    <form className="filters" aria-label="Reaction filters" onSubmit={(e) => e.preventDefault()}>
      <label className="filters__item">
        <span>Type</span>
        <select value={filters.type} onChange={(e) => patch({ type: e.target.value })}>
          <option value="">Any</option>
          <option value="like">Likes</option>
          <option value="dislike">Dislikes</option>
        </select>
      </label>
      <label className="filters__item">
        <span>Target</span>
        <select value={filters.target} onChange={(e) => patch({ target: e.target.value })}>
          <option value="">Posts and comments</option>
          <option value="post">Posts</option>
          <option value="comment">Comments</option>
        </select>
      </label>
    </form>
  );

  return (
    <ListShell list={list} noun="reaction" filters={bar}>
      <table className="table">
        <thead>
          <tr><th>Type</th><th>Author</th><th>On</th><th>Date</th><th>Actions</th></tr>
        </thead>
        <tbody>
          {list.rows.map((l) => (
            <tr key={l.id}>
              <td>{l.type === 'like' ? '▲ like' : '▼ dislike'}</td>
              <td><Link to={`/profile/${l.authorId}`}>{l.authorLogin}</Link></td>
              <td>
                {l.postId
                  ? <Link to={`/posts/${l.postId}`}>{excerpt(l.postTitle, 60)}</Link>
                  : <span>comment: {excerpt(l.commentContent, 60)}</span>}
              </td>
              <td>{formatDateTime(l.publishDate)}</td>
              <td className="row__actions">
                <button type="button" className="link" onClick={() => remove(l.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </ListShell>
  );
}
