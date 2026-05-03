# MaSoVa Mobile Visual Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Visually redesign all 22 screens of the masova-mobile app to a Blinkit-inspired dark/light theme with yellow accent (`#FFD000`), location-based auto theme switching, and European premium food delivery aesthetics — with zero changes to business logic, navigation structure, or API calls.

**Architecture:** Replace the existing generic glassmorphism token system with a new dark-premium token set. Update the ThemeProvider to drive theme from location-based sunrise/sunset times. Update all UI components and screens to consume the new tokens. No JSX structure changes — only StyleSheet values change.

**Tech Stack:** React Native 0.81, Expo 54, `expo-location` (already installed), `suncalc` (new — pure JS, no native module), TypeScript

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `src/styles/tokens.ts` | Modify | New color, typography, spacing, shadow, elevation tokens |
| `src/styles/theme.ts` | Modify | Updated lightTheme / darkTheme using new tokens |
| `src/hooks/useSunriseTheme.ts` | Create | Gets device location, computes sunrise/sunset, returns current ThemeMode |
| `src/hooks/useTheme.tsx` | Modify | Wire ThemeProvider to useSunriseTheme instead of system color scheme |
| `src/components/ui/Card.tsx` | Modify | Remove glass/blur variants, use elevation-based dark surfaces |
| `src/components/ui/Button.tsx` | Modify | Yellow primary, updated secondary/ghost/danger, new size tokens |
| `src/components/ui/Input.tsx` | Modify | New surface3 bg, yellow active border, 52px height |
| `src/components/ui/Chip.tsx` | Modify | Remove BlurView, yellow active fill, black text on active |
| `src/components/ui/Badge.tsx` | Modify | Yellow primary badge, updated variant colors |
| `src/components/ui/SearchBar.tsx` | Modify | Pill shape, surface2 bg |
| `src/navigation/MainTabNavigator.tsx` | Modify | New tab bar spec: 56dp height, yellow active, dark/light bar |
| `src/screens/auth/LoginScreen.tsx` | Modify | Theme-aware bg, yellow CTA, updated input styles |
| `src/screens/auth/RegisterScreen.tsx` | Modify | Same as LoginScreen |
| `src/screens/home/HomeScreen.tsx` | Modify | Square image category tiles, dark header, updated card styles |
| `src/screens/home/NotificationsScreen.tsx` | Modify | Yellow unread dot, surface1 cards |
| `src/screens/home/SearchScreen.tsx` | Modify | Pill search bar, surface2 chips |
| `src/screens/menu/MenuScreen.tsx` | Modify | Yellow active chips, updated food cards |
| `src/screens/menu/ItemDetailScreen.tsx` | Modify | Yellow price (dark mode), yellow Add to Cart button |
| `src/screens/cart/CartScreen.tsx` | Modify | Yellow checkout button, updated item rows |
| `src/screens/cart/CheckoutOptionsScreen.tsx` | Modify | Surface1 option cards, yellow confirm |
| `src/screens/cart/CheckoutScreen.tsx` | Modify | Surface1/3 form layout, yellow pay button |
| `src/screens/cart/GuestCheckoutScreen.tsx` | Modify | Same as CheckoutScreen |
| `src/screens/order/OrderHistoryScreen.tsx` | Modify | Yellow active status, green delivered, red cancelled |
| `src/screens/order/OrderDetailScreen.tsx` | Modify | Status color system, surface1 cards |
| `src/screens/order/OrderTrackingScreen.tsx` | Modify | Yellow active indicator, dark map preference |
| `src/screens/order/OrderReviewScreen.tsx` | Modify | Yellow star rating |
| `src/screens/payment/PaymentSuccessScreen.tsx` | Modify | Green checkmark, yellow Track Order button |
| `src/screens/payment/PaymentFailedScreen.tsx` | Modify | Red X, yellow Try Again button |
| `src/screens/profile/ProfileScreen.tsx` | Modify | Surface1 list cards, yellow accents |
| `src/screens/profile/SavedScreen.tsx` | Modify | Surface1 cards, yellow save indicator |
| `src/screens/profile/AddressManagementScreen.tsx` | Modify | Surface1 cards, yellow selected border |
| `src/screens/profile/AddAddressScreen.tsx` | Modify | Surface3 inputs, yellow active |
| `src/screens/support/ChatScreen.tsx` | Modify | Yellow user bubbles, surface2 agent bubbles |

