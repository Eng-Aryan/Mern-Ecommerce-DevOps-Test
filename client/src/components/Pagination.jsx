export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn ghost small" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      {Array.from({ length: pages }, (_, i) => i + 1).map((n) => (
        <button key={n} className={`btn small ${n === page ? '' : 'ghost'}`} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>
          {n}
        </button>
      ))}
      <button className="btn ghost small" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}
