import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App.jsx';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { ThemeProvider } from './context/ThemeContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import { UIProvider } from './context/UIContext.jsx';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import '@fontsource-variable/bricolage-grotesque';
import '@fontsource-variable/public-sans';
import './styles/base.css';
import './styles/store.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <SettingsProvider>
            <AuthProvider>
              <CartProvider>
                <UIProvider>
                  <App />
                  <Toaster position="top-center" containerStyle={{ top: 'calc(env(safe-area-inset-top) + 12px)' }} toastOptions={{ style: { fontFamily: 'inherit', fontSize: '0.95rem', background: 'var(--surface)', color: 'var(--text)', border: '1px solid var(--line)' } }} />
                </UIProvider>
              </CartProvider>
            </AuthProvider>
          </SettingsProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  </React.StrictMode>
);

// Installable web app + offline page (production builds only, so development never serves stale files).
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => navigator.serviceWorker.register('/sw.js').catch(() => {}));
}