---

## Task 1: Install suncalc and update tokens

**Files:**
- Modify: `package.json`
- Modify: `src/styles/tokens.ts`

- [ ] **Step 1: Install suncalc**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npm install suncalc
npm install --save-dev @types/suncalc
```

Expected: Both packages install without errors.

- [ ] **Step 2: Replace tokens.ts entirely**

Replace the full contents of `src/styles/tokens.ts` with:

```typescript
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
    primary: 'System',
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
```

- [ ] **Step 3: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add package.json package-lock.json src/styles/tokens.ts
git commit -m "feat(design): new Blinkit-inspired design tokens + suncalc install"
```

---

## Task 2: Update theme.ts

**Files:**
- Modify: `src/styles/theme.ts`

- [ ] **Step 1: Replace theme.ts entirely**

Replace the full contents of `src/styles/theme.ts` with:

```typescript
import { colors, typography, spacing, borderRadius, shadows, glass } from './tokens';

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
    // Legacy aliases (for screens not yet migrated — remove after all screens updated)
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
```

- [ ] **Step 2: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/styles/theme.ts
git commit -m "feat(design): rebuild theme.ts with new token structure + legacy aliases"
```

---

## Task 3: Create useSunriseTheme hook + update ThemeProvider

**Files:**
- Create: `src/hooks/useSunriseTheme.ts`
- Modify: `src/hooks/useTheme.tsx`

- [ ] **Step 1: Create useSunriseTheme.ts**

Create `src/hooks/useSunriseTheme.ts`:

```typescript
import { useState, useEffect, useRef } from 'react';
import * as Location from 'expo-location';
import SunCalc from 'suncalc';
import { ThemeMode } from '../styles/theme';

const getThemeForTime = (now: Date, sunrise: Date, sunset: Date): ThemeMode =>
  now >= sunrise && now < sunset ? 'light' : 'dark';

export const useSunriseTheme = (): ThemeMode => {
  const [mode, setMode] = useState<ThemeMode>('dark');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;

    const scheduleSwitch = (targetTime: Date, nextMode: ThemeMode) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      const delay = targetTime.getTime() - Date.now();
      if (delay > 0) {
        timerRef.current = setTimeout(() => {
          if (!cancelled) setMode(nextMode);
        }, delay);
      }
    };

    const init = async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (cancelled) return;

      if (status !== 'granted') {
        // Fallback: simple 6am-8pm light window
        const now = new Date();
        const hour = now.getHours();
        setMode(hour >= 6 && hour < 20 ? 'light' : 'dark');
        return;
      }

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low });
      if (cancelled) return;

      const { latitude, longitude } = loc.coords;
      const now = new Date();
      const times = SunCalc.getTimes(now, latitude, longitude);

      setMode(getThemeForTime(now, times.sunrise, times.sunset));

      // Schedule today's remaining switch
      if (now < times.sunrise) {
        scheduleSwitch(times.sunrise, 'light');
      } else if (now < times.sunset) {
        scheduleSwitch(times.sunset, 'dark');
      }
      // After sunset: schedule tomorrow's sunrise
      else {
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowTimes = SunCalc.getTimes(tomorrow, latitude, longitude);
        scheduleSwitch(tomorrowTimes.sunrise, 'light');
      }
    };

    init();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  return mode;
};
```

- [ ] **Step 2: Update useTheme.tsx to use useSunriseTheme**

Replace the full contents of `src/hooks/useTheme.tsx` with:

```typescript
import React, { createContext, useContext, ReactNode } from 'react';
import { Theme, lightTheme, darkTheme, ThemeMode } from '../styles/theme';
import { useSunriseTheme } from './useSunriseTheme';

interface ThemeContextType {
  theme: Theme;
  themeMode: ThemeMode;
  isDark: boolean;
  // kept for backward compat — no-op in new system
  toggleTheme: () => void;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const themeMode = useSunriseTheme();
  const theme = themeMode === 'dark' ? darkTheme : lightTheme;
  const isDark = themeMode === 'dark';

