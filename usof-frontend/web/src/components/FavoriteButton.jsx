import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite } from '../store/favSlice';

export default function FavoriteButton({ postId }) {
  const user = useSelector((s) => s.auth.user);
  const ids = useSelector((s) => s.favorites.ids);
  const dispatch = useDispatch();
  if (!user) return null;
  const on = ids.includes(String(postId));
  return (
    <button
      type="button"
      className={`link fav${on ? ' is-on' : ''}`}
      aria-pressed={on}
      onClick={() => dispatch(toggleFavorite({ id: postId, on }))}
    >
      {on ? '★ Saved' : '☆ Save'}
    </button>
  );
}
