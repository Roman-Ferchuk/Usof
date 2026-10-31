export default function Pagination({ page, pages, onPage }) {
  if (pages <= 1) return null;
  const nums = [];
  for (let i = Math.max(1, page - 2); i <= Math.min(pages, page + 2); i += 1) nums.push(i);
  const go = (n) => () => onPage(n);

  return (
    <nav className="pager" aria-label="Pages">
      <button type="button" className="btn btn--ghost" disabled={page <= 1} onClick={go(page - 1)}>Previous</button>
      {nums[0] > 1 && <><button type="button" className="btn btn--ghost" onClick={go(1)}>1</button>{nums[0] > 2 && <span className="pager__gap">…</span>}</>}
      {nums.map((n) => (
        <button
          type="button"
          key={n}
          className={`btn btn--ghost${n === page ? ' is-current' : ''}`}
          aria-current={n === page ? 'page' : undefined}
          onClick={go(n)}
        >
          {n}
        </button>
      ))}
      {nums[nums.length - 1] < pages && <>{nums[nums.length - 1] < pages - 1 && <span className="pager__gap">…</span>}<button type="button" className="btn btn--ghost" onClick={go(pages)}>{pages}</button></>}
      <button type="button" className="btn btn--ghost" disabled={page >= pages} onClick={go(page + 1)}>Next</button>
    </nav>
  );
}