  return (
    <ThemeContext.Provider
      value={{
        theme,
        themeMode,
        isDark,
        toggleTheme: () => {},
        setThemeMode: () => {},
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
```

- [ ] **Step 3: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/hooks/useSunriseTheme.ts src/hooks/useTheme.tsx
git commit -m "feat(theme): location-based sunrise/sunset auto theme switching"
```

---

## Task 4: Update UI components — Card, Button, Input

**Files:**
- Modify: `src/components/ui/Card.tsx`
- Modify: `src/components/ui/Button.tsx`
- Modify: `src/components/ui/Input.tsx`

- [ ] **Step 1: Replace Card.tsx**

Replace the full contents of `src/components/ui/Card.tsx` with:

```typescript
import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, shadows } from '../../styles';

type CardElevation = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  elevation?: CardElevation;
  padding?: number;
  onPress?: () => void;
  style?: ViewStyle;
  borderless?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  elevation = 'sm',
  padding = 16,
  onPress,
  style,
  borderless = false,
}) => {
  const { theme, isDark } = useTheme();

  const elevationStyle = (() => {
    if (isDark) {
      // Dark mode: surface lightness, no shadows
      switch (elevation) {
        case 'none': return { backgroundColor: theme.colors.bg };
        case 'sm':   return { backgroundColor: theme.colors.surface1 };
        case 'md':   return { backgroundColor: theme.colors.surface2 };
        case 'lg':   return { backgroundColor: theme.colors.surface3 };
        default:     return { backgroundColor: theme.colors.surface1 };
      }
    } else {
      switch (elevation) {
        case 'none': return { backgroundColor: theme.colors.bg, ...shadows.none };
        case 'sm':   return { backgroundColor: theme.colors.surface1, ...shadows.sm };
        case 'md':   return { backgroundColor: theme.colors.surface1, ...shadows.md };
        case 'lg':   return { backgroundColor: theme.colors.surface1, ...shadows.lg };
        default:     return { backgroundColor: theme.colors.surface1, ...shadows.sm };
      }
    }
  })();

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius.card,
    padding,
    overflow: 'hidden',
    ...elevationStyle,
    ...(!borderless && {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    }),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

export default Card;
```

- [ ] **Step 2: Replace Button.tsx**

Replace the full contents of `src/components/ui/Button.tsx` with:

```typescript
import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, typography } from '../../styles';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
}) => {
  const { theme, isDark } = useTheme();

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const sizeStyles: { container: ViewStyle; text: TextStyle } = (() => {
    switch (size) {
      case 'sm': return {
        container: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
        text: { fontSize: 13, lineHeight: 18 },
      };
      case 'lg': return {
        container: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56 },
        text: { fontSize: 17, lineHeight: 24 },
      };
      default: return {
        container: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 48 },
        text: { fontSize: typography.fontSize.body, lineHeight: typography.lineHeight.body },
      };
    }
  })();

  const variantStyles: { container: ViewStyle; text: TextStyle } = (() => {
    if (disabled) return {
      container: { backgroundColor: theme.colors.surface3 },
      text: { color: theme.colors.text3 },
    };
    switch (variant) {
      case 'primary': return {
        container: { backgroundColor: '#FFD000' },
        text: { color: '#000000' },
      };
      case 'secondary': return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: '#FFD000',
        },
        text: { color: isDark ? '#FFD000' : '#0F0F0F' },
      };
      case 'ghost': return {
        container: { backgroundColor: 'transparent' },
        text: { color: theme.colors.text2 },
      };
      case 'danger': return {
        container: { backgroundColor: theme.colors.error },
        text: { color: '#FFFFFF' },
      };
    }
  })();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.button,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    ...sizeStyles.container,
    ...variantStyles.container,
    ...style,
  };

  const textStyle: TextStyle = {
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.2,
    ...sizeStyles.text,
    ...variantStyles.text,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={containerStyle}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color as string} size="small" />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text style={textStyle}>{title}</Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
```

- [ ] **Step 3: Replace Input.tsx**

Read the current `src/components/ui/Input.tsx` first, then replace its StyleSheet values only — keeping all props/logic intact. The key changes:
- Background: `theme.colors.surface3`
- Active border color: `#FFD000`
- Border radius: `borderRadius.input` (12)
- Height: 52
- Label color: `theme.colors.text2`
- Placeholder color: `theme.colors.text3`

Full replacement:

```typescript
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, ViewStyle, TextStyle, TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, typography, spacing } from '../../styles';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText: (text: string) => void;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  autoComplete?: string;
  error?: string;
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  style?: ViewStyle;
  editable?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
}

const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'none',
  autoComplete,
  error,
  leftIcon,
  rightIcon,
  onRightIconPress,
  style,
  editable = true,
  multiline = false,
  numberOfLines = 1,
}) => {
  const { theme } = useTheme();
  const [focused, setFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const borderColor = error
    ? theme.colors.error
    : focused
    ? '#FFD000'
    : theme.colors.border;

  return (
    <View style={[styles.wrapper, style]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text2 }]}>{label}</Text>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface3,
            borderColor,
            borderWidth: focused ? 1.5 : StyleSheet.hairlineWidth,
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={theme.colors.text3}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          style={[styles.input, { color: theme.colors.text1 }]}
          placeholder={placeholder}
          placeholderTextColor={theme.colors.text3}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry && !showPassword}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          editable={editable}
          multiline={multiline}
          numberOfLines={numberOfLines}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.rightIcon}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.text3}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !secureTextEntry && (
          <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color={theme.colors.text3} />
          </TouchableOpacity>
        )}
      </View>
      {error && (
        <Text style={[styles.error, { color: theme.colors.error }]}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.input,
    minHeight: 52,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    paddingVertical: spacing.md,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  error: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing.xs,
  },
});

export default Input;
```

- [ ] **Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/components/ui/Card.tsx src/components/ui/Button.tsx src/components/ui/Input.tsx
git commit -m "feat(components): redesign Card, Button, Input with new design tokens"
```

---

## Task 5: Update UI components — Chip, Badge, SearchBar

**Files:**
- Modify: `src/components/ui/Chip.tsx`
- Modify: `src/components/ui/Badge.tsx`
- Modify: `src/components/ui/SearchBar.tsx`

- [ ] **Step 1: Replace Chip.tsx**

Replace the full contents of `src/components/ui/Chip.tsx` with:

```typescript
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, typography, spacing } from '../../styles';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  disabled?: boolean;
  style?: ViewStyle;
}

const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (!disabled && onPress) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.8}
      style={[
        styles.container,
        {
          backgroundColor: selected ? '#FFD000' : theme.colors.surface2,
          borderColor: selected ? '#FFD000' : theme.colors.border,
          opacity: disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          { color: selected ? '#000000' : theme.colors.text2 },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.chip,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.medium,
  },
});

export default Chip;
```

- [ ] **Step 2: Replace Badge.tsx**

Replace the full contents of `src/components/ui/Badge.tsx` with:

```typescript
import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography, borderRadius } from '../../styles';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  style,
}) => {
  const { theme } = useTheme();

  const getColors = (): { bg: string; text: string } => {
    switch (variant) {
      case 'primary':   return { bg: '#FFD000', text: '#000000' };
      case 'secondary': return { bg: theme.colors.surface2, text: theme.colors.text1 };
      case 'success':   return { bg: theme.colors.success, text: '#FFFFFF' };
      case 'warning':   return { bg: theme.colors.warning, text: '#000000' };
      case 'error':     return { bg: theme.colors.error, text: '#FFFFFF' };
      case 'info':      return { bg: theme.colors.surface2, text: theme.colors.text2 };
      default:          return { bg: '#FFD000', text: '#000000' };
    }
  };

  const { bg, text } = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingHorizontal: isSm ? 6 : 8,
          paddingVertical: isSm ? 2 : 3,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.label,
          {
            color: text,
            fontSize: isSm ? typography.fontSize.caption : typography.fontSize.label,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  label: {
    fontWeight: '600',
  },
});

