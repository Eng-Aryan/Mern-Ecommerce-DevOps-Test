export default function Rating({ value = 0, count, onChange }) {
  return (
    <span className="rating" aria-label={`${value.toFixed(1)} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => {
        const cls = value >= n ? 'full' : value >= n - 0.5 ? 'half' : '';
        return onChange ? (
          <button type="button" key={n} className={`star ${value >= n ? 'full' : ''}`} onClick={() => onChange(n)} aria-label={`${n} stars`}>
            ★
          </button>
        ) : (
          <span key={n} className={`star ${cls}`}>★</span>
        );
      })}
      {count !== undefined && <span className="rating-count">({count})</span>}
    </span>
  );
}
