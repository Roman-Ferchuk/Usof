import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../api/client';
import { toast } from '../store/uiSlice';

export default function SubscribeButton({ postId }) {
  const user = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [on, setOn] = useState(false);

  useEffect(() => {
    if (!user) return;
    api.subscription(postId).then((d) => setOn(Boolean(d && d.subscribed))).catch(() => {});
  }, [postId, user]);

  if (!user) return null;
  const toggle = async () => {
    try {
      if (on) await api.unsubscribe(postId);
      else await api.subscribe(postId);
      setOn(!on);
      dispatch(toast(on ? 'You will no longer get e-mails about this post' : 'We will e-mail you about changes and new comments', 'ok'));
    } catch (e) { dispatch(toast(e.message)); }
  };
  return <button type="button" className="btn btn--ghost" aria-pressed={on} onClick={toggle}>{on ? 'Following by e-mail' : 'Follow by e-mail'}</button>;
}