export default Badge;
```

- [ ] **Step 3: Replace SearchBar.tsx**

Replace the full contents of `src/components/ui/SearchBar.tsx` with:

```typescript
import React from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, typography, spacing } from '../../styles';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onPress?: () => void;
  editable?: boolean;
  style?: ViewStyle;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFocus,
  onPress,
  editable = true,
  style,
}) => {
  const { theme } = useTheme();

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border },
        style,
      ]}
    >
      <Ionicons name="search-outline" size={20} color={theme.colors.text3} style={styles.icon} />
      <TextInput
        style={[styles.input, { color: theme.colors.text1 }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text3}
        value={value}
        onChangeText={onChangeText}
        onFocus={onFocus}
        editable={editable}
        autoCapitalize="none"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={() => onChangeText('')}>
          <Ionicons name="close-circle" size={18} color={theme.colors.text3} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: borderRadius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: '400',
  },
});

export default SearchBar;
```

- [ ] **Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/components/ui/Chip.tsx src/components/ui/Badge.tsx src/components/ui/SearchBar.tsx
git commit -m "feat(components): redesign Chip, Badge, SearchBar with new tokens"
```

---

## Task 6: Update MainTabNavigator

**Files:**
- Modify: `src/navigation/MainTabNavigator.tsx`

- [ ] **Step 1: Update tabBarOptions in MainTabNavigator**

