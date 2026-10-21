import { useDispatch, useSelector } from 'react-redux';
import { Link } from '../router';
import { api } from '../api/client';
import { removePost } from '../store/feedSlice';
import { excerpt, formatDate } from '../utils';
import Reactions from './Reactions';
import FavoriteButton from './FavoriteButton';

export default function PostCard({ post }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const canEdit = user && (user.id === post.authorId || user.role === 'admin');

  const onDelete = async () => {
    if (!window.confirm('Delete this post?')) return;
    await api.deletePost(post.id);
    dispatch(removePost(post.id));
  };

  return (
    <article className="row">
      <Reactions kind="posts" id={post.id} likes={post.likes} />
      <div className="row__body">
        <h2><Link to={`/posts/${post.id}`}>{post.title}</Link></h2>
        <p className="row__text">{excerpt(post.content)}</p>
        <div className="row__meta">
          {post.categories.map((c) => <Link key={c.id} to={`/?category=${c.id}`} className="tag">{c.title}</Link>)}
          <span>by <Link to={`/profile/${post.authorId}`}>{post.author}</Link></span>
          <time>{formatDate(post.date)}</time>
          <span>{post.commentsCount} comments</span>
          <FavoriteButton postId={post.id} />
          {canEdit && (
            <span className="row__actions">
              <Link to={`/posts/${post.id}/edit`}>Edit</Link>
              <button type="button" className="link" onClick={onDelete}>Delete</button>
            </span>
          )}
        </div>
      </div>
    </article>
  );
}
