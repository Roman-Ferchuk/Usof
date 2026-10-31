/** Small DOM helpers: element factory, toasts, modals, forms, badges. No innerHTML anywhere (XSS-safe). */

export function h(tag, attrs, ...kids) {
  if (attrs !== null && attrs !== undefined && (typeof attrs !== 'object' || attrs instanceof Node || Array.isArray(attrs))) {
    kids.unshift(attrs);
    attrs = null;
  }
  const el = document.createElement(tag);
  let value;
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
    else if (k === 'class') el.className = v;
    else if (k === 'value') value = v;
    else el.setAttribute(k, v === true ? '' : v);
  }
  append(el, kids);
  if (value !== undefined) el.value = value;
  return el;
}

function append(el, kids) {
  for (const k of kids.flat(Infinity)) {
    if (k === null || k === undefined || k === false) continue;
    el.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
}

export const fmtDate = (v) => v ? new Date(v).toLocaleString('en-GB', { dateStyle: 'short', timeStyle: 'short' }) : '—';
export const truncate = (s, n = 120) => (s && s.length > n ? `${s.slice(0, n).trimEnd()}…` : s || '');

export function badge(text, kind = 'mute') { return h('span', { class: `badge ${kind}` }, text); }
export const statusBadge = (s) => s === 'active' ? badge('Active', 'ok') : badge('Inactive', 'warn');
export const lockBadge = (l) => l ? badge('Locked', 'lock') : null;

export function link(href, text, attrs = {}) { return h('a', { href, ...attrs }, text); }

export function btn(label, { kind = '', onclick, title, disabled } = {}) {
  return h('button', { type: 'button', class: `btn ${kind}`.trim(), onclick, title, disabled }, label);
}

export function ratingEl(n) {
  const v = Number(n) || 0;
  return h('span', { class: `num ${v > 0 ? 'rating-pos' : v < 0 ? 'rating-neg' : ''}` }, v > 0 ? `+${v}` : String(v));
}

export function avatar(user) {
  const initial = (user.fullName || user.login || '?').trim().charAt(0).toUpperCase();
  const box = h('span', { class: 'avatar', 'aria-hidden': 'true' }, initial);
  const pic = user.profilePicture;
  if (pic && pic.startsWith('uploads/')) {
    const img = h('img', { src: `/${pic}`, alt: '' });
    img.addEventListener('error', () => { box.textContent = initial; });
    box.textContent = '';
    box.append(img);
  }
  return box;
}

/* ---------- toasts ---------- */
export function toast(message, type = 'ok') {
  const el = h('div', { class: `toast ${type === 'error' ? 'error' : ''}`, role: type === 'error' ? 'alert' : 'status' }, message);
  document.getElementById('toasts').append(el);
  setTimeout(() => el.remove(), type === 'error' ? 6000 : 3200);
}

/* ---------- modal / drawer ---------- */
export function modal({ title, body, drawer = false, onClose }) {
  const previouslyFocused = document.activeElement;
  const close = () => {
    document.removeEventListener('keydown', onKey);
    backdrop.remove();
    previouslyFocused?.focus?.();
    onClose?.();
  };
  const onKey = (e) => { if (e.key === 'Escape') close(); };

  const dialog = h('div', { class: `modal ${drawer ? 'drawer' : ''}`, role: 'dialog', 'aria-modal': 'true', 'aria-label': title },
    h('div', { class: 'modal-head' },
      h('h2', title),
      btn('Close', { kind: 'small ghost', onclick: close })),
    h('div', { class: 'modal-body' }, body));

  const backdrop = h('div', { class: `backdrop ${drawer ? 'side-right' : ''}` }, dialog);
  backdrop.addEventListener('mousedown', (e) => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', onKey);
  document.body.append(backdrop);
  (dialog.querySelector('input:not([type=hidden]), textarea, select') || dialog.querySelector('button'))?.focus();
  return { close, dialog };
}

export function confirmBox({ title = 'Confirm action', message, confirmLabel = 'Confirm', danger = false }) {
  return new Promise((resolve) => {
    let answered = false;
    const answer = (v) => { answered = true; m.close(); resolve(v); };
    const m = modal({
      title,
      onClose: () => { if (!answered) resolve(false); },
      body: [
        h('p', message),
        h('div', { class: 'form-actions' },
          btn('Cancel', { onclick: () => answer(false) }),
          btn(confirmLabel, { kind: danger ? 'solid-danger' : 'primary', onclick: () => answer(true) })),
      ],
    });
  });
}

/**
 * Generic form dialog.
 * field: { name, label, type: text|email|password|number|textarea|select|checkbox|checkboxes|segmented|static, value, options, required, hint, placeholder }
 */
export function formModal({ title, fields, submitLabel = 'Save', danger = false, intro, onSubmit }) {
  const refs = {};
  const err = h('p', { class: 'form-error', role: 'alert', hidden: true });
  const submit = h('button', { type: 'submit', class: `btn ${danger ? 'solid-danger' : 'primary'}` }, submitLabel);

  const form = h('form', { class: 'form', novalidate: true },
    intro ? h('p', { class: 'muted' }, intro) : null,
    fields.map((f) => buildField(f, refs)),
    err,
    h('div', { class: 'form-actions' }, btn('Cancel', { onclick: () => m.close() }), submit));

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    err.hidden = true;
    const values = {};
    for (const f of fields) {
      if (f.type === 'static') continue;
      values[f.name] = readField(f, refs[f.name]);
      const empty = values[f.name] === '' || values[f.name] === null || (Array.isArray(values[f.name]) && !values[f.name].length);
      if (f.required && empty) {
        showErr(`Fill in the “${f.label}” field`);
        refs[f.name]?.focus?.();
        return;
      }
    }
    submit.disabled = true;
    try {
      await onSubmit(values);
      m.close();
    } catch (ex) {
      showErr(ex.message);
    } finally {
      submit.disabled = false;
    }
  });

  function showErr(msg) { err.textContent = msg; err.hidden = false; }
  const m = modal({ title, body: form });
  return m;
}