Read `src/navigation/MainTabNavigator.tsx`. Find the `<Tab.Navigator>` screenOptions prop and replace the `tabBarStyle`, `tabBarActiveTintColor`, `tabBarInactiveTintColor`, and `tabBarLabelStyle` values. The `screenOptions` block should become:

```typescript
screenOptions={{
  headerShown: false,
  tabBarStyle: {
    backgroundColor: isDark ? '#1A1A1A' : '#FFFFFF',
    borderTopColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    borderTopWidth: StyleSheet.hairlineWidth,
    height: 56 + insets.bottom,
    paddingBottom: insets.bottom,
    paddingTop: 4,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarActiveTintColor: isDark ? '#FFD000' : '#0F0F0F',
  tabBarInactiveTintColor: '#606060',
  tabBarLabelStyle: {
    fontSize: 12,
    fontWeight: '500' as const,
    marginBottom: 2,
  },
}}
```

Also add `const { isDark } = useTheme();` and `const insets = useSafeAreaInsets();` at the top of the component if not already present. Add `import { StyleSheet } from 'react-native';` if not present.

- [ ] **Step 2: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/navigation/MainTabNavigator.tsx
git commit -m "feat(nav): update tab bar to new dark/light spec with yellow active tint"
```

---

## Task 7: Update Auth screens

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`
- Modify: `src/screens/auth/RegisterScreen.tsx`

- [ ] **Step 1: Update LoginScreen styles**

In `src/screens/auth/LoginScreen.tsx`, find the StyleSheet.create call at the bottom and update these style keys. Do not change any JSX or logic:

```typescript
// Replace the container style
container: {
  flex: 1,
  backgroundColor: theme.colors.bg,  // was: theme.colors.background
},

// Replace any gradient usage in the header/bg with plain background
// If LinearGradient is used as background, replace with:
// <View style={{ flex: 1, backgroundColor: theme.colors.bg }}>

// Update any hardcoded color references to use theme.colors tokens:
// theme.colors.background → theme.colors.bg
// theme.colors.textPrimary → theme.colors.text1
// theme.colors.textSecondary → theme.colors.text2
// theme.colors.brand.primary → '#FFD000' (for CTA buttons, use Button variant="primary")
// theme.colors.surface → theme.colors.surface1
```

- [ ] **Step 2: Apply same token updates to RegisterScreen.tsx**

Same replacements as LoginScreen — token name migration only.

