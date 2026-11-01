import Settings from '../models/Settings.js';

let cache = null;
let loadedAt = 0;

// Store settings change rarely, so they are cached for 30 seconds.
export const getSettings = async (fresh = false) => {
  if (!fresh && cache && Date.now() - loadedAt < 30_000) return cache;
  let doc = await Settings.findOne({ key: 'main' }).lean();
  if (!doc) doc = (await Settings.create({ key: 'main' })).toObject();
  cache = doc;
  loadedAt = Date.now();
  return cache;
};

export const clearSettingsCache = () => {
  cache = null;
};

export const formatMoney = (settings, n) => {
  try {
    return new Intl.NumberFormat(settings.locale || 'en-US', { style: 'currency', currency: settings.currency || 'USD' }).format(n || 0);
  } catch {
    return `${settings.currency || '$'} ${(n || 0).toFixed(2)}`;
  }
};
