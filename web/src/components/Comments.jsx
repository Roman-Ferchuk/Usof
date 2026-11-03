import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link } from '../router';
import { api } from '../api/client';
import { toast } from '../store/uiSlice';
import { formatDateTime, plural, sameId } from '../utils';
import Avatar from './Avatar';
import Reactions from './Reactions';
import LockButton from './LockButton';

/* Flat list from the API -> tree by parentId; every level is sorted by rating. */
const buildTree = (list, order) => {
  const byId = {};
  list.forEach((c) => { byId[c.id] = { ...c, replies: [] }; });
  const roots = [];
  Object.values(byId).forEach((c) => {
    if (c.parentId && byId[c.parentId]) byId[c.parentId].replies.push(c);
    else roots.push(c);
  });
  const sign = order === 'asc' ? 1 : -1;
  const sort = (nodes) => {
    nodes.sort((a, b) => sign * (a.rating - b.rating) || new Date(a.date) - new Date(b.date));
    nodes.forEach((n) => sort(n.replies));
  };
  sort(roots);
  return roots;
};

function ReplyForm({ submitLabel, onSubmit, onCancel, autoFocus }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) { setError('Write something first'); return; }
    setBusy(true);
    try { await onSubmit(text.trim()); setText(''); setError(''); } catch (err) { setError(err.message); }
    setBusy(false);
  };

  return (
    <form className="reply" onSubmit={submit} noValidate>
      <textarea rows="3" value={text} onChange={(e) => setText(e.target.value)} aria-label="Comment" autoFocus={autoFocus} />
      {error && <em className="field__error" role="alert">{error}</em>}
      <div className="reply__btns">
        <button type="submit" className="btn" disabled={busy}>{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function Node({ node, depth, reload, postLocked }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [replying, setReplying] = useState(false);
  const isAdmin = user && user.role === 'admin';
  const isOwner = user && sameId(user.id, node.authorId);
  const hidden = node.status === 'inactive';
  const canReply = user && !node.locked && !postLocked && !hidden;

  const run = (fn) => async () => {
    try { await fn(); await reload(); } catch (e) { dispatch(toast(e.message)); }
  };

  return (
    <li className="thread" style={{ '--depth': depth % 5 }}>
      <div className="comment">
        <Reactions kind="comments" id={node.id} rating={node.rating} myReaction={node.myReaction} locked={node.locked || postLocked} own={Boolean(isOwner)} />
        <div className="comment__body">
          <div className="row__meta">
            <Link to={`/profile/${node.authorId}`} className="byline"><Avatar user={node.author} size={20} />{node.author.login}</Link>
            <time dateTime={node.date}>{formatDateTime(node.date)}</time>
            {hidden && <span className="badge badge--warn">hidden</span>}
            {node.locked && <span className="badge">locked</span>}
          </div>
          <p className={`comment__text${hidden ? ' is-hidden' : ''}`}>{node.content}</p>
          <div className="row__actions">
            {canReply && <button type="button" className="link" onClick={() => setReplying(true)}>Reply</button>}
            {(isOwner || isAdmin) && (
              <button type="button" className="link" onClick={run(() => api.setCommentStatus(node.id, hidden ? 'active' : 'inactive'))}>
                {hidden ? 'Show' : 'Hide'}
              </button>
            )}
            {(isOwner || isAdmin) && (
              <button
                type="button"
                className="link"
                onClick={() => window.confirm('Delete this comment and its replies?') && run(() => api.deleteComment(node.id))()}
              >
                Delete
              </button>
            )}
            <LockButton kind="comments" id={node.id} locked={node.locked} />
          </div>
          {replying && (
            <ReplyForm
              autoFocus
              submitLabel="Post reply"
              onCancel={() => setReplying(false)}
              onSubmit={async (content) => { await api.replyToComment(node.id, { content }); setReplying(false); await reload(); }}
            />
          )}
        </div>
      </div>
      {node.replies.length > 0 && (
        <ul className="thread__list">
          {node.replies.map((r) => <Node key={r.id} node={r} depth={depth + 1} reload={reload} postLocked={postLocked} />)}
        </ul>
      )}
    </li>
  );
}

export default function Comments({ postId, comments, reload, locked, inactive }) {
  const user = useSelector((s) => s.auth.user);
  const [order, setOrder] = useState('asc'); // default: ascending by rating, per the brief
  const tree = buildTree(comments, order);
  const closed = locked || inactive;

  return (
    <section className="comments" aria-labelledby="comments-title">
      <div className="comments__head">
        <h2 id="comments-title">{plural(comments.length, 'comment')}</h2>
        {comments.length > 1 && (
          <button type="button" className="btn btn--ghost" onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
            Rating: {order === 'asc' ? 'lowest first' : 'highest first'}
          </button>
        )}
      </div>
      {closed && <p className="notice">{locked ? 'This post is locked: new comments and votes are disabled.' : 'This post is inactive: commenting is disabled.'}</p>}
      {!closed && (user ? (
        <ReplyForm
          submitLabel="Post comment"
          onSubmit={async (content) => { await api.addComment(postId, { content }); await reload(); }}
        />
      ) : <p className="muted"><a href="#/login">Log in</a> to join the discussion.</p>)}
      {comments.length === 0 && !closed && <p className="empty">No comments yet. Be the first to answer.</p>}
      <ul className="thread__list">
        {tree.map((n) => <Node key={n.id} node={n} depth={0} reload={reload} postLocked={closed} />)}
      </ul>
    </section>
  );
}