- [ ] **Step 3: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/auth/LoginScreen.tsx src/screens/auth/RegisterScreen.tsx
git commit -m "feat(screens): update auth screens to new design tokens"
```

---

## Task 8: Update Home, Search, Notifications screens

**Files:**
- Modify: `src/screens/home/HomeScreen.tsx`
- Modify: `src/screens/home/SearchScreen.tsx`
- Modify: `src/screens/home/NotificationsScreen.tsx`

- [ ] **Step 1: Update HomeScreen token references**

In `src/screens/home/HomeScreen.tsx`:

1. Replace all `theme.colors.background` → `theme.colors.bg`
2. Replace all `theme.colors.textPrimary` → `theme.colors.text1`
3. Replace all `theme.colors.textSecondary` → `theme.colors.text2`
4. Replace all `theme.colors.textTertiary` → `theme.colors.text3`
5. Replace all `theme.colors.surface` → `theme.colors.surface1`
6. Replace all `theme.colors.surfaceSecondary` → `theme.colors.surface2`
7. Replace all `theme.colors.brand.primary` → `'#FFD000'`
8. Replace all `theme.colors.divider` → `theme.colors.border`
9. Find the `categoryIcon` style (the circle container for categories) and change `borderRadius` to `borderRadius.sm` (8) — square tiles instead of circles:
```typescript
categoryIcon: {
  width: 64,
  height: 64,
  borderRadius: borderRadius.sm,  // was: 32 (circle)
  backgroundColor: theme.colors.surface2,
  alignItems: 'center',
  justifyContent: 'center',
  marginBottom: spacing.sm,
},
```
10. Find the notification badge dot and make it yellow:
```typescript
notificationBadge: {
  backgroundColor: '#FFD000',  // was: theme.colors.brand.primary
  // keep other styles
},
```

- [ ] **Step 2: Update SearchScreen token references**

Same token name replacements in `src/screens/home/SearchScreen.tsx`:
- `theme.colors.background` → `theme.colors.bg`
- `theme.colors.textPrimary` → `theme.colors.text1`
- `theme.colors.textSecondary` → `theme.colors.text2`
- `theme.colors.surface` → `theme.colors.surface1`
- `theme.colors.surfaceSecondary` → `theme.colors.surface2`
- `theme.colors.brand.primary` → `'#FFD000'`
- `theme.colors.divider` → `theme.colors.border`

- [ ] **Step 3: Update NotificationsScreen**

Same token replacements. Additionally find any unread indicator dot and set its color to `'#FFD000'`.

- [ ] **Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/home/HomeScreen.tsx src/screens/home/SearchScreen.tsx src/screens/home/NotificationsScreen.tsx
git commit -m "feat(screens): update home/search/notifications to new design tokens"
```

---

## Task 9: Update Menu screens

**Files:**
- Modify: `src/screens/menu/MenuScreen.tsx`
- Modify: `src/screens/menu/ItemDetailScreen.tsx`

- [ ] **Step 1: Update MenuScreen token references**

In `src/screens/menu/MenuScreen.tsx`, apply the same token replacements as Task 8 Step 1 (background→bg, textPrimary→text1, etc.).

Additionally find any active cuisine/category chip inline styles and ensure they use `'#FFD000'` bg and `'#000000'` text when selected.

- [ ] **Step 2: Update ItemDetailScreen**

In `src/screens/menu/ItemDetailScreen.tsx`:
1. Apply the standard token replacements.
2. Find the price display and update:
```typescript
// Price text style
priceText: {
  fontSize: 20,
  fontWeight: typography.fontWeight.bold,
  color: isDark ? '#FFD000' : theme.colors.text1,
},
```
3. Find the "Add to Cart" button and ensure it uses `variant="primary"` if using the Button component, or hardcode `backgroundColor: '#FFD000'` with `color: '#000000'` text if inline.

- [ ] **Step 3: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/menu/MenuScreen.tsx src/screens/menu/ItemDetailScreen.tsx
git commit -m "feat(screens): update menu screens to new design tokens"
```

---

## Task 10: Update Cart and Checkout screens

**Files:**
- Modify: `src/screens/cart/CartScreen.tsx`
- Modify: `src/screens/cart/CheckoutOptionsScreen.tsx`
- Modify: `src/screens/cart/CheckoutScreen.tsx`
- Modify: `src/screens/cart/GuestCheckoutScreen.tsx`

- [ ] **Step 1: Apply token replacements to all 4 cart screens**

For each file apply:
- `theme.colors.background` → `theme.colors.bg`
- `theme.colors.textPrimary` → `theme.colors.text1`
- `theme.colors.textSecondary` → `theme.colors.text2`
- `theme.colors.textTertiary` → `theme.colors.text3`
- `theme.colors.surface` → `theme.colors.surface1`
- `theme.colors.surfaceSecondary` → `theme.colors.surface2`
- `theme.colors.brand.primary` → `'#FFD000'` (for accent only)
- `theme.colors.divider` → `theme.colors.border`

In `CartScreen.tsx` and `CheckoutScreen.tsx`, find the bottom checkout/pay button and ensure:
```typescript
// Sticky bottom button container
checkoutButton: {
  backgroundColor: '#FFD000',
  // ensure text is '#000000'
},
```

- [ ] **Step 2: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/cart/CartScreen.tsx src/screens/cart/CheckoutOptionsScreen.tsx src/screens/cart/CheckoutScreen.tsx src/screens/cart/GuestCheckoutScreen.tsx
git commit -m "feat(screens): update cart/checkout screens to new design tokens"
```

