import { useDispatch, useSelector } from 'react-redux';
import { toggleFavorite } from '../store/favSlice';
import { toast } from '../store/uiSlice';

export default function FavoriteButton({ postId, initial = false }) {
  const user = useSelector((s) => s.auth.user);
  const override = useSelector((s) => s.favorites.overrides[String(postId)]);
  const dispatch = useDispatch();
  if (!user) return null;
  const on = override === undefined ? initial : override;

  const onClick = async () => {
    const res = await dispatch(toggleFavorite({ id: postId, on }));
    if (toggleFavorite.rejected.match(res)) dispatch(toast(res.payload || 'Could not update favorites'));
  };

  return (
    <button type="button" className={`link fav${on ? ' is-on' : ''}`} aria-pressed={on} onClick={onClick}>
      {on ? '★ Saved' : '☆ Save'}
    </button>
  );
}
