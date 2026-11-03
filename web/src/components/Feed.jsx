import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { navigate, useLocation } from '../router';
import { qs } from '../api/client';
import { fetchFeed } from '../store/feedSlice';
import { DEFAULT_LIMIT, LIMITS, SORTS, STATUSES } from '../config';
import { plural } from '../utils';
import PostCard from './PostCard';
import Pagination from './Pagination';

const DEFAULTS = { sort: 'date', order: 'desc', limit: DEFAULT_LIMIT };
const MIN_DATE = '1970-01-01';
const MAX_DATE = '2100-12-31';

/* Date input with a local draft. While the year is typed digit by digit the browser reports
   0002-.., 0020-.., 0202-.. ; those values must not reach the URL (and the API), and a half-typed
   date must not be overwritten from the URL. The filter is applied only for a complete, sane date. */
function DateFilter({ label, value, min, max, onCommit }) {
  const [draft, setDraft] = useState(value);

  useEffect(() => { setDraft(value); }, [value]);

  const handleChange = (e) => {
    const next = e.target.value;
    setDraft(next);
    const complete = /^\d{4}-\d{2}-\d{2}$/.test(next) && next >= MIN_DATE && next <= MAX_DATE;
    if (next === '' || complete) onCommit(next);
  };

  return (
    <label className="filters__item">
      <span>{label}</span>
      <input type="date" value={draft} min={min || MIN_DATE} max={max || MAX_DATE} onChange={handleChange} />
    </label>
  );
}

/* Posts list with filters, sorting and pagination. Every control lives in the URL, so links can be shared. */
export default function Feed({ authorId }) {
  const dispatch = useDispatch();
  const { path, params } = useLocation();
  const user = useSelector((s) => s.auth.user);
  const { items, pages, total, status, error, categories } = useSelector((s) => s.feed);

  const limit = Number(params.limit);
  const query = {
    page: Math.max(1, Math.floor(Number(params.page)) || 1),
    limit: LIMITS.includes(limit) ? limit : DEFAULTS.limit,
    sort: SORTS.some(([v]) => v === params.sort) ? params.sort : DEFAULTS.sort,
    order: params.order === 'asc' ? 'asc' : DEFAULTS.order,
    category: params.category || '',
    from: params.from || '',
    to: params.to || '',
    status: params.status || '',
    q: params.q || '',
  };
  const key = JSON.stringify({ query, authorId, uid: user && user.id });

  useEffect(() => {
    dispatch(fetchFeed({ ...query, authorId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dispatch]);

  // the requested page does not exist any more (filters changed, posts deleted): jump to the last one
  useEffect(() => {
    if (status === 'done' && pages > 0 && query.page > pages) {
      navigate(`${path}${qs({ ...params, page: pages > 1 ? pages : '' })}`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, pages, query.page]);

  const set = (patch) => navigate(`${path}${qs({ ...params, page: '', ...patch })}`);
  const filtered = ['category', 'from', 'to', 'status', 'q'].some((k) => query[k])
    || query.sort !== DEFAULTS.sort || query.order !== DEFAULTS.order;
  const reset = () => navigate(path);

  return (
    <section>
      <form className="filters" onSubmit={(e) => e.preventDefault()} aria-label="Filters">
        <label className="filters__item">
          <span>Category</span>
          <select value={query.category} onChange={(e) => set({ category: e.target.value })}>
            <option value="">All categories</option>
            {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
          </select>
        </label>
        <label className="filters__item">
          <span>Sort by</span>
          <select value={query.sort} onChange={(e) => set({ sort: e.target.value })}>
            {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </label>
        <label className="filters__item">
          <span>Order</span>
          <select value={query.order} onChange={(e) => set({ order: e.target.value })}>
            <option value="desc">{query.sort === 'date' ? 'Newest first' : 'Highest first'}</option>
            <option value="asc">{query.sort === 'date' ? 'Oldest first' : 'Lowest first'}</option>
          </select>
        </label>
        <DateFilter label="From" value={query.from} max={query.to} onCommit={(v) => set({ from: v })} />
        <DateFilter label="To" value={query.to} min={query.from} onCommit={(v) => set({ to: v })} />
        {user && (
          <label className="filters__item">
            <span>Status</span>
            <select value={query.status} onChange={(e) => set({ status: e.target.value })}>
              {STATUSES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
        )}
        <label className="filters__item">
          <span>Per page</span>
          <select value={query.limit} onChange={(e) => set({ limit: e.target.value })}>
            {LIMITS.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        {filtered && <button type="button" className="btn btn--ghost filters__reset" onClick={reset}>Reset</button>}
      </form>

      <p className="muted feed__summary" aria-live="polite">
        {status === 'done' && (query.q ? `${plural(total, 'result')} for “${query.q}”` : plural(total, 'post'))}
        {status === 'loading' && 'Loading…'}
      </p>
      {status === 'failed' && <p className="field__error" role="alert">{error}</p>}
      {status === 'done' && items.length === 0 && <p className="empty">No posts match these filters.{filtered && ' Try resetting them.'}</p>}
      {items.map((p) => <PostCard key={p.id} post={p} />)}
      <Pagination page={query.page} pages={pages} onPage={(n) => set({ page: n })} />
    </section>
  );
}
