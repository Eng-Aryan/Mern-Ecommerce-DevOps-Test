import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="container section empty">
      <h1>That trail doesn't exist</h1>
      <p className="muted">The page you were looking for has moved or never existed.</p>
      <Link to="/" className="btn">Back to the homepage</Link>
    </div>
  );
}