---

## Task 11: Update Order and Payment screens

**Files:**
- Modify: `src/screens/order/OrderHistoryScreen.tsx`
- Modify: `src/screens/order/OrderDetailScreen.tsx`
- Modify: `src/screens/order/OrderTrackingScreen.tsx`
- Modify: `src/screens/order/OrderReviewScreen.tsx`
- Modify: `src/screens/payment/PaymentSuccessScreen.tsx`
- Modify: `src/screens/payment/PaymentFailedScreen.tsx`

- [ ] **Step 1: Apply token replacements + status colors**

For all 6 files apply the standard token replacements.

Additionally in order screens, find any order status color logic and update to:
```typescript
const getStatusColor = (status: string): string => {
  const s = status?.toUpperCase() ?? '';
  if (['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'OUT_FOR_DELIVERY'].includes(s))
    return '#FFD000';
  if (['DELIVERED', 'COMPLETED'].includes(s))
    return theme.colors.success;
  if (['CANCELLED', 'FAILED', 'REJECTED'].includes(s))
    return theme.colors.error;
  return theme.colors.text2;
};
```

In `OrderReviewScreen.tsx`, find star rating elements and set filled star color to `'#FFD000'`.

In `PaymentSuccessScreen.tsx`, find the primary CTA button and ensure it is yellow (`variant="primary"` or `backgroundColor: '#FFD000'`, `color: '#000000'`).

In `PaymentFailedScreen.tsx`, same — yellow CTA for "Try Again".

- [ ] **Step 2: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/order/OrderHistoryScreen.tsx src/screens/order/OrderDetailScreen.tsx src/screens/order/OrderTrackingScreen.tsx src/screens/order/OrderReviewScreen.tsx src/screens/payment/PaymentSuccessScreen.tsx src/screens/payment/PaymentFailedScreen.tsx
git commit -m "feat(screens): update order/payment screens with new tokens + status colors"
```

---

## Task 12: Update Profile screens

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`
- Modify: `src/screens/profile/SavedScreen.tsx`
- Modify: `src/screens/profile/AddressManagementScreen.tsx`
- Modify: `src/screens/profile/AddAddressScreen.tsx`

- [ ] **Step 1: Apply token replacements**

For all 4 files apply standard token replacements. Additionally:

In `AddressManagementScreen.tsx`, find the selected address border and set to `'#FFD000'`:
```typescript
selectedAddressBorder: {
  borderColor: '#FFD000',
  borderWidth: 1.5,
},
```

In `SavedScreen.tsx`, find any save/heart indicator and set its active color to `'#FFD000'`.

- [ ] **Step 2: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/profile/ProfileScreen.tsx src/screens/profile/SavedScreen.tsx src/screens/profile/AddressManagementScreen.tsx src/screens/profile/AddAddressScreen.tsx
git commit -m "feat(screens): update profile screens to new design tokens"
```

---

## Task 13: Update Support/Chat screen

**Files:**
- Modify: `src/screens/support/ChatScreen.tsx`

- [ ] **Step 1: Apply token replacements + chat bubble colors**

Apply standard token replacements. Additionally find chat bubble styles and update:

```typescript
// User message bubble (sent by customer)
userBubble: {
  backgroundColor: '#FFD000',
  borderRadius: borderRadius.lg,
  borderBottomRightRadius: borderRadius.sm,
  padding: spacing.md,
  maxWidth: '80%',
  alignSelf: 'flex-end',
},
userBubbleText: {
  color: '#000000',
  fontSize: typography.fontSize.body,
  fontWeight: typography.fontWeight.regular,
},

// Agent message bubble
agentBubble: {
  backgroundColor: theme.colors.surface2,
  borderRadius: borderRadius.lg,
  borderBottomLeftRadius: borderRadius.sm,
  padding: spacing.md,
  maxWidth: '80%',
  alignSelf: 'flex-start',
},
agentBubbleText: {
  color: theme.colors.text1,
  fontSize: typography.fontSize.body,
  fontWeight: typography.fontWeight.regular,
},
```

- [ ] **Step 2: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/screens/support/ChatScreen.tsx
git commit -m "feat(screens): update chat screen — yellow user bubbles, surface2 agent bubbles"
```

