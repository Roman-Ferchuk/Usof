import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../api/client';
import { toast } from '../store/uiSlice';

/* Admin-only: lock / unlock a post or a comment (locked items accept no new comments or votes). */
export default function LockButton({ kind, id, locked }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [on, setOn] = useState(Boolean(locked));
  if (!user || user.role !== 'admin') return null;

  const toggle = async () => {
    try {
      await (kind === 'posts' ? api.lockPost : api.lockComment)(id, !on);
      setOn(!on);
      dispatch(toast(on ? 'Unlocked' : 'Locked', 'ok'));
    } catch (e) { dispatch(toast(e.message)); }
  };
  return <button type="button" className={kind === 'posts' ? 'btn btn--ghost' : 'link'} onClick={toggle}>{on ? 'Unlock' : 'Lock'}</button>;
}
