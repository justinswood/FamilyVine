import React, { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Initialize theme from localStorage or system preference
  const [theme, setThemeState] = useState(() => {
    if (typeof window === 'undefined') return 'light';

    const stored = localStorage.getItem('familyVine_theme');
    if (stored) return stored;

    // Default to light theme for new visitors
    return 'light';
  });

  const [mounted, setMounted] = useState(false);

  // Apply theme to document
  useEffect(() => {
    setMounted(true);

    // Prevent transitions on initial load
    document.documentElement.classList.add('no-transitions');

    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else if (theme === 'auto') {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    } else {
      document.documentElement.classList.remove('dark');
    }

    // Re-enable transitions after a short delay
    setTimeout(() => {
      document.documentElement.classList.remove('no-transitions');
    }, 100);

    localStorage.setItem('familyVine_theme', theme);
  }, [theme]);

  // Listen for system theme changes (for auto mode or unset preference)
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      if (theme === 'auto') {
        if (e.matches) {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      } else {
        const stored = localStorage.getItem('familyVine_theme');
        if (!stored) {
          setThemeState(e.matches ? 'dark' : 'light');
        }
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme]);

  const setTheme = (newTheme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const isDark = theme === 'dark' || (theme === 'auto' && typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches);

  // Prevent flash of wrong theme
  if (!mounted) {
    return null;
  }

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, isDark }}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
