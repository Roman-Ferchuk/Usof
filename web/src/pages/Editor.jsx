import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { navigate } from '../router';
import { api, norm } from '../api/client';
import { toast } from '../store/uiSlice';
import { MAX_IMAGES } from '../config';
import { maxLen, minLen, required, sameId, validate, validateImage } from '../utils';
import Field from '../components/Field';

const ruleSet = {
  title: [required('Give your question a title'), minLen(3), maxLen(255)],
  content: [required('Describe the problem')],
};

export default function Editor({ id }) {
  const user = useSelector((s) => s.auth.user);
  const categories = useSelector((s) => s.feed.categories);
  const dispatch = useDispatch();
  const [form, setForm] = useState({ title: '', content: '', categories: [] });
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!id) return;
    api.post(id)
      .then((raw) => {
        const p = norm.post(raw);
        setForm({ title: p.title, content: p.content, categories: p.categories.map((c) => c.id) });
        if (user && !sameId(p.authorId, user.id)) setLoadError('Only the author can edit this post.');
      })
      .catch((e) => setLoadError(e.message));
  }, [id, user]);

  if (!user) return <p className="empty">Please <a href="#/login">log in</a> to write a post.</p>;
  if (loadError) return <p className="field__error" role="alert">{loadError}</p>;

  const toggle = (cid) => setForm({
    ...form,
    categories: form.categories.includes(cid) ? form.categories.filter((c) => c !== cid) : [...form.categories, cid],
  });

  const onFiles = (e) => {
    const picked = [...e.target.files];
    const problem = picked.length > MAX_IMAGES ? `Choose at most ${MAX_IMAGES} images` : picked.map(validateImage).find(Boolean);
    if (problem) {
      setErrors((prev) => ({ ...prev, files: problem }));
      setFiles([]);
      e.target.value = '';
      return;
    }
    setErrors((prev) => ({ ...prev, files: '' }));
    setFiles(picked);
  };

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form, ruleSet);
    if (!form.categories.length) errs.categories = 'Pick at least one category';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    setBusy(true);
    try {
      const payload = { ...form, title: form.title.trim(), content: form.content.trim() };
      const saved = id ? await api.updatePost(id, payload) : await api.createPost(payload, files);
      dispatch(toast(id ? 'Changes saved' : 'Question published', 'ok'));
      navigate(`/posts/${id || saved.id}`);
    } catch (err) { setErrors({ form: err.message }); }
    setBusy(false);
  };

  return (
    <form className="editor" onSubmit={submit} noValidate>
      <h1>{id ? 'Edit post' : 'Ask a question'}</h1>
      <Field label="Title" error={errors.title}>
        <input value={form.title} maxLength={255} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Details" error={errors.content}>
        <textarea rows="10" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </Field>
      {!id && (
        <Field label="Images (up to 5, JPEG, PNG or WEBP, 5 MB each)" error={errors.files}>
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onFiles} />
        </Field>
      )}
      <fieldset className="chips">
        <legend>Categories</legend>
        {categories.map((c) => (
          <label key={c.id} className={form.categories.includes(c.id) ? 'chip is-on' : 'chip'} title={c.description || undefined}>
            <input type="checkbox" checked={form.categories.includes(c.id)} onChange={() => toggle(c.id)} />
            {c.title}
          </label>
        ))}
        {errors.categories && <em className="field__error" role="alert">{errors.categories}</em>}
      </fieldset>
      {errors.form && <p className="field__error" role="alert">{errors.form}</p>}
      <button type="submit" className="btn" disabled={busy}>{id ? 'Save changes' : 'Publish'}</button>
    </form>
  );
}
