import { useCallback, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, navigate } from '../router';
import { api, norm } from '../api/client';
import { toast } from '../store/uiSlice';
import { formatDateTime, plural, readingMinutes, sameId } from '../utils';
import Avatar from '../components/Avatar';
import Reactions from '../components/Reactions';
import Comments from '../components/Comments';
import FavoriteButton from '../components/FavoriteButton';
import SubscribeButton from '../components/SubscribeButton';
import LockButton from '../components/LockButton';
import ShareMenu from '../components/ShareMenu';

export default function PostPage({ id }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [commentsError, setCommentsError] = useState('');

  const loadComments = useCallback(async () => {
    const data = await api.comments(id);
    setComments(data.map(norm.comment));
    setCommentsError('');
  }, [id]);

  const userId = user && user.id;

  // reload when the viewer changes, so "my vote" and "saved" always belong to the right person
  useEffect(() => {
    let stale = false;
    api.post(id)
      .then((raw) => { if (!stale) setPost(norm.post(raw)); })
      .catch((e) => { if (!stale) setError(e.message); });
    loadComments().catch((e) => { if (!stale) setCommentsError(e.message); });
    return () => { stale = true; };
  }, [id, userId, loadComments]);

  // count one view per browser session
  useEffect(() => {
    const key = `viewed:${id}`;
    try {
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, '1');
    } catch (e) { /* storage is blocked: count the view anyway */ }
    api.viewPost(id).catch(() => {});
  }, [id]);

  if (error) {
    return (
      <>
        <p className="field__error" role="alert">{error}</p>
        <p><Link to="/">Back to questions</Link></p>
      </>
    );
  }
  if (!post) return <p className="muted">Loading…</p>;

  const isAdmin = user && user.role === 'admin';
  const isOwner = user && sameId(user.id, post.authorId);
  const url = window.location.href;
  const inactive = post.status === 'inactive';

  const toggleStatus = async () => {
    try {
      const next = inactive ? 'active' : 'inactive';
      await api.updatePost(post.id, { status: next });
      setPost({ ...post, status: next });
      dispatch(toast(next === 'inactive' ? 'Post hidden from other users' : 'Post is visible again', 'ok'));
    } catch (e) { dispatch(toast(e.message)); }
  };
  const remove = async () => {
    if (!window.confirm('Delete this post? Its comments and votes are deleted too.')) return;
    try {
      await api.deletePost(post.id);
      dispatch(toast('Post deleted', 'ok'));
      navigate('/');
    } catch (e) { dispatch(toast(e.message)); }
  };

  return (
    <article className="post">
      <h1>
        {post.title}
        {inactive && <span className="badge badge--warn">inactive</span>}
        {post.locked && <span className="badge">locked</span>}
      </h1>
      <div className="row__meta">
        {post.categories.map((c) => <Link key={c.id} to={`/?category=${c.id}`} className="tag">{c.title}</Link>)}
        <Link to={`/profile/${post.authorId}`} className="byline"><Avatar user={post.author} size={22} />{post.author.login}</Link>
        <time dateTime={post.date}>{formatDateTime(post.date)}</time>
        <span>{readingMinutes(post.content)} min read</span>
        <span>{plural(post.views, 'view')}</span>
      </div>
      {inactive && <p className="notice">Only you{isAdmin && !isOwner ? ' and other admins' : ' and admins'} can see this post.</p>}
      <div className="post__layout">
        <Reactions kind="posts" id={post.id} rating={post.rating} myReaction={post.myReaction} locked={post.locked || inactive} />
        <div>
          <div className="post__content">{post.content}</div>
          {post.images.length > 0 && (
            <div className="gallery">
              {post.images.map((img) => (
                <a key={img.id} href={img.url} target="_blank" rel="noreferrer">
                  <img src={img.url} alt="" loading="lazy" onError={(e) => { e.currentTarget.parentElement.hidden = true; }} />
                </a>
              ))}
            </div>
          )}
        </div>
      </div>
      <div className="share">
        <FavoriteButton postId={post.id} initial={post.isFavorite} />
        <SubscribeButton postId={post.id} />
        {isOwner && <Link className="btn btn--ghost" to={`/posts/${post.id}/edit`}>Edit</Link>}
        {isAdmin && <button type="button" className="btn btn--ghost" onClick={toggleStatus}>{inactive ? 'Make active' : 'Make inactive'}</button>}
        <LockButton kind="posts" id={post.id} locked={post.locked} />
        {(isOwner || isAdmin) && <button type="button" className="btn btn--ghost btn--danger" onClick={remove}>Delete</button>}
        <ShareMenu url={url} title={post.title} />
      </div>
      {commentsError && <p className="field__error" role="alert">Could not load comments: {commentsError}</p>}
      <Comments postId={post.id} comments={comments} reload={loadComments} locked={post.locked} inactive={inactive} />
    </article>
  );
}
