// MaSoVa Mobile Design Tokens — Blinkit-inspired dark/light system

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
  brand: {
    accent: '#FFD000',
    onAccent: '#000000',
  },

  dark: {
    bg: '#0F0F0F',
    surface1: '#1A1A1A',
    surface2: '#242424',
    surface3: '#2E2E2E',
    surface4: '#383838',
    text1: '#FFFFFF',
    text2: '#A0A0A0',
    text3: '#606060',
    border: 'rgba(255,255,255,0.08)',
    overlay5: 'rgba(255,255,255,0.05)',
    overlay8: 'rgba(255,255,255,0.08)',
    overlay11: 'rgba(255,255,255,0.11)',
    overlay15: 'rgba(255,255,255,0.15)',
  },

  light: {
    bg: '#FFFFFF',
    surface1: '#F5F5F5',
    surface2: '#EFEFEF',
    surface3: '#E5E5E5',
    surface4: '#DCDCDC',
    text1: '#0F0F0F',
    text2: '#606060',
    text3: '#A0A0A0',
    border: 'rgba(0,0,0,0.08)',
    overlay5: 'rgba(0,0,0,0.03)',
    overlay8: 'rgba(0,0,0,0.05)',
    overlay11: 'rgba(0,0,0,0.07)',
    overlay15: 'rgba(0,0,0,0.10)',
  },

  semantic: {
    error: '#FF4444',
    errorLight: '#D32F2F',
    success: '#22C55E',
    successLight: '#2E7D32',
    warning: '#F59E0B',
  },
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
  fontFamily: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    extrabold: 'PlusJakartaSans-ExtraBold',
  },

  fontSize: {
    display: 36,
    headline: 28,
    title: 22,
    titleSm: 18,
    body: 16,
    bodySm: 14,
    label: 12,
    caption: 11,
  },

  lineHeight: {
    display: 44,
    headline: 36,
    title: 28,
    titleSm: 24,
    body: 24,
    bodySm: 20,
    label: 16,
    caption: 14,
  },

  fontWeight: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
    extrabold: '800' as const,
  },
} as const;

// =============================================================================
// SPACING (4px grid)
// =============================================================================

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
  xxxxl: 64,
  screenPadding: 16,
  cardPadding: 16,
  sectionGap: 24,
  listItemGap: 12,
  touchTarget: 48,
  // Numeric aliases for backward compat with screens using spacing[4] etc.
  0: 0,
  1: 4,
  2: 8,
  3: 12,
  4: 16,
  5: 20,
  6: 24,
  8: 32,
  10: 40,
  12: 48,
  16: 64,
  20: 80,
} as const;

// =============================================================================
// BORDER RADIUS
// =============================================================================

export const borderRadius = {
  none: 0,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  pill: 9999,
  card: 16,
  button: 12,
  input: 12,
  chip: 20,
  image: 12,
  bottomSheet: 24,
} as const;

// =============================================================================
// SHADOWS (light mode only — dark mode uses surface lightness)
// =============================================================================

export const shadows = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.10,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 4,
  },
  xl: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
  },
} as const;

// =============================================================================
// GLASS (kept for backward compat — not used in new design)
// =============================================================================

export const glass = {
  blur: { light: 20, medium: 40, heavy: 60 },
  tint: { light: 'light' as const, dark: 'dark' as const },
} as const;

// =============================================================================
// ANIMATION
// =============================================================================

export const animation = {
  duration: {
    instant: 100,
    fast: 200,
    normal: 300,
    slow: 500,
    pageTransition: 350,
  },
} as const;

// =============================================================================
// TAB BAR
// =============================================================================

export const tabBar = {
  height: 56,
  iconSize: 24,
  labelSize: 12,
  labelWeight: '500' as const,
  activeTint: (isDark: boolean) => isDark ? '#FFD000' : '#0F0F0F',
  inactiveTint: '#606060',
  activeBackground: 'rgba(255,208,0,0.10)',
  darkBg: '#1A1A1A',
  lightBg: '#FFFFFF',
  darkBorder: 'rgba(255,255,255,0.08)',
  lightBorder: 'rgba(0,0,0,0.08)',
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
  base: 0,
  dropdown: 10,
  sticky: 20,
  overlay: 30,
  modal: 40,
  toast: 50,
} as const;
