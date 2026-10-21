import { useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api/client';

export default function LockButton({ kind, id, locked }) {
  const user = useSelector((s) => s.auth.user);
  const [on, setOn] = useState(Boolean(locked));
  if (!user || user.role !== 'admin') return null;
  const toggle = async () => {
    try {
      await (kind === 'posts' ? api.lockPost : api.lockComment)(id, !on);
      setOn(!on);
    } catch (e) { /* ignore */ }
  };
  return <button type="button" className={kind === 'posts' ? 'btn btn--ghost' : 'link'} onClick={toggle}>{on ? 'Unlock' : 'Lock'}</button>;
}
