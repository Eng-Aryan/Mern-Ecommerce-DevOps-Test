import { useEffect, useState } from 'react';
import { useSettings } from '../context/SettingsContext.jsx';
import Icon from './Icon.jsx';

// "Add to home screen" banner for phones that support installing the web app.
export default function InstallPrompt() {
  const { storeName } = useSettings();
  const [evt, setEvt] = useState(null);
  useEffect(() => {
    if (localStorage.getItem('installDismissed')) return;
    const handler = (e) => { e.preventDefault(); setEvt(e); };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);
  if (!evt) return null;
  const dismiss = () => { localStorage.setItem('installDismissed', '1'); setEvt(null); };
  return (
    <div className="install" role="dialog" aria-label="Install the app">
      <Icon name="download" />
      <span className="grow"><strong>Install {storeName}</strong><small>Faster shopping from your home screen</small></span>
      <button className="btn small accent" onClick={async () => { evt.prompt(); await evt.userChoice; dismiss(); }}>Install</button>
      <button className="icon-btn" onClick={dismiss} aria-label="Not now"><Icon name="x" size={18} /></button>
    </div>
  );
}
