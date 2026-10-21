import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { navigate, useLocation } from '../router';
import { qs } from '../api/client';
import { fetchFeed } from '../store/feedSlice';
import { DEFAULT_LIMIT, LIMITS, SORTS } from '../config';
import PostCard from './PostCard';
import Pagination from './Pagination';

/* Posts list with filters + pagination. Used by Home and Profile. */
export default function Feed({ authorId }) {
  const dispatch = useDispatch();
  const { path, params } = useLocation();
  const { items, pages, status, error, categories } = useSelector((s) => s.feed);

  const query = {
    page: Number(params.page) || 1,
    limit: Number(params.limit) || DEFAULT_LIMIT,
    sort: params.sort || 'date',
    order: params.order || 'desc',
    category: params.category || '',
    q: params.q || '',
  };
  const key = JSON.stringify({ query, authorId });

  useEffect(() => {
    dispatch(fetchFeed({ ...query, authorId }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, dispatch]);

  const set = (patch) => navigate(`${path}${qs({ ...params, page: 1, ...patch })}`);

  return (
    <section>
      <div className="filters">
        <select value={query.category} onChange={(e) => set({ category: e.target.value })} aria-label="Category">
          <option value="">All categories</option>
          {categories.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
        </select>
        <select value={query.sort} onChange={(e) => set({ sort: e.target.value })} aria-label="Sort by">
          {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
        <button type="button" className="btn btn--ghost" onClick={() => set({ order: query.order === 'desc' ? 'asc' : 'desc' })}>
          {query.order === 'desc' ? 'Descending' : 'Ascending'}
        </button>
        <select value={query.limit} onChange={(e) => set({ limit: e.target.value })} aria-label="Per page">
          {LIMITS.map((n) => <option key={n} value={n}>{n} per page</option>)}
        </select>
      </div>
      {query.q && <p className="muted">Results for “{query.q}”</p>}
      {status === 'loading' && <p className="muted">Loading…</p>}
      {status === 'failed' && <p className="field__error">{error}</p>}
      {status === 'done' && items.length === 0 && <p className="empty">No posts match these filters yet.</p>}
      {items.map((p) => <PostCard key={p.id} post={p} />)}
      <Pagination page={query.page} pages={pages} onPage={(n) => set({ page: n })} />
    </section>
  );
}
