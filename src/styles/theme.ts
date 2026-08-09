import { colors, typography, spacing, borderRadius, shadows } from './tokens';

export type ThemeMode = 'light' | 'dark';

export interface Theme {
  mode: ThemeMode;
  isDark: boolean;
  colors: {
    accent: string;
    onAccent: string;
    bg: string;
    surface1: string;
    surface2: string;
    surface3: string;
    surface4: string;
    text1: string;
    text2: string;
    text3: string;
    border: string;
    error: string;
    success: string;
    warning: string;
    // Legacy aliases (for screens not yet migrated)
    brand: { primary: string; primaryLight: string; primaryDark: string };
    background: string;
    surface: string;
    surfaceSecondary: string;
    surfaceElevated: string;
    glassSurface: string;
    glassSurfaceLight: string;
    glassBorder: string;
    textPrimary: string;
    textSecondary: string;
    textTertiary: string;
    textInverse: string;
    divider: string;
    overlay: string;
    semantic: typeof colors.semantic;
  };
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
}

const buildTheme = (mode: ThemeMode): Theme => {
  const isDark = mode === 'dark';
  const c = isDark ? colors.dark : colors.light;

  return {
    mode,
    isDark,
    colors: {
      accent: colors.brand.accent,
      onAccent: colors.brand.onAccent,
      bg: c.bg,
      surface1: c.surface1,
      surface2: c.surface2,
      surface3: c.surface3,
      surface4: c.surface4,
      text1: c.text1,
      text2: c.text2,
      text3: c.text3,
      border: c.border,
      error: isDark ? colors.semantic.error : colors.semantic.errorLight,
      success: isDark ? colors.semantic.success : colors.semantic.successLight,
      warning: colors.semantic.warning,
      // Legacy aliases
      brand: {
        primary: colors.brand.accent,
        primaryLight: colors.brand.accent,
        primaryDark: colors.brand.accent,
      },
      background: c.bg,
      surface: c.surface1,
      surfaceSecondary: c.surface2,
      surfaceElevated: c.surface2,
      glassSurface: c.surface2,
      glassSurfaceLight: c.surface1,
      glassBorder: c.border,
      textPrimary: c.text1,
      textSecondary: c.text2,
      textTertiary: c.text3,
      textInverse: isDark ? '#000000' : '#FFFFFF',
      divider: c.border,
      overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
      semantic: colors.semantic,
    },
    typography,
    spacing,
    borderRadius,
    shadows,
  };
};

export const lightTheme: Theme = buildTheme('light');
export const darkTheme: Theme = buildTheme('dark');
