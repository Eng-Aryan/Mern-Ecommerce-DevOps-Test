import { createContext, useContext, useEffect, useState } from 'react';
import api, { configureMoney } from '../api.js';

const DEFAULTS = {
  storeName: 'Tidewater Supply', tagline: 'Gear for the long way round.', metaDescription: '', currency: 'USD', locale: 'en-US',
  taxRate: 8, shippingFlat: 8, expressEnabled: true, expressShipping: 20, freeShippingOver: 100, codEnabled: true, cardEnabled: true,
  lowStockThreshold: 5, returnDays: 30, announcement: { text: '', link: '', active: false }, contact: {}, social: {}, footerNote: '',
};

const Ctx = createContext(DEFAULTS);
export const useSettings = () => useContext(Ctx);

// Loads store settings before first render so prices are formatted in the right currency from the start.
export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);

  const load = () =>
    api.get('/settings', { timeout: 5000 })
      .then((r) => ({ ...DEFAULTS, ...r.data }))
      .catch(() => DEFAULTS)
      .then((s) => { configureMoney(s.currency, s.locale); setSettings(s); return s; });

  useEffect(() => { load(); }, []);
  if (!settings) return <div className="splash" role="status" aria-label="Loading"><span className="spinner" /></div>;
  return <Ctx.Provider value={{ ...settings, reload: load }}>{children}</Ctx.Provider>;
}
