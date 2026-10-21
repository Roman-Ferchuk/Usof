import { useState } from 'react';
import { Link } from '../router';
import { api } from '../api/client';
import { email, matches, minLen, required, validate } from '../utils';
import Field from '../components/Field';
import AuthLayout from './AuthLayout';

const rules = {
  login: [required('Pick a login'), minLen(3)],
  fullName: [required('Enter your name')],
  email: [email()],
  password: [minLen(6)],
  passwordConfirmation: [matches('password', 'Passwords do not match')],
};

export default function Register() {
  const [form, setForm] = useState({ login: '', fullName: '', email: '', password: '', passwordConfirmation: '' });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [done, setDone] = useState(false);
  const bind = (k, type = 'text') => ({ type, value: form[k], onChange: (e) => setForm({ ...form, [k]: e.target.value }) });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form, rules);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await api.register(form);
      setDone(true);
    } catch (err) { setServerError(err.message); }
  };

  if (done) {
    return (
      <AuthLayout title="Check your inbox" hint="We sent a confirmation link to your email. Confirm it, then log in.">
        <Link to="/login" className="btn">Go to login</Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Create your account" hint="It takes a minute.">
      <form onSubmit={submit} noValidate>
        <Field label="Login" error={errors.login}><input autoComplete="username" {...bind('login')} /></Field>
        <Field label="Full name" error={errors.fullName}><input autoComplete="name" {...bind('fullName')} /></Field>
        <Field label="Email" error={errors.email}><input autoComplete="email" {...bind('email', 'email')} /></Field>
        <Field label="Password" error={errors.password}><input autoComplete="new-password" {...bind('password', 'password')} /></Field>
        <Field label="Repeat password" error={errors.passwordConfirmation}><input autoComplete="new-password" {...bind('passwordConfirmation', 'password')} /></Field>
        {serverError && <p className="field__error" role="alert">{serverError}</p>}
        <button type="submit" className="btn btn--wide">Sign up</button>
      </form>
      <p className="muted">Already registered? <Link to="/login">Log in</Link></p>
    </AuthLayout>
  );
}