let uid = 0;
function buildField(f, refs) {
  const id = `f${++uid}`;
  const label = h('label', { for: id }, f.label, f.required ? ' *' : '');
  const hint = f.hint ? h('span', { class: 'hint' }, f.hint) : null;
  let control;

  switch (f.type) {
    case 'static':
      return h('div', { class: 'field' }, h('span', { class: 'label' }, f.label), h('div', { class: 'readonly-box' }, f.value ?? ''), hint);
    case 'textarea':
      control = h('textarea', { id, class: 'input', value: f.value ?? '', placeholder: f.placeholder }); break;
    case 'select':
      control = h('select', { id, class: 'input', value: f.value ?? '' },
        f.options.map((o) => h('option', { value: o.value }, o.label)));
      break;
    case 'checkbox':
      control = h('input', { id, type: 'checkbox', checked: !!f.value });
      refs[f.name] = control;
      return h('div', { class: 'field inline' }, control, h('label', { for: id }, f.label), hint);
    case 'checkboxes': {
      const set = new Set((f.value || []).map(String));
      const boxes = f.options.map((o) => ({ o, input: h('input', { type: 'checkbox', checked: set.has(String(o.value)) }) }));
      control = h('div', { class: 'checks', role: 'group', 'aria-label': f.label },
        boxes.length ? boxes.map(({ o, input }) => h('label', input, o.label)) : h('span', { class: 'muted' }, 'No options available'));
      control.boxes = boxes;
      refs[f.name] = control;
      return h('div', { class: 'field' }, h('span', { class: 'label' }, f.label, f.required ? ' *' : ''), control, hint);
    }
    case 'segmented': {
      const name = `seg${id}`;
      const radios = f.options.map((o) => ({ o, input: h('input', { type: 'radio', name, value: o.value, checked: o.value === f.value }) }));
      control = h('div', { class: 'seg', role: 'radiogroup', 'aria-label': f.label }, radios.map(({ o, input }) => h('label', input, o.label)));
      control.radios = radios;
      refs[f.name] = control;
      return h('div', { class: 'field' }, h('span', { class: 'label' }, f.label), control, hint);
    }
    default:
      control = h('input', {
        id, class: 'input', type: f.type || 'text', value: f.value ?? '', placeholder: f.placeholder,
        autocomplete: f.type === 'password' ? 'new-password' : 'off', min: f.type === 'number' ? 1 : null,
      });
  }
  refs[f.name] = control;
  return h('div', { class: 'field' }, label, control, hint);
}

function readField(f, ref) {
  switch (f.type) {
    case 'checkbox': return ref.checked;
    case 'checkboxes': return ref.boxes.filter((b) => b.input.checked).map((b) => b.o.value);
    case 'segmented': return ref.radios.find((r) => r.input.checked)?.o.value ?? null;
    case 'number': return ref.value.trim() === '' ? null : Number(ref.value);
    case 'password': return ref.value;
    case 'select': return ref.value;
    default: return ref.value.trim();
  }
}

/** Build fields without a dialog (used inside custom forms such as the post drawer). */
export function formFields(fields) {
  const refs = {};
  const el = h('div', { class: 'form' }, fields.map((f) => buildField(f, refs)));
  const read = (name) => readField(fields.find((f) => f.name === name), refs[name]);
  return { el, read };
}
