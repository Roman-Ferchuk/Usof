import { useCallback, useEffect, useState } from 'react';
import { Link } from '../router';
import { api, asList, norm } from '../api/client';
import { formatDate } from '../utils';
import Reactions from '../components/Reactions';
import Comments from '../components/Comments';
import FavoriteButton from '../components/FavoriteButton';
import SubscribeButton from '../components/SubscribeButton';
import LockButton from '../components/LockButton';

export default function PostPage({ id }) {
  const [post, setPost] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const loadComments = useCallback(async () => {
    const data = await api.comments(id);
    setComments(asList(data, 'comments').map(norm.comment));
  }, [id]);

  useEffect(() => {
    api.post(id)
      .then((raw) => setPost(norm.post(raw.data || raw)))
      .catch((e) => setError(e.message));
    loadComments().catch(() => {});
  }, [id, loadComments]);

  if (error) return <p className="field__error">{error}</p>;
  if (!post) return <p className="muted">Loading…</p>;

  const url = window.location.href;
  const copy = async () => { await navigator.clipboard.writeText(url); setCopied(true); };

  return (
    <article className="post">
      <h1>{post.title}</h1>
      <div className="row__meta">
        {post.categories.map((c) => <Link key={c.id} to={`/?category=${c.id}`} className="tag">{c.title}</Link>)}
        <span>by <Link to={`/profile/${post.authorId}`}>{post.author}</Link></span>
        <time>{formatDate(post.date)}</time>
      </div>
      <div className="post__layout">
        <Reactions kind="posts" id={post.id} likes={post.likes} />
        <div className="post__content">{post.content}</div>
      </div>
      <div className="share">
        <FavoriteButton postId={post.id} />
        <SubscribeButton postId={post.id} />
        <LockButton kind="posts" id={post.id} locked={post.locked} />
        <button type="button" className="btn btn--ghost" onClick={copy}>{copied ? 'Link copied' : 'Copy link'}</button>
        <a className="btn btn--ghost" target="_blank" rel="noreferrer" href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`}>Share on Facebook</a>
        <a className="btn btn--ghost" target="_blank" rel="noreferrer" href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(post.title)}`}>Share on X</a>
      </div>
      <Comments postId={post.id} comments={comments} reload={loadComments} />
    </article>
  );
}
