import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors, type AppThemeColors } from './palettes';

const STORAGE_KEY = '@app_theme_mode';

export type ThemeMode = 'light' | 'dark' | 'system';

type ThemeContextValue = {
  colors: AppThemeColors;
  mode: ThemeMode;
  setMode: (next: ThemeMode) => Promise<void>;
  resolvedScheme: 'light' | 'dark';
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function resolveScheme(mode: ThemeMode, system: 'light' | 'dark' | null | undefined): 'light' | 'dark' {
  if (mode === 'light' || mode === 'dark') return mode;
  return system === 'dark' ? 'dark' : 'light';
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const systemScheme = useColorScheme();
  const [mode, setModeState] = useState<ThemeMode>('system');

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (cancelled) return;
      if (stored === 'light' || stored === 'dark' || stored === 'system') {
        setModeState(stored);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const resolvedScheme = useMemo(
    () => resolveScheme(mode, systemScheme),
    [mode, systemScheme]
  );

  const colors = resolvedScheme === 'dark' ? darkColors : lightColors;

  const setMode = useCallback(async (next: ThemeMode) => {
    setModeState(next);
    await AsyncStorage.setItem(STORAGE_KEY, next);
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors,
      mode,
      setMode,
      resolvedScheme,
    }),
    [colors, mode, setMode, resolvedScheme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useAppTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useAppTheme must be used within ThemeProvider');
  }
  return ctx;
}
