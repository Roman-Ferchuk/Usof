import { useRef } from 'react';
import { MAX_IMAGES } from '../config';
import { plural } from '../utils';

/*
 * Photos are added one by one (or several at once): every choice is appended to the list,
 * each photo has a preview and its own remove button.
 *   existing: images that are already saved on the post   [{ id, url }]
 *   added:    new files that are not uploaded yet         [{ key, name, url }]
 */
export default function ImagePicker({
  existing = [], added, onPick, onRemoveExisting, onRemoveAdded, error,
}) {
  const input = useRef(null);
  const total = existing.length + added.length;
  const full = total >= MAX_IMAGES;

  const onChange = (e) => {
    onPick([...e.target.files]);
    input.current.value = ''; // the same file can be chosen again after it was removed
  };

  return (
    <div className="picker">
      <div className="picker__head">
        <span>Photos</span>
        <small className="muted">{total} / {MAX_IMAGES} · JPEG, PNG or WEBP, up to 5 MB each</small>
      </div>

      <ul className="picker__list">
        {existing.map((img) => (
          <li key={`e${img.id}`} className="picker__item">
            <img src={img.url} alt="" />
            <button type="button" className="picker__remove" aria-label="Remove this photo" onClick={() => onRemoveExisting(img.id)}>×</button>
          </li>
        ))}
        {added.map((img) => (
          <li key={img.key} className="picker__item picker__item--new">
            <img src={img.url} alt={img.name} />
            <button type="button" className="picker__remove" aria-label={`Remove ${img.name}`} onClick={() => onRemoveAdded(img.key)}>×</button>
          </li>
        ))}
        {!full && (
          <li>
            <label className="picker__add">
              <input ref={input} type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={onChange} />
              <span aria-hidden="true">+</span>
              {total === 0 ? 'Add photo' : 'Add more'}
            </label>
          </li>
        )}
      </ul>

      {full && <small className="muted">The limit of {plural(MAX_IMAGES, 'photo')} is reached. Remove one to add another.</small>}
      {error && <em className="field__error" role="alert">{error}</em>}
    </div>
  );
}
