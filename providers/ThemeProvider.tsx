import { useState, useEffect, useCallback, useMemo } from 'react';
import { useColorScheme } from 'react-native';
import { useQuery, useMutation } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { darkColors, lightColors, ThemeColors } from '@/constants/colors';

export type ThemeMode = 'light' | 'dark' | 'system';

const THEME_KEY = 'zito_theme_mode';

export const [ThemeProvider, useTheme] = createContextHook(() => {
  const systemScheme = useColorScheme();
  const [themeMode, setThemeMode] = useState<ThemeMode>('system');

  const themeQuery = useQuery({
    queryKey: ['zito_theme'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(THEME_KEY);
      return (stored as ThemeMode) || 'system';
    },
  });

  useEffect(() => {
    if (themeQuery.data) {
      setThemeMode(themeQuery.data);
    }
  }, [themeQuery.data]);

  const saveThemeMutation = useMutation({
    mutationFn: async (mode: ThemeMode) => {
      await AsyncStorage.setItem(THEME_KEY, mode);
      return mode;
    },
    onSuccess: (mode) => {
      setThemeMode(mode);
    },
  });

  const setTheme = useCallback((mode: ThemeMode) => {
    saveThemeMutation.mutate(mode);
  }, [saveThemeMutation]);

  const resolvedTheme = useMemo((): 'light' | 'dark' => {
    if (themeMode === 'system') {
      return systemScheme === 'light' ? 'light' : 'dark';
    }
    return themeMode;
  }, [themeMode, systemScheme]);

  const colors = useMemo((): ThemeColors => {
    return resolvedTheme === 'light' ? lightColors : darkColors;
  }, [resolvedTheme]);

  const isDark = resolvedTheme === 'dark';

  return {
    themeMode,
    resolvedTheme,
    isDark,
    colors,
    setTheme,
  };
});
