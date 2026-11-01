import { Link } from 'react-router-dom';
import useSeo from '../hooks/useSeo.js';

export default function NotFound() {
  useSeo({ title: 'Page not found' });
  return (
    <div className="container section empty">
      <h1>That trail doesn't exist</h1>
      <p className="muted">The page you were looking for has moved or never existed.</p>
      <Link to="/" className="btn big">Back to the homepage</Link>
    </div>
  );
}