---

## Task 14: Update remaining shared components

**Files:**
- Modify: `src/components/ui/QuantitySelector.tsx`
- Modify: `src/components/ui/Skeleton.tsx`
- Modify: `src/components/StoreSelector.tsx`

- [ ] **Step 1: Update QuantitySelector.tsx token references**

In `src/components/ui/QuantitySelector.tsx`:
- `theme.colors.surfaceSecondary` → `theme.colors.surface2`
- `theme.colors.brand.primary` → `'#FFD000'`
- `theme.colors.textPrimary` → `theme.colors.text1`
- `theme.colors.textTertiary` → `theme.colors.text3`

- [ ] **Step 2: Update Skeleton.tsx token references**

In `src/components/ui/Skeleton.tsx`, find the shimmer gradient colors and update to use dark mode surfaces:
```typescript
// Replace shimmer gradient colors
const shimmerColors = isDark
  ? [theme.colors.surface2, theme.colors.surface3, theme.colors.surface2]
  : [theme.colors.surface1, theme.colors.surface2, theme.colors.surface1];
```
Apply standard token replacements for any other `theme.colors.*` references.

- [ ] **Step 3: Update StoreSelector.tsx token references**

In `src/components/StoreSelector.tsx`:
- `theme.colors.background` → `theme.colors.bg`
- `theme.colors.surface` → `theme.colors.surface1`
- `theme.colors.textPrimary` → `theme.colors.text1`
- `theme.colors.textSecondary` → `theme.colors.text2`
- `theme.colors.brand.primary` → `'#FFD000'`
- `theme.colors.divider` → `theme.colors.border`
- Remove the defensive check `if (!theme || !theme.colors || !theme.colors.brand)` — no longer needed since theme is always defined

- [ ] **Step 4: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add src/components/ui/QuantitySelector.tsx src/components/ui/Skeleton.tsx src/components/StoreSelector.tsx
git commit -m "feat(components): update QuantitySelector, Skeleton, StoreSelector to new tokens"
```

---

## Task 15: Verify TypeScript compiles cleanly

**Files:** All modified files

- [ ] **Step 1: Run TypeScript check**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx tsc --noEmit
```

Expected: Zero errors. If errors appear, fix them — most will be:
- `theme.colors.X` where `X` is an old token name → replace with new name per the theme.ts interface
- Missing `isDark` destructure → add `const { theme, isDark } = useTheme();`

- [ ] **Step 2: Fix any remaining old token references**

Search for any remaining old token names:

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
grep -r "theme\.colors\.background\b" src/screens/ src/components/
grep -r "theme\.colors\.textPrimary" src/screens/ src/components/
grep -r "theme\.colors\.surface\b[^1-4]" src/screens/ src/components/
grep -r "theme\.colors\.brand\.primary" src/screens/ src/components/
```

Fix any hits found.

- [ ] **Step 3: Commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add -A
git commit -m "fix(design): resolve remaining old token references, TypeScript clean"
```

---

## Task 15: Start Metro and smoke-test on Android

- [ ] **Step 1: Start Metro**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx react-native start --port 8888
```

- [ ] **Step 2: Run on Android (in a separate terminal)**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx react-native run-android --port 8888 --active-arch-only
```

- [ ] **Step 3: Smoke test checklist**

Walk through each screen and verify:
- [ ] Dark mode active (app opens in dark if after sunset, light if daytime)
- [ ] Bottom tab bar: dark/yellow active state visible
- [ ] Home screen: category tiles are square (not circles), dark background
- [ ] Menu screen: yellow active chip, food cards dark
- [ ] Item detail: yellow price in dark mode, yellow Add to Cart button
- [ ] Cart: yellow Checkout button
- [ ] Auth: inputs have yellow focus border
- [ ] Chat: yellow user bubbles
- [ ] No white flash / blank screens
- [ ] No console errors related to undefined theme tokens

- [ ] **Step 4: Final commit**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
git add -A
git commit -m "feat(design): complete Blinkit-inspired visual redesign — all 22 screens"
```
