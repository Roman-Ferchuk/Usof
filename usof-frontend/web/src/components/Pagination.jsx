export default function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i += 1) nums.push(i);
  return (
    <nav className="pager" aria-label="Pages">
      <button type="button" className="btn btn--ghost" disabled={page <= 1} onClick={() => onPage(page - 1)}>Previous</button>
      {nums.map((n) => (
        <button
          type="button"
          key={n}
          className={`btn btn--ghost${n === page ? ' is-current' : ''}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={() => onPage(n)}
        >
          {n}
        </button>
      ))}
      <button type="button" className="btn btn--ghost" disabled={page >= pages} onClick={() => onPage(page + 1)}>Next</button>
    </nav>
  );
}
