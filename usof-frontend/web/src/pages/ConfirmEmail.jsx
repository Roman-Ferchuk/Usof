import { useEffect, useState } from 'react';
import { api } from '../api/client';
import AuthLayout from './AuthLayout';

export default function ConfirmEmail({ token }) {
  const [state, setState] = useState({ status: 'loading', message: '' });

  useEffect(() => {
    api.confirmEmail(token)
      .then(() => setState({ status: 'ok', message: '' }))
      .catch((e) => setState({ status: 'error', message: e.message }));
  }, [token]);

  return (
    <AuthLayout title="Email confirmation" hint="">
      {state.status === 'loading' && <p className="muted">Confirming…</p>}
      {state.status === 'ok' && <p role="status">Email confirmed. <a href="#/login">Log in</a></p>}
      {state.status === 'error' && <p className="field__error" role="alert">{state.message || 'This link is invalid or expired.'}</p>}
    </AuthLayout>
  );
}
