import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FAV_PAGE, fetchFavorites } from '../store/favSlice';
import PostCard from '../components/PostCard';

export default function Favorites() {
  const dispatch = useDispatch();
  const user = useSelector((s) => s.auth.user);
  const { items, status, hasMore, error } = useSelector((s) => s.favorites);

  useEffect(() => {
    if (user) dispatch(fetchFavorites({ offset: 0 }));
  }, [user, dispatch]);

  if (!user) return <p className="empty"><a href="#/login">Log in</a> to see your saved posts.</p>;
  return (
    <>
      <h1>Saved posts</h1>
      {status === 'failed' && <p className="field__error" role="alert">{error}</p>}
      {status === 'done' && items.length === 0 && <p className="empty">Nothing saved yet. Press “Save” on a post to keep it here.</p>}
      {items.map((p) => <PostCard key={p.id} post={{ ...p, isFavorite: true }} />)}
      {status === 'loading' && <p className="muted">Loading…</p>}
      {hasMore && status !== 'loading' && (
        <div className="pager">
          <button type="button" className="btn btn--ghost" onClick={() => dispatch(fetchFavorites({ offset: items.length }))}>
            Load {FAV_PAGE} more
          </button>
        </div>
      )}
    </>
  );
}
