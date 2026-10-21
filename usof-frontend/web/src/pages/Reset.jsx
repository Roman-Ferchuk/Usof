import { useState } from 'react';
import { api } from '../api/client';
import { email, matches, minLen, validate } from '../utils';
import Field from '../components/Field';
import AuthLayout from './AuthLayout';

export default function Reset({ token }) {
  const [form, setForm] = useState({ email: '', password: '', passwordConfirmation: '' });
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const bind = (k, type = 'text') => ({ type, value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    const rules = token
      ? { password: [minLen(6)], passwordConfirmation: [matches('password', 'Passwords do not match')] }
      : { email: [email()] };
    const errs = validate(form, rules);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      if (token) await api.resetConfirm(token, { password: form.password });
      else await api.resetRequest({ email: form.email });
      setMessage(token ? 'Password changed. You can log in now.' : 'Check your inbox for the reset link.');
    } catch (err) { setErrors({ form: err.message }); }
  };

  return (
    <AuthLayout title={token ? 'Choose a new password' : 'Reset your password'} hint={token ? '' : 'We will email you a link.'}>
      <form onSubmit={submit} noValidate>
        {token ? (
          <>
            <Field label="New password" error={errors.password}><input {...bind('password', 'password')} /></Field>
            <Field label="Repeat password" error={errors.passwordConfirmation}><input {...bind('passwordConfirmation', 'password')} /></Field>
          </>
        ) : <Field label="Email" error={errors.email}><input {...bind('email', 'email')} /></Field>}
        {errors.form && <p className="field__error" role="alert">{errors.form}</p>}
        {message && <p role="status">{message}</p>}
        <button type="submit" className="btn btn--wide">{token ? 'Save password' : 'Send link'}</button>
      </form>
    </AuthLayout>
  );
}
