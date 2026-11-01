import { createContext, useContext, useEffect, useState } from 'react';

const Ctx = createContext({ theme: 'light', toggle() {} });
export const useTheme = () => useContext(Ctx);

const systemDark = () => window.matchMedia?.('(prefers-color-scheme: dark)').matches;

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('theme') || (systemDark() ? 'dark' : 'light'));
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0d1517' : '#0e3b43');
  }, [theme]);
  const toggle = () => setTheme((t) => { const n = t === 'dark' ? 'light' : 'dark'; localStorage.setItem('theme', n); return n; });
  return <Ctx.Provider value={{ theme, toggle }}>{children}</Ctx.Provider>;
}
