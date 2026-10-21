import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api, norm } from '../api/client';
import { setUser } from '../store/authSlice';
import { email, required, validate } from '../utils';
import Avatar from '../components/Avatar';
import Field from '../components/Field';
import Feed from '../components/Feed';

export default function Profile({ id }) {
  const me = useSelector((s) => s.auth.user);
  const dispatch = useDispatch();
  const [profile, setProfile] = useState(null);
  const [form, setForm] = useState({ login: '', fullName: '', email: '' });
  const [errors, setErrors] = useState({});
  const [saved, setSaved] = useState(false);
  const own = me && String(me.id) === String(id);

  useEffect(() => {
    api.user(id).then((raw) => {
      const u = norm.user(raw.data || raw);
      setProfile(u);
      setForm({ login: u.login, fullName: u.fullName, email: u.email });
    }).catch(() => setProfile(false));
  }, [id]);

  if (profile === false) return <p className="empty">Log in to view profiles.</p>;
  if (!profile) return <p className="muted">Loading…</p>;

  const save = async (e) => {
    e.preventDefault();
    const errs = validate(form, { login: [required()], email: [email()] });
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      await api.updateUser(id, form);
      setProfile({ ...profile, ...form });
      dispatch(setUser({ ...me, ...form }));
      setSaved(true);
    } catch (err) { setErrors({ form: err.message }); }
  };

  const onAvatar = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      await api.uploadAvatar(file);
      const raw = await api.user(id);
      const u = norm.user(raw.data || raw);
      setProfile(u);
      dispatch(setUser({ ...me, avatar: u.avatar }));
    } catch (err) { setErrors({ form: err.message }); }
  };

  return (
    <>
      <section className="profile">
        <Avatar user={profile} size={88} />
        <div>
          <h1>{profile.login}</h1>
          <p className="muted">{profile.fullName} · {profile.role} · rating {profile.rating}</p>
          {own && <label className="btn btn--ghost">Change photo<input type="file" accept="image/*" hidden onChange={onAvatar} /></label>}
        </div>
      </section>
      {own && (
        <form className="editor" onSubmit={save} noValidate>
          <Field label="Login" error={errors.login}><input value={form.login} onChange={(e) => setForm({ ...form, login: e.target.value })} /></Field>
          <Field label="Full name"><input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} /></Field>
          <Field label="Email" error={errors.email}><input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></Field>
          {errors.form && <p className="field__error" role="alert">{errors.form}</p>}
          {saved && <p role="status">Saved.</p>}
          <button type="submit" className="btn">Save changes</button>
        </form>
      )}
      <h2 className="section-title">{own ? 'Your posts' : `Posts by ${profile.login}`}</h2>
      <Feed authorId={id} />
    </>
  );
}
