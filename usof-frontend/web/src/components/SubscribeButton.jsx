import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { api } from '../api/client';

export default function SubscribeButton({ postId }) {
  const user = useSelector((s) => s.auth.user);
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.subscription(postId)
      .then((d) => setOn(Boolean(d && (d.subscribed ?? d.isSubscribed ?? d.status === 'subscribed'))))
      .catch(() => {});
  }, [postId, user]);

  if (!user) return null;
  const toggle = async () => {
    try {
      if (on) await api.unsubscribe(postId);
      else await api.subscribe(postId);
      setOn(!on);
    } catch (e) { /* leave state unchanged */ }
  };
  return <button type="button" className="btn btn--ghost" onClick={toggle}>{on ? 'Unsubscribe' : 'Subscribe to updates'}</button>;
}
