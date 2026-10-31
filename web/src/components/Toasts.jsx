import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { dismissToast } from '../store/uiSlice';

function Toast({ toast }) {
  const dispatch = useDispatch();
  useEffect(() => {
    const t = setTimeout(() => dispatch(dismissToast(toast.id)), 4500);
    return () => clearTimeout(t);
  }, [toast.id, dispatch]);
  return (
    <div className={`toast toast--${toast.kind}`} role={toast.kind === 'error' ? 'alert' : 'status'}>
      <span>{toast.text}</span>
      <button type="button" className="link" onClick={() => dispatch(dismissToast(toast.id))} aria-label="Dismiss">×</button>
    </div>
  );
}

export default function Toasts() {
  const toasts = useSelector((s) => s.ui.toasts);
  if (!toasts.length) return null;
  return <div className="toasts">{toasts.map((t) => <Toast key={t.id} toast={t} />)}</div>;
}
