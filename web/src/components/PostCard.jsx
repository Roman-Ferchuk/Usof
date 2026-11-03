import { useDispatch, useSelector } from 'react-redux';
import { Link } from '../router';
import { api } from '../api/client';
import { removePost } from '../store/feedSlice';
import { toast } from '../store/uiSlice';
import { excerpt, formatDate, plural, sameId } from '../utils';
import Avatar from './Avatar';
import Reactions from './Reactions';
import FavoriteButton from './FavoriteButton';

export default function PostCard({ post, onDeleted }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const canEditContent = user && sameId(user.id, post.authorId);
  const canEdit = user && (canEditContent || user.role === 'admin');
  const cover = post.images[0];

  const onDelete = async () => {
    if (!window.confirm('Delete this post? Its comments and votes are deleted too.')) return;
    try {
      await api.deletePost(post.id);
      dispatch(removePost(post.id));
      dispatch(toast('Post deleted', 'ok'));
      if (onDeleted) onDeleted(post.id);
    } catch (e) { dispatch(toast(e.message)); }
  };

  return (
    <article className={`row${post.status === 'inactive' ? ' row--inactive' : ''}`}>
      <Reactions kind="posts" id={post.id} rating={post.rating} myReaction={post.myReaction} locked={post.locked} />
      <div className="row__body">
        <h2>
          <Link to={`/posts/${post.id}`}>{post.title}</Link>
          {post.status === 'inactive' && <span className="badge badge--warn">inactive</span>}
          {post.locked && <span className="badge">locked</span>}
        </h2>
        <p className="row__text">{excerpt(post.content)}</p>
        <div className="row__meta">
          {post.categories.map((c) => <Link key={c.id} to={`/?category=${c.id}`} className="tag">{c.title}</Link>)}
          <Link to={`/profile/${post.authorId}`} className="byline">
            <Avatar user={post.author} size={20} />
            {post.author.login}
          </Link>
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          <Link to={`/posts/${post.id}`}>{plural(post.commentsCount, 'comment')}</Link>
          <span title="Views">{plural(post.views, 'view')}</span>
          <FavoriteButton postId={post.id} initial={post.isFavorite} />
          {canEdit && (
            <span className="row__actions">
              {canEditContent && <Link to={`/posts/${post.id}/edit`}>Edit</Link>}
              <button type="button" className="link" onClick={onDelete}>Delete</button>
            </span>
          )}
        </div>
      </div>
      {cover && <img className="row__cover" src={cover.url} alt="" loading="lazy" onError={(e) => { e.currentTarget.hidden = true; }} />}
    </article>
  );
}
