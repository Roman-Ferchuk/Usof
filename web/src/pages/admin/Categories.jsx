import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { api } from '../../api/client';
import { fetchCategories } from '../../store/feedSlice';
import { toast } from '../../store/uiSlice';
import { maxLen, minLen, required, validate } from '../../utils';
import Field from '../../components/Field';

const ruleSet = {
  title: [required('Enter a category title'), minLen(2), maxLen(255)],
};

export default function Categories() {
  const categories = useSelector((s) => s.feed.categories);
  const dispatch = useDispatch();
  const [form, setForm] = useState({ title: '', description: '' });
  const [errors, setErrors] = useState({});
  const [editing, setEditing] = useState(null);

  const run = async (fn, okText) => {
    try {
      await fn();
      await dispatch(fetchCategories());
      dispatch(toast(okText, 'ok'));
      return true;
    } catch (e) {
      dispatch(toast(e.message));
      return false;
    }
  };

  const add = async (e) => {
    e.preventDefault();
    const errs = validate(form, ruleSet);
    setErrors(errs);
    if (Object.keys(errs).length) return;
    const ok = await run(() => api.createCategory({ title: form.title.trim(), description: form.description.trim() }), 'Category added');
    if (ok) setForm({ title: '', description: '' });
  };

  const save = async (e) => {
    e.preventDefault();
    const errs = validate(editing, ruleSet);
    if (Object.keys(errs).length) { dispatch(toast(errs.title)); return; }
    const ok = await run(() => api.updateCategory(editing.id, { title: editing.title.trim(), description: editing.description.trim() }), 'Category saved');
    if (ok) setEditing(null);
  };

  return (
    <>
      <form className="editor" onSubmit={add} noValidate>
        <Field label="New category" error={errors.title}>
          <input value={form.title} maxLength={255} onChange={(e) => setForm({ ...form, title: e.target.value })} />
        </Field>
        <Field label="Description (optional)">
          <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </Field>
        <button type="submit" className="btn">Add category</button>
      </form>

      <ul className="admin-list">
        {categories.map((c) => (
          <li key={c.id}>
            {editing && editing.id === c.id ? (
              <form className="inline-edit" onSubmit={save} noValidate>
                <input aria-label="Title" value={editing.title} onChange={(e) => setEditing({ ...editing, title: e.target.value })} />
                <input aria-label="Description" value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} />
                <button type="submit" className="btn">Save</button>
                <button type="button" className="btn btn--ghost" onClick={() => setEditing(null)}>Cancel</button>
              </form>
            ) : (
              <>
                <span>{c.title}{c.description && <small className="muted"> {c.description}</small>}</span>
                <span className="row__actions">
                  <button type="button" className="link" onClick={() => setEditing({ id: c.id, title: c.title, description: c.description || '' })}>Edit</button>
                  <button
                    type="button"
                    className="link"
                    onClick={() => window.confirm(`Delete “${c.title}”? Posts stay, but lose this category.`) && run(() => api.deleteCategory(c.id), 'Category deleted')}
                  >
                    Delete
                  </button>
                </span>
              </>
            )}
          </li>
        ))}
      </ul>
    </>
  );
}
