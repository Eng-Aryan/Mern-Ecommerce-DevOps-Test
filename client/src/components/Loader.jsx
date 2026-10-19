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
