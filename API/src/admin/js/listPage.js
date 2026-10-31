import { h, btn } from './ui.js';

/**
 * Reusable "filters + table + pager" page used by all entity views.
 *
 * @param {object} cfg
 * @param {string} cfg.title
 * @param {string} [cfg.hint]
 * @param {(params:object)=>Promise<{data:object[], total:number, page:number, pages:number, limit:number}>} cfg.load
 * @param {object[]} [cfg.filters]  { name, label, type: search|select|number, options }
 * @param {object[]} cfg.columns    { label, render(row) }
 * @param {(row:object, refresh:Function)=>Node[]} [cfg.rowActions]
 * @param {(refresh:Function)=>Node[]} [cfg.toolbar]
 * @param {(row:object)=>boolean} [cfg.dimmed]
 * @param {URLSearchParams} cfg.query initial filter values
 * @returns {{el: HTMLElement, refresh: Function}}
 */
export function listPage({ title, hint, load, filters = [], columns, rowActions, toolbar, dimmed, query, pageSize = 15, emptyText = 'No records found' }) {
  const state = { page: 1 };
  const values = Object.fromEntries(filters.map((f) => [f.name, query.get(f.name) ?? '']));

  const body = h('div', { class: 'card' });
  const refreshBtn = () => refresh();
  const head = h('div', { class: 'page-head' },
    h('div', h('h1', title), hint ? h('p', hint) : null),
    h('div', { class: 'toolbar' }, toolbar ? toolbar(refreshBtn) : null));

  const filterBar = filters.length ? h('div', { class: 'filters', role: 'search' }, filters.map(buildFilter)) : null;
  const el = h('section', { class: 'page' }, head, filterBar, body);

  function buildFilter(f) {
    const id = `flt-${f.name}`;
    let timer;
    let control;
    const onChange = (delay) => () => {
      clearTimeout(timer);
      timer = setTimeout(() => { values[f.name] = control.value.trim(); state.page = 1; refresh(); }, delay);
    };
    if (f.type === 'select') {
      control = h('select', { id, class: 'input', value: values[f.name], onchange: onChange(0) },
        h('option', { value: '' }, 'All'), f.options.map((o) => h('option', { value: o.value }, o.label)));
    } else {
      control = h('input', {
        id, class: 'input', type: f.type === 'number' ? 'number' : 'search', min: f.type === 'number' ? 1 : null,
        value: values[f.name], placeholder: f.placeholder, oninput: onChange(f.type === 'number' ? 450 : 300),
      });
    }
    return h('label', { class: `f-${f.type}` }, f.label, control);
  }

  async function refresh() {
    body.replaceChildren(h('div', { class: 'state-box', role: 'status' }, 'Loading…'));
    try {
      const params = { page: state.page, limit: pageSize };
      for (const [k, v] of Object.entries(values)) if (v !== '') params[k] = v;
      const res = await load(params);

      if (!res.data.length && state.page > 1) { state.page = Math.max(1, res.pages); return refresh(); }
      if (!res.data.length) {
        body.replaceChildren(h('div', { class: 'state-box' }, h('strong', emptyText), 'Change the filters or add a new record.'));
        return;
      }

      const hasActions = !!rowActions;
      const table = h('table',
        h('thead', h('tr', columns.map((c) => h('th', { scope: 'col' }, c.label)), hasActions ? h('th', { scope: 'col', class: 'actions' }, '') : null)),
        h('tbody', res.data.map((row) => h('tr', { class: dimmed?.(row) ? 'is-off' : '' },
          columns.map((c) => h('td', { class: c.class || '' }, c.render(row))),
          hasActions ? h('td', { class: 'actions' }, h('div', { class: 'row-actions' }, rowActions(row, refresh))) : null))));

      const from = (res.page - 1) * res.limit + 1;
      const to = from + res.data.length - 1;
      const pager = h('div', { class: 'pager' },
        h('span', { class: 'num' }, `${from}–${to} of ${res.total}`),
        h('div', { class: 'btns' },
          btn('Previous', { kind: 'small', disabled: res.page <= 1, onclick: () => { state.page = res.page - 1; refresh(); } }),
          h('span', { class: 'num' }, `${res.page} / ${res.pages}`),
          btn('Next', { kind: 'small', disabled: res.page >= res.pages, onclick: () => { state.page = res.page + 1; refresh(); } })));

      body.replaceChildren(h('div', { class: 'table-wrap' }, table), pager);
    } catch (e) {
      body.replaceChildren(h('div', { class: 'state-box', role: 'alert' },
        h('strong', 'Could not load data'), e.message, h('div', { style: 'margin-top:10px' }, btn('Try again', { onclick: refresh }))));
    }
  }

  refresh();
  return { el, refresh };
}
