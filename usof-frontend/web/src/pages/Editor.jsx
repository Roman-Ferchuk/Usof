import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import { navigate } from '../router';
import { api, norm } from '../api/client';
import { required, validate } from '../utils';
import Field from '../components/Field';

export default function Editor({ id }) {
  const user = useSelector((s) => s.auth.user);
  const categories = useSelector((s) => s.feed.categories);
  const [form, setForm] = useState({ title: '', content: '', categories: [] });
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);

  useEffect(() => {
    if (!id) return;
    api.post(id).then((raw) => {
      const p = norm.post(raw.data || raw);
      setForm({ title: p.title, content: p.content, categories: p.categories.map((c) => c.id) });
    });
  }, [id]);

  if (!user) return <p className="empty">Please <a href="#/login">log in</a> to write a post.</p>;

  const toggle = (cid) => setForm({
    ...form,
    categories: form.categories.includes(cid) ? form.categories.filter((c) => c !== cid) : [...form.categories, cid],
  });

  const submit = async (e) => {
    e.preventDefault();
    const errs = validate(form, {
      title: [required('Give your question a title')],
      content: [required('Describe the problem')],
    });
    if (!form.categories.length) errs.categories = 'Pick at least one category';
    setErrors(errs);
    if (Object.keys(errs).length) return;
    try {
      const saved = id ? await api.updatePost(id, form) : await api.createPost(form, files);
      navigate(`/posts/${id || (saved.data || saved).id}`);
    } catch (err) { setErrors({ form: err.message }); }
  };

  return (
    <form className="editor" onSubmit={submit} noValidate>
      <h1>{id ? 'Edit post' : 'Ask a question'}</h1>
      <Field label="Title" error={errors.title}>
        <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
      </Field>
      <Field label="Details" error={errors.content}>
        <textarea rows="10" value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} />
      </Field>
      {!id && (
        <Field label="Images (up to 5)">
          <input type="file" accept="image/*" multiple onChange={(e) => setFiles([...e.target.files].slice(0, 5))} />
        </Field>
      )}
      <fieldset className="chips">
        <legend>Categories</legend>
        {categories.map((c) => (
          <label key={c.id} className={form.categories.includes(c.id) ? 'chip is-on' : 'chip'}>
            <input type="checkbox" checked={form.categories.includes(c.id)} onChange={() => toggle(c.id)} />
            {c.title}
          </label>
        ))}
        {errors.categories && <em className="field__error" role="alert">{errors.categories}</em>}
      </fieldset>
      {errors.form && <p className="field__error" role="alert">{errors.form}</p>}
      <button type="submit" className="btn">{id ? 'Save changes' : 'Publish'}</button>
    </form>
  );
}
