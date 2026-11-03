import { useState } from 'react';
import { Link } from '../router';
import { api } from '../api/client';
import { email, matches, rules, validate } from '../utils';
import Field from '../components/Field';
import AuthLayout from './AuthLayout';

const ruleSet = {
  login: rules.login,
  fullName: rules.fullName,
  email: [email()],
  password: rules.password,
  passwordConfirmation: [matches('password', 'Passwords do not match')],
};

export default function Register() {
  const [form, setForm] = useState({ login: '', fullName: '', email: '', password: '', passwordConfirmation: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const bind = (k, type = 'text') => ({ type, value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form, ruleSet);
    setErrors(errs);
    setServerError('');
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const res = await api.register({ ...form, login: form.login.trim(), email: form.email.trim() });
      setSentTo(res.email);
    } catch (err) { setServerError(err.message); }
    setBusy(false);
  };

  if (sentTo) {
    return (
      <AuthLayout title="Check your inbox" hint={`We sent a confirmation link to ${sentTo}. Open it, then log in. The link works for 24 hours.`}>
        <Link to="/login" className="btn">Go to login</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" hint="It takes a minute. You will confirm your email afterwards.">
      <form onSubmit={submit} noValidate>
        <Field label="Login" error={errors.login}><input autoComplete="username" {...bind('login')} /></Field>
        <Field label="Full name" error={errors.fullName}><input autoComplete="name" {...bind('fullName')} /></Field>
        <Field label="Email" error={errors.email}><input autoComplete="email" {...bind('email', 'email')} /></Field>
        <Field label="Password (8+ characters)" error={errors.password}><input autoComplete="new-password" {...bind('password', 'password')} /></Field>
        <Field label="Repeat password" error={errors.passwordConfirmation}><input autoComplete="new-password" {...bind('passwordConfirmation', 'password')} /></Field>
        {serverError && <p className="field__error" role="alert">{serverError}</p>}
        <button type="submit" className="btn btn--wide" disabled={busy}>{busy ? 'Creating…' : 'Sign up'}</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
