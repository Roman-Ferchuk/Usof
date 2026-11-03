import { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { navigate } from '../router';
import { api, norm } from '../api/client';
import { toast } from '../store/uiSlice';
import { MAX_IMAGES } from '../config';
import { maxLen, minLen, required, sameId, validate, validateImage } from '../utils';
import Field from '../components/Field';
import ImagePicker from '../components/ImagePicker';

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
  const [existing, setExisting] = useState([]); // photos already saved on the post
  const [removedIds, setRemovedIds] = useState([]); // saved photos the author removed (deleted on save)
  const [added, setAdded] = useState([]); // new photos: { key, file, name, url }
  const [loadError, setLoadError] = useState('');
  const [busy, setBusy] = useState(false);
  const counter = useRef(0);
  const addedRef = useRef(added);
  addedRef.current = added;

  // free the preview URLs when the page is left
  useEffect(() => () => addedRef.current.forEach((a) => URL.revokeObjectURL(a.url)), []);

  useEffect(() => {
    if (!id) return;
    api.post(id)
      .then((raw) => {
        const p = norm.post(raw);
        setForm({ title: p.title, content: p.content, categories: p.categories.map((c) => c.id) });
        setExisting(p.images);
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

  const kept = existing.filter((img) => !removedIds.includes(img.id));

  /* Every choice is appended to what was already chosen. Bad files are skipped with a message. */
  const onPick = (picked) => {
    const problems = [];
    const fresh = [];
    let room = MAX_IMAGES - kept.length - added.length;
    picked.forEach((file) => {
      const problem = validateImage(file);
      const same = (a) => a.file.name === file.name && a.file.size === file.size && a.file.lastModified === file.lastModified;
      if (problem) problems.push(problem);
      else if (added.some(same) || fresh.some(same)) problems.push(`“${file.name}” is already added`);
      else if (room <= 0) problems.push(`Only ${MAX_IMAGES} photos fit, “${file.name}” was skipped`);
      else {
        room -= 1;
        counter.current += 1;
        fresh.push({
          key: counter.current, file, name: file.name, url: URL.createObjectURL(file),
        });
      }
    });
    setErrors((prev) => ({ ...prev, files: problems.join('. ') }));
    if (fresh.length) setAdded([...added, ...fresh]);
  };

  const removeAdded = (key) => {
    const gone = addedRef.current.find((a) => a.key === key);
    if (gone) URL.revokeObjectURL(gone.url);
    setAdded((prev) => prev.filter((a) => a.key !== key));
    setErrors((prev) => ({ ...prev, files: '' }));
  };

  const removeExisting = (imageId) => {
    setRemovedIds((prev) => [...prev, imageId]);
    setErrors((prev) => ({ ...prev, files: '' }));
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
      const files = added.map((a) => a.file);
      let postId = id;
      if (id) {
        await api.updatePost(id, payload);
        await Promise.all(removedIds.map((imageId) => api.deletePostImage(id, imageId)));
        if (files.length) await api.addPostImages(id, files);
      } else {
        postId = (await api.createPost(payload, files)).id;
      }
      dispatch(toast(id ? 'Changes saved' : 'Question published', 'ok'));
      navigate(`/posts/${postId}`);
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
      <ImagePicker
        existing={kept}
        added={added}
        onPick={onPick}
        onRemoveExisting={removeExisting}
        onRemoveAdded={removeAdded}
        error={errors.files}
      />
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
