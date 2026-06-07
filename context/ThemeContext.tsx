import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Theme } from '@/types';
import { THEMES, DEFAULT_THEME_ID } from '@/constants/themes';
import { STORAGE_KEYS } from '@/constants/app';

type ThemeContextValue = {
  theme: Theme;
  setTheme: (t: Theme) => void;
};

const ThemeContext = createContext<ThemeContextValue>({
  theme: THEMES[DEFAULT_THEME_ID],
  setTheme: () => {},
});

export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(THEMES[DEFAULT_THEME_ID]);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEYS.THEME)
      .then(saved => { if (saved && THEMES[saved]) setThemeState(THEMES[saved]); })
      .catch(() => {});
  }, []);

  const setTheme = async (t: Theme) => {
    setThemeState(t);
    try { await AsyncStorage.setItem(STORAGE_KEYS.THEME, t.id); } catch {}
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
