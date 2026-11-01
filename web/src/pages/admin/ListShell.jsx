import Pagination from '../../components/Pagination';
import { plural } from '../../utils';

/* Common frame of an admin list: summary line, errors, empty state, table and pager. */
export default function ListShell({
  list, noun, filters, before, children,
}) {
  const {
    status, error, total, rows, page, pages, setPage,
  } = list;
  return (
    <section>
      {filters}
      {before}
      <p className="muted feed__summary" aria-live="polite">
        {status === 'loading' ? 'Loading…' : plural(total, noun)}
      </p>
      {status === 'failed' && <p className="field__error" role="alert">{error}</p>}
      {status === 'done' && rows.length === 0 && <p className="empty">Nothing found.</p>}
      {rows.length > 0 && <div className="table-wrap">{children}</div>}
      <Pagination page={page} pages={pages} onPage={setPage} />
    </section>
  );
}
