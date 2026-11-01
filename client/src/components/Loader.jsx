export const Loader = ({ label = 'Loading' }) => (
  <div className="loader" role="status">
    <span className="spinner" />
    <span>{label}…</span>
  </div>
);

export const ErrorBox = ({ message, children }) => (
  <div className="notice error" role="alert">
    {message}
    {children}
  </div>
);

// placeholder card shown while products load
export const SkeletonCard = () => (
  <div className="card skeleton" aria-hidden="true">
    <div className="card-media shimmer" />
    <div className="card-body"><i className="shimmer line s" /><i className="shimmer line" /><i className="shimmer line m" /></div>
  </div>
);
export const SkeletonGrid = ({ n = 8 }) => <div className="grid">{Array.from({ length: n }, (_, i) => <SkeletonCard key={i} />)}</div>;

export const EmptyState = ({ icon, title, children }) => (
  <div className="empty">
    <h2>{title}</h2>
    {children}
  </div>
);
