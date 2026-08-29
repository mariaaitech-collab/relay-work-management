import { useEffect, useState } from 'react';

function ThemeToggle({ onThemeChange }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('Relay-theme') || 'dark');

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem('Relay-theme', theme);
    onThemeChange?.(theme);
  }, [theme, onThemeChange]);

  return <button className="theme-toggle" onClick={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}><span>{theme === 'dark' ? '☼' : '☾'}</span>{theme === 'dark' ? 'Light mode' : 'Dark mode'}</button>;
}

export default ThemeToggle;
