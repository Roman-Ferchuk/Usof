import { useState } from 'react';
import { Link } from '../router';
import { api } from '../api/client';
import { email, matches, rules, validate } from '../utils';
import Field from '../components/Field';
import AuthLayout from './AuthLayout';

export default function Reset({ token }) {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirmation: '' });
  const [errors, setErrors] = useState({});
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);
  const bind = (k, type = 'text') => ({ type, value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    const ruleSet = token
      ? { password: rules.password, passwordConfirmation: [matches('password', 'Passwords do not match')] }
      : { email: [email()] };
    const errs = validate(form, ruleSet);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      if (token) await api.resetConfirm(token, form.password);
      else await api.resetRequest({ email: form.email.trim() });
      setDone(true);
    } catch (err) { setErrors({ form: err.message }); }
    setBusy(false);
  };

  if (done) {
    return (
      <AuthLayout
        title={token ? 'Password changed' : 'Check your inbox'}
        hint={token ? 'You can log in with the new password.' : 'If this address is registered, a reset link is on its way. It works for 15 minutes.'}
      >
        {token && <Link to="/login" className="btn">Go to login</Link>}
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title={token ? 'Choose a new password' : 'Reset your password'} hint={token ? 'Use at least 8 characters.' : 'Enter your email and we will send you a link.'}>
      <form onSubmit={submit} noValidate>
        {token ? (
          <>
            <Field label="New password" error={errors.password}><input autoComplete="new-password" {...bind('password', 'password')} /></Field>
            <Field label="Repeat password" error={errors.passwordConfirmation}><input autoComplete="new-password" {...bind('passwordConfirmation', 'password')} /></Field>
          </>
        ) : <Field label="Email" error={errors.email}><input autoComplete="email" {...bind('email', 'email')} /></Field>}
        {errors.form && <p className="field__error" role="alert">{errors.form}</p>}
        <button type="submit" className="btn btn--wide" disabled={busy}>{token ? 'Save password' : 'Send link'}</button>
      </form>
    </AuthLayout>
  );
}
