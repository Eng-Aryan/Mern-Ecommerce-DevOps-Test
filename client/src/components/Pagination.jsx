// Compact pager: first, last, current ±1 and ellipses, so it stays one row on phones.
export default function Pagination({ page, pages, onChange }) {
  if (pages <= 1) return null;
  const nums = [...new Set([1, page - 1, page, page + 1, pages].filter((n) => n >= 1 && n <= pages))].sort((a, b) => a - b);
  const out = [];
  nums.forEach((n, i) => { if (i && n - nums[i - 1] > 1) out.push('…' + n); out.push(n); });
  return (
    <nav className="pagination" aria-label="Pagination">
      <button className="btn ghost small" disabled={page <= 1} onClick={() => onChange(page - 1)}>Previous</button>
      {out.map((n) => typeof n === 'string' ? <span key={n} className="muted">…</span> : (
        <button key={n} className={`btn small ${n === page ? '' : 'ghost'}`} onClick={() => onChange(n)} aria-current={n === page ? 'page' : undefined}>{n}</button>
      ))}
      <button className="btn ghost small" disabled={page >= pages} onClick={() => onChange(page + 1)}>Next</button>
    </nav>
  );
}
