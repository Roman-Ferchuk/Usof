import { useState } from 'react';
import { useSelector } from 'react-redux';
import { Link } from '../router';
import { api } from '../api/client';
import { formatDate } from '../utils';
import Reactions from './Reactions';
import LockButton from './LockButton';

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
    nodes.sort((a, b) => sign * (a.likes - b.likes));
    nodes.forEach((n) => sort(n.replies));
  };
  sort(roots);
  return roots;
};

function ReplyForm({ submitLabel, onSubmit, onCancel }) {
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const submit = async (e) => {
    e.preventDefault();
    if (!text.trim()) { setError('Write something first'); return; }
    try { await onSubmit(text.trim()); setText(''); setError(''); } catch (err) { setError(err.message); }
  };
  return (
    <form className="reply" onSubmit={submit}>
      <textarea rows="3" value={text} onChange={(e) => setText(e.target.value)} aria-label="Comment" />
      {error && <em className="field__error" role="alert">{error}</em>}
      <div className="reply__btns">
        <button type="submit" className="btn">{submitLabel}</button>
        {onCancel && <button type="button" className="btn btn--ghost" onClick={onCancel}>Cancel</button>}
      </div>
    </form>
  );
}

function Node({ node, depth, reload }) {
  const user = useSelector((s) => s.auth.user);
  const [replying, setReplying] = useState(false);
  const own = user && (user.id === node.authorId || user.role === 'admin');
  const hidden = node.status === 'inactive';

  return (
    <li className="thread" style={{ '--depth': depth % 5 }}>
      <div className="comment">
        <Reactions kind="comments" id={node.id} likes={node.likes} />
        <div>
          <div className="row__meta">
            <Link to={`/profile/${node.authorId}`}>{node.author}</Link>
            <time>{formatDate(node.date)}</time>
            {hidden && <span className="tag">hidden</span>}
          </div>
          <p className={`comment__text${hidden ? ' is-hidden' : ''}`}>{node.content}</p>
          <div className="row__actions">
            {user && !node.locked && <button type="button" className="link" onClick={() => setReplying(true)}>Reply</button>}
            {own && (
              <button
                type="button"
                className="link"
                onClick={async () => { await api.setCommentStatus(node.id, hidden ? 'active' : 'inactive'); await reload(); }}
              >
                {hidden ? 'Show' : 'Hide'}
              </button>
            )}
            {own && (
              <button type="button" className="link" onClick={async () => { await api.deleteComment(node.id); await reload(); }}>Delete</button>
            )}
            <LockButton kind="comments" id={node.id} locked={node.locked} />
          </div>
          {replying && (
            <ReplyForm
              submitLabel="Post reply"
              onCancel={() => setReplying(false)}
              onSubmit={async (content) => { await api.replyToComment(node.id, { content }); setReplying(false); await reload(); }}
            />
          )}
        </div>
      </div>
      {node.replies.length > 0 && (
        <ul className="thread__list">
          {node.replies.map((r) => <Node key={r.id} node={r} depth={depth + 1} reload={reload} />)}
        </ul>
      )}
    </li>
  );
}

export default function Comments({ postId, comments, reload }) {
  const user = useSelector((s) => s.auth.user);
  const [order, setOrder] = useState('asc'); // default: ascending by likes, per the brief
  const tree = buildTree(comments, order);

  return (
    <section className="comments">
      <div className="comments__head">
        <h3>{comments.length} comments</h3>
        <button type="button" className="btn btn--ghost" onClick={() => setOrder(order === 'asc' ? 'desc' : 'asc')}>
          Likes: {order === 'asc' ? 'low to high' : 'high to low'}
        </button>
      </div>
      {user ? (
        <ReplyForm
          submitLabel="Post comment"
          onSubmit={async (content) => { await api.addComment(postId, { content }); await reload(); }}
        />
      ) : <p className="muted"><a href="#/login">Log in</a> to join the discussion.</p>}
      <ul className="thread__list">
        {tree.map((n) => <Node key={n.id} node={n} depth={0} reload={reload} />)}
      </ul>
    </section>
  );
}
