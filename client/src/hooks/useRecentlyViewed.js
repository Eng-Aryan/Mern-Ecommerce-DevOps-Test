const KEY = 'recent';
export const getRecent = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
export const pushRecent = (id) => {
  try { localStorage.setItem(KEY, JSON.stringify([id, ...getRecent().filter((x) => x !== id)].slice(0, 12))); } catch { /* storage full or blocked */ }
};
