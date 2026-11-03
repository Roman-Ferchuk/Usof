import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api, norm } from '../api/client';
import { setUser } from '../store/authSlice';
import { toast } from '../store/uiSlice';
import { matches, required, rules, validate, validateImage } from '../utils';
import Avatar from '../components/Avatar';
import Field from '../components/Field';
import Feed from '../components/Feed';

export default function Profile({ id }) {
  const me = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [missing, setMissing] = useState('');
  const [form, setForm] = useState({ login: '', fullName: '' });
  const [errors, setErrors] = useState({});
  const [pw, setPw] = useState({ currentPassword: '', password: '', passwordConfirmation: '' });
  const [pwErrors, setPwErrors] = useState({});
  const meId = me && me.id;
  const own = meId !== undefined && meId !== null && String(meId) === String(id);

  useEffect(() => {
    api.user(id).then((raw) => {
      const u = norm.user(raw);
      setProfile(u);
      setForm({ login: u.login, fullName: u.fullName });
    }).catch((e) => setMissing(e.message));
  }, [id, meId]);

  if (missing) return <p className="empty">{missing}</p>;
  if (!profile) return <p className="muted">Loading…</p>;

  const save = async (e) => {
    e.preventDefault();
    const errs = validate(form, { login: rules.login, fullName: rules.fullName });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const data = { login: form.login.trim(), fullName: form.fullName.trim() };
      await api.updateUser(id, data);
      setProfile({ ...profile, ...data });
      dispatch(setUser({ ...me, ...data }));
      dispatch(toast('Profile saved', 'ok'));
    } catch (err) { setErrors({ form: err.message }); }
  };

  const savePassword = async (e) => {
    e.preventDefault();
    const errs = validate(pw, {
      currentPassword: [required('Enter your current password')],
      password: rules.password,
      passwordConfirmation: [matches('password', 'Passwords do not match')],
    });
    setPwErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await api.updateUser(id, pw);
      setPw({ currentPassword: '', password: '', passwordConfirmation: '' });
      dispatch(toast('Password changed. Use the new one next time you log in.', 'ok'));
    } catch (err) { setPwErrors({ form: err.message }); }
  };

  const onAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const problem = validateImage(file);
    if (problem) { dispatch(toast(problem)); e.target.value = ''; return; }
    try {
      const res = await api.uploadAvatar(file);
      const updated = norm.user(res && res.user ? res.user : res);
      setProfile({ ...profile, avatar: updated.avatar });
      dispatch(setUser({ ...me, avatar: updated.avatar }));
      dispatch(toast('Photo updated', 'ok'));
    } catch (err) { dispatch(toast(err.message)); }
  };

  return (
    <>
      <section className="profile">
        <Avatar user={profile} size={88} />
        <div>
          <h1>{profile.login}</h1>
          <p className="muted">{profile.fullName} · {profile.role} · rating <b>{profile.rating}</b></p>
          {own && (
            <label className="btn btn--ghost">
              Change photo
              <input type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={onAvatar} />
            </label>
          )}
        </div>
      </section>
      {own && (
        <form className="editor" onSubmit={save} noValidate>
          <Field label="Login" error={errors.login}><input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} /></Field>
          <Field label="Full name" error={errors.fullName}><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Email (cannot be changed here)"><input value={profile.email} readOnly disabled /></Field>
          {errors.form && <p className="field__error" role="alert">{errors.form}</p>}
          <button type="submit" className="btn">Save changes</button>
        </form>
      )}
      {own && (
        <details className="editor">
          <summary>Change password</summary>
          <form onSubmit={savePassword} noValidate>
            <Field label="Current password" error={pwErrors.currentPassword}>
              <input type="password" autoComplete="current-password" value={pw.currentPassword} onChange={(e) => setPw({ ...pw, currentPassword: e.target.value })} />
            </Field>
            <Field label="New password (at least 8 characters)" error={pwErrors.password}>
              <input type="password" autoComplete="new-password" value={pw.password} onChange={(e) => setPw({ ...pw, password: e.target.value })} />
            </Field>
            <Field label="Repeat new password" error={pwErrors.passwordConfirmation}>
              <input type="password" autoComplete="new-password" value={pw.passwordConfirmation} onChange={(e) => setPw({ ...pw, passwordConfirmation: e.target.value })} />
            </Field>
            {pwErrors.form && <p className="field__error" role="alert">{pwErrors.form}</p>}
            <button type="submit" className="btn">Change password</button>
          </form>
        </details>
      )}
      <h2 className="section-title">{own ? 'Your posts' : `Posts by ${profile.login}`}</h2>
      <Feed authorId={id} />
    </>
  );
}
