import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Theme, lightTheme, darkTheme, ThemeMode } from '../styles/theme';
import { useSunriseTheme } from './useSunriseTheme';

const THEME_PREF_KEY = 'masova_theme_preference';

/** User preference: forced light/dark, or auto (sunrise/sunset). */
export type ThemePreference = 'light' | 'dark' | 'auto';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  themePreference: ThemePreference;
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
  setThemePreference: (pref: ThemePreference) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const autoMode = useSunriseTheme();
  const [preference, setPreferenceState] = useState<ThemePreference>('auto');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(THEME_PREF_KEY);
        if (!cancelled && (raw === 'light' || raw === 'dark' || raw === 'auto')) {
          setPreferenceState(raw);
        }
      } catch {
        // keep default
      } finally {
        if (!cancelled) setHydrated(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setThemePreference = useCallback(async (pref: ThemePreference) => {
    setPreferenceState(pref);
    try {
      await AsyncStorage.setItem(THEME_PREF_KEY, pref);
    } catch {
      // ignore
    }
  }, []);

  const themeMode: ThemeMode =
    preference === 'auto' ? autoMode : preference === 'dark' ? 'dark' : 'light';
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  const isDark = themeMode === 'dark';

  const toggleTheme = useCallback(() => {
    // Explicit user override (not auto): flip current appearance
    const next: ThemePreference = isDark ? 'light' : 'dark';
    void setThemePreference(next);
  }, [isDark, setThemePreference]);

  const setThemeMode = useCallback(
    (mode: ThemeMode) => {
      void setThemePreference(mode);
    },
    [setThemePreference]
  );

  // Avoid flash: still render with current preference (auto until hydrated)
  void hydrated;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDark,
        themePreference: preference,
        toggleTheme,
        setThemeMode,
        setThemePreference,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
};

export default useTheme;
