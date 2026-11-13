import { typography, spacing, borderRadius, shadows } from './tokens';

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
    semantic: { error: string; errorLight: string; success: string; successLight: string; warning: string };
    selection: string;
    focus: string;
  };
  typography: typeof typography;
  spacing: typeof spacing;
  borderRadius: typeof borderRadius;
  shadows: typeof shadows;
}

const buildTheme = (mode: ThemeMode): Theme => {
  const isDark = mode === 'dark';
  const c = isDark ? { bg: '#101B17', surface1: '#1A2923', surface2: '#28302C', surface3: '#354139', surface4: '#435148', text1: '#F4F5F0', text2: '#BECBC2', text3: '#BECBC2', border: '#59665D' } : { bg: '#F6F5F1', surface1: '#FFFFFF', surface2: '#ECEEEB', surface3: '#DEDFD8', surface4: '#CDD3CA', text1: '#18221F', text2: '#55635A', text3: '#55635A', border: '#DEDFD8' };

  return {
    mode,
    isDark,
    colors: {
      accent: '#C63F19',
      onAccent: '#FFFFFF',
      bg: c.bg,
      surface1: c.surface1,
      surface2: c.surface2,
      surface3: c.surface3,
      surface4: c.surface4,
      text1: c.text1,
      text2: c.text2,
      text3: c.text3,
      border: c.border,
      error: isDark ? '#FFA8A0' : '#AA2424',
      success: isDark ? '#93D7AC' : '#146342',
      warning: isDark ? '#FFD28A' : '#7B4700',
      // Legacy aliases
      brand: {
        primary: '#C63F19',
        primaryLight: '#C63F19',
        primaryDark: '#C63F19',
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
      textInverse: '#FFFFFF',
      divider: c.border,
      overlay: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)',
      semantic: { error: isDark ? '#FFA8A0' : '#AA2424', errorLight: '#AA2424', success: isDark ? '#93D7AC' : '#146342', successLight: '#146342', warning: isDark ? '#FFD28A' : '#7B4700' },
      selection: c.surface2,
      focus: isDark ? '#93D7AC' : '#1D5F47',
    },
    typography,
    spacing,
    borderRadius,
    shadows,
  };
};

export const lightTheme: Theme = buildTheme('light');
export const darkTheme: Theme = buildTheme('dark');
