import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, navigate } from '../router';
import { clearAuthError, login } from '../store/authSlice';
import { required, validate } from '../utils';
import Field from '../components/Field';
import AuthLayout from './AuthLayout';

export default function Login() {
  const dispatch = useDispatch();
  const { status, error } = useSelector((s) => s.auth);
  const [form, setForm] = useState({ login: '', password: '' });
  const [errors, setErrors] = useState({});
  const bind = (k) => ({ value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  useEffect(() => { dispatch(clearAuthError()); }, [dispatch]);

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form, { login: [required('Enter your login or email')], password: [required('Enter your password')] });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const res = await dispatch(login({ login: form.login.trim(), password: form.password }));
    if (login.fulfilled.match(res)) navigate('/');
  };

  return (
    <AuthLayout title="Welcome back" hint="Log in to ask, answer and vote.">
      <form onSubmit={submit} noValidate>
        <Field label="Login or email" error={errors.login}><input autoComplete="username" {...bind('login')} /></Field>
        <Field label="Password" error={errors.password}><input type="password" autoComplete="current-password" {...bind('password')} /></Field>
        {error && <p className="field__error" role="alert">{error}</p>}
        <button type="submit" className="btn btn--wide" disabled={status === 'loading'}>{status === 'loading' ? 'Logging in…' : 'Log in'}</button>
      </form>
      <p className="muted"><Link to="/reset">Forgot password?</Link> · <Link to="/register">Create an account</Link></p>
    </AuthLayout>
  );
}
