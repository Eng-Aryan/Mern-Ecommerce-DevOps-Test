import { Component } from 'react';

// Shows the error on screen instead of a blank page.
export default class ErrorBoundary extends Component {
  state = { error: null };
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) { console.error('App crashed:', error, info?.componentStack); }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div style={{ maxWidth: 640, margin: '3rem auto', padding: '0 1rem', fontFamily: 'system-ui, sans-serif' }}>
        <h1>Something went wrong</h1>
        <p>The page hit an error. Try reloading. If it keeps happening, clear saved data and reload.</p>
        <pre style={{ background: '#fbe4e0', padding: '1rem', borderRadius: 8, whiteSpace: 'pre-wrap' }}>{String(this.state.error?.message || this.state.error)}</pre>
        <button
          style={{ padding: '.6rem 1.2rem', fontSize: '1rem', cursor: 'pointer' }}
          onClick={() => { localStorage.clear(); window.location.href = '/'; }}
        >
          Clear saved data and reload
        </button>
      </div>
    );
  }
}
