import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchFavorites } from '../store/favSlice';
import PostCard from '../components/PostCard';

export default function Favorites() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { items, status } = useSelector((s) => s.favorites);

  useEffect(() => {
    if (user) dispatch(fetchFavorites());
  }, [user, dispatch]);

  if (!user) return <p className="empty"><a href="#/login">Log in</a> to see your saved posts.</p>;
  return (
    <>
      <h1>Saved posts</h1>
      {status === 'loading' && <p className="muted">Loading…</p>}
      {status === 'failed' && <p className="field__error">Could not load favorites.</p>}
      {status === 'done' && items.length === 0 && <p className="empty">Nothing saved yet. Tap “Save” on a post to keep it here.</p>}
      {items.map((p) => <PostCard key={p.id} post={p} />)}
    </>
  );
}
