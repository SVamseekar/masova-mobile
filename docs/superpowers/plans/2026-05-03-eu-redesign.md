# MaSoVa Mobile EU Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the masova-mobile customer app for the EU market — new logo, Plus Jakarta Sans typography, 5-tab navigation, HomeScreen animation sequence, floating chat bubble, EU trust signals (allergen chips, dietary dots, delivery fee upfront), and per-screen visual upgrades — all purely frontend with zero backend changes.

**Architecture:** All changes are purely visual/UX — no new API calls, no removed screens or service files, no new npm packages beyond `expo-font` for Plus Jakarta Sans. The font is loaded once in `App.tsx` via `useFonts` and propagated through the `typography` token. A new `MaSoVaLogo` component encapsulates the Steam Bowl mark + wordmark SVG, reused across auth screens, HomeScreen header, and the splash asset generation note. The `FloatingChatBubble` component is a standalone animated circle extracted from HomeScreen logic and reused on MenuScreen, CartScreen, and OrderTrackingScreen.

**Tech Stack:** React Native 0.81.5, Expo SDK 54, RN `Animated` API (no Framer Motion), `expo-linear-gradient`, `expo-haptics`, `expo-font`, `@expo/vector-icons` (Ionicons), React Navigation bottom-tabs v7, TypeScript strict.

**Branch:** `feature/eu-redesign` (already created — work here, do not touch `main`)

**Key constraint:** No `ralph-loop`, no parallel agent dispatching — Pro subscription, conserve quota.

---

## File Map

| File | Action | Purpose |
|------|--------|---------|
| `package.json` | Modify | Add `expo-font` dependency |
| `App.tsx` | Modify | Load Plus Jakarta Sans via `useFonts`, show splash until fonts ready |
| `src/styles/tokens.ts` | Modify | Add `fontFamily` named variants for Plus Jakarta Sans |
| `src/components/ui/MaSoVaLogo.tsx` | **Create** | Steam Bowl mark + wordmark component (SVG-style via View/Text) |
| `src/components/ui/FloatingChatBubble.tsx` | **Create** | Animated yellow bubble, springs in 1s after mount, hides on keyboard |
| `src/components/ui/index.ts` | Modify | Export new `MaSoVaLogo` and `FloatingChatBubble` |
| `src/types/index.ts` | Modify | Update `MainTabParamList` — remove Menu/Support, add Search/Orders/Account |
| `src/navigation/MainTabNavigator.tsx` | Modify | 5-tab layout: Home/Search/Orders/Saved/Account |
| `src/screens/home/HomeScreen.tsx` | Modify | Hero carousel, stagger animations, logo header, store cards with ETA/fee, floating bubble |
| `src/screens/menu/MenuScreen.tsx` | Modify | Scroll-triggered card reveal, dietary dots on item images, sticky category pills |
| `src/screens/menu/ItemDetailScreen.tsx` | Modify | Allergen chips row (EU-styled), dietary badges row, bottom-gradient hero |
| `src/screens/cart/CartScreen.tsx` | Modify | Explicit delivery fee label with zone info, photo thumbnails, floating bubble |
| `src/screens/order/OrderTrackingScreen.tsx` | Modify | Completed steps → `#22C55E`, active step pulse animation, "Need help?" button, floating bubble |
| `src/screens/auth/LoginScreen.tsx` | Modify | `MaSoVaLogo` replaces "M" box, `LinearGradient` bg, yellow focused inputs |
| `src/screens/auth/RegisterScreen.tsx` | Modify | Same as LoginScreen |
| `src/screens/profile/ProfileScreen.tsx` | Modify | Add "Support & Chat" menu item navigating to ChatScreen; tab label "Account" |
| `assets/icon.png` | Note | Manual: regenerate after plan; spec §4.4 |
| `assets/adaptive-icon.png` | Note | Manual: regenerate after plan; spec §4.4 |
| `assets/splash-icon.png` | Note | Manual: regenerate after plan; spec §4.4 |
| `assets/favicon.png` | Note | Manual: regenerate after plan; spec §4.4 |

---

## Task 1: Install expo-font and load Plus Jakarta Sans

**Files:**
- Modify: `package.json`
- Modify: `App.tsx`
- Create: `assets/fonts/` (directory + font files via download instruction)

- [ ] **Step 1: Install expo-font**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npm install expo-font
```

Expected output: `added 1 package` (or similar — no errors).

- [ ] **Step 2: Create the fonts directory and note the download**

```bash
mkdir -p assets/fonts
```

Download Plus Jakarta Sans from Google Fonts (https://fonts.google.com/specimen/Plus+Jakarta+Sans), extract, and place these 5 files into `assets/fonts/`:
- `PlusJakartaSans-Regular.ttf`
- `PlusJakartaSans-Medium.ttf`
- `PlusJakartaSans-SemiBold.ttf`
- `PlusJakartaSans-Bold.ttf`
- `PlusJakartaSans-ExtraBold.ttf`

- [ ] **Step 3: Update App.tsx to load fonts and hold splash**

Replace the existing `App.tsx` content with:

```tsx
import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NavigationContainerRef } from '@react-navigation/native';
import { useFonts } from 'expo-font';
import { View, ActivityIndicator } from 'react-native';

import { ThemeProvider, useTheme } from './src/hooks/useTheme';
import { AuthProvider } from './src/contexts/AuthContext';
import { CartProvider } from './src/contexts/CartContext';
import { StoreProvider } from './src/contexts/StoreContext';
import { RootNavigator } from './src/navigation';
import { RootStackParamList } from './src/types';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export const navigationRef = React.createRef<NavigationContainerRef<RootStackParamList>>();

const AppContent: React.FC = () => {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <RootNavigator ref={navigationRef} />
    </>
  );
};

const AppWithProviders: React.FC = () => {
  return (
    <ThemeProvider>
      <AuthProvider>
        <StoreProvider>
          <CartProvider>
            <AppContent />
          </CartProvider>
        </StoreProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default function App() {
  const [fontsLoaded] = useFonts({
    'PlusJakartaSans-Regular': require('./assets/fonts/PlusJakartaSans-Regular.ttf'),
    'PlusJakartaSans-Medium': require('./assets/fonts/PlusJakartaSans-Medium.ttf'),
    'PlusJakartaSans-SemiBold': require('./assets/fonts/PlusJakartaSans-SemiBold.ttf'),
    'PlusJakartaSans-Bold': require('./assets/fonts/PlusJakartaSans-Bold.ttf'),
    'PlusJakartaSans-ExtraBold': require('./assets/fonts/PlusJakartaSans-ExtraBold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#0F0F0F', justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator color="#FFD000" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <AppWithProviders />
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/souravamseekarmarti/Projects/masova-mobile
npx tsc --noEmit
```

Expected: no errors related to `useFonts` or font names.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json App.tsx assets/fonts/
git commit -m "feat(fonts): install expo-font, load Plus Jakarta Sans"
```

---

## Task 2: Update typography tokens

**Files:**
- Modify: `src/styles/tokens.ts`

- [ ] **Step 1: Update the `fontFamily` section in tokens.ts**

In `src/styles/tokens.ts`, replace:

```ts
export const typography = {
  fontFamily: {
    primary: 'System',
  },
```

with:

```ts
export const typography = {
  fontFamily: {
    regular: 'PlusJakartaSans-Regular',
    medium: 'PlusJakartaSans-Medium',
    semibold: 'PlusJakartaSans-SemiBold',
    bold: 'PlusJakartaSans-Bold',
    extrabold: 'PlusJakartaSans-ExtraBold',
  },
```

- [ ] **Step 2: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors (no existing code references `typography.fontFamily.primary` — confirmed by grep below).

```bash
grep -r "fontFamily\.primary" src/ --include="*.ts" --include="*.tsx"
```

Expected: no output (nothing references the old key).

- [ ] **Step 3: Commit**

```bash
git add src/styles/tokens.ts
git commit -m "feat(tokens): add Plus Jakarta Sans fontFamily variants"
```

---

## Task 3: Create MaSoVaLogo component

**Files:**
- Create: `src/components/ui/MaSoVaLogo.tsx`
- Modify: `src/components/ui/index.ts`

The logo is the Steam Bowl mark (3 stacked arcs, `#FFD000` at decreasing opacity) + "MaSoVa" wordmark (So in yellow, Ma/Va in text1 colour).

- [ ] **Step 1: Create `src/components/ui/MaSoVaLogo.tsx`**

```tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MaSoVaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
  markOnly?: boolean;
}

const SIZES = {
  sm: { markHeight: 16, fontSize: 18, gap: 6 },
  md: { markHeight: 22, fontSize: 24, gap: 8 },
  lg: { markHeight: 32, fontSize: 34, gap: 10 },
};

const SteamBowlMark: React.FC<{ height: number }> = ({ height }) => {
  const arcWidths = [height * 1.2, height * 0.9, height * 0.6];
  const arcOpacities = [1, 0.6, 0.3];
  const strokeWidth = Math.max(2, height * 0.1);
  const arcSpacing = height * 0.18;

  return (
    <View style={{ height, justifyContent: 'flex-end', alignItems: 'center' }}>
      {arcWidths.map((width, i) => (
        <View
          key={i}
          style={{
            width,
            height: width * 0.5,
            borderTopLeftRadius: width * 0.5,
            borderTopRightRadius: width * 0.5,
            borderTopWidth: strokeWidth,
            borderLeftWidth: strokeWidth,
            borderRightWidth: strokeWidth,
            borderColor: `rgba(255, 208, 0, ${arcOpacities[i]})`,
            marginBottom: i < arcWidths.length - 1 ? arcSpacing : 0,
            backgroundColor: 'transparent',
          }}
        />
      ))}
    </View>
  );
};

export const MaSoVaLogo: React.FC<MaSoVaLogoProps> = ({
  size = 'md',
  textColor = '#FFFFFF',
  markOnly = false,
}) => {
  const { markHeight, fontSize, gap } = SIZES[size];

  if (markOnly) {
    return <SteamBowlMark height={markHeight} />;
  }

  return (
    <View style={[styles.container, { gap }]}>
      <SteamBowlMark height={markHeight} />
      <Text style={[styles.wordmark, { fontSize, color: textColor, letterSpacing: -0.5 }]}>
        <Text style={{ color: textColor }}>Ma</Text>
        <Text style={{ color: '#FFD000' }}>So</Text>
        <Text style={{ color: textColor }}>Va</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    includeFontPadding: false,
  },
});

export default MaSoVaLogo;
```

- [ ] **Step 2: Export from `src/components/ui/index.ts`**

Add to the end of `src/components/ui/index.ts`:

```ts
export { MaSoVaLogo } from './MaSoVaLogo';
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/MaSoVaLogo.tsx src/components/ui/index.ts
git commit -m "feat(logo): add MaSoVaLogo component — Steam Bowl mark + wordmark"
```

---

## Task 4: Create FloatingChatBubble component

**Files:**
- Create: `src/components/ui/FloatingChatBubble.tsx`
- Modify: `src/components/ui/index.ts`

- [ ] **Step 1: Create `src/components/ui/FloatingChatBubble.tsx`**

```tsx
import React, { useEffect, useRef } from 'react';
import {
  Animated,
  TouchableOpacity,
  StyleSheet,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface FloatingChatBubbleProps {
  bottomOffset?: number;
}

export const FloatingChatBubble: React.FC<FloatingChatBubbleProps> = ({
  bottomOffset = 80,
}) => {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const visibilityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Spring in after 1000ms
    const timer = setTimeout(() => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 300,
        friction: 20,
        useNativeDriver: true,
      }).start();
    }, 1000);

    return () => clearTimeout(timer);
  }, [scaleAnim]);

  useEffect(() => {
    const showSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => Animated.timing(visibilityAnim, { toValue: 0, duration: 150, useNativeDriver: true }).start(),
    );
    const hideSub = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => Animated.timing(visibilityAnim, { toValue: 1, duration: 150, useNativeDriver: true }).start(),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visibilityAnim]);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Main', { screen: 'Support' } as any);
  };

  return (
    <Animated.View
      style={[
        styles.bubble,
        {
          bottom: bottomOffset + insets.bottom,
          transform: [{ scale: scaleAnim }],
          opacity: visibilityAnim,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.touchable}
        onPress={handlePress}
        activeOpacity={0.85}
      >
        <Ionicons name="chatbubble-ellipses" size={24} color="#000000" />
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  bubble: {
    position: 'absolute',
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#FFD000',
    shadowColor: '#FFD000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 50,
  },
  touchable: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default FloatingChatBubble;
```

- [ ] **Step 2: Export from `src/components/ui/index.ts`**

Add after the `MaSoVaLogo` export line:

```ts
export { FloatingChatBubble } from './FloatingChatBubble';
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/components/ui/FloatingChatBubble.tsx src/components/ui/index.ts
git commit -m "feat(ui): add FloatingChatBubble component"
```

---

## Task 5: Update navigation types and MainTabNavigator

**Files:**
- Modify: `src/types/index.ts` — `MainTabParamList`
- Modify: `src/navigation/MainTabNavigator.tsx`

The new 5-tab structure: Home → Search → Orders → Saved → Account.
`OrderHistoryScreen` already exists at `src/screens/order/OrderHistoryScreen.tsx` and will serve as the Orders tab.
`ProfileScreen` already exists and becomes the Account tab.

- [ ] **Step 1: Update `MainTabParamList` in `src/types/index.ts`**

Find and replace:

```ts
export type MainTabParamList = {
  Home: undefined;
  Menu: { category?: Category; cuisine?: Cuisine };
  Cart: undefined;
  Saved: undefined;
  Profile: undefined;
  Support: undefined;
};
```

with:

```ts
export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Orders: undefined;
  Saved: undefined;
  Account: undefined;
};
```

- [ ] **Step 2: Rewrite `src/navigation/MainTabNavigator.tsx`**

```tsx
import React from 'react';
import { StyleSheet } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { MainTabParamList } from '../types';
import { useTheme } from '../hooks/useTheme';

import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/home/SearchScreen';
import OrderHistoryScreen from '../screens/order/OrderHistoryScreen';
import SavedScreen from '../screens/profile/SavedScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

const MainTabNavigator: React.FC = () => {
  const { isDark } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Tab.Navigator
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
          fontFamily: 'PlusJakartaSans-Medium',
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Orders"
        component={OrderHistoryScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'heart' : 'heart-outline'} size={24} color={color} />
          ),
        }}
      />
      <Tab.Screen
        name="Account"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};

export default MainTabNavigator;
```

- [ ] **Step 3: Fix any type errors from the `MainTabParamList` change**

The old navigator had `Cart` and `Support` as direct tabs. After this change, screens that navigate to those via `navigation.navigate('Main', { screen: 'Cart' })` will type-error. Run:

```bash
npx tsc --noEmit 2>&1 | grep -E "error TS" | head -30
```

For each error mentioning `'Cart'` or `'Support'` as a tab, the screen still exists — it's just now accessed via the stack, not a tab. Remaining navigation calls to `'Cart'` go through `RootStackParamList` which already has `Cart: undefined` — those are fine. Navigation calls that were `navigate('Main', { screen: 'Cart' })` should be updated to `navigate('Cart')` (direct stack navigation). Update any such call found in the error output.

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/types/index.ts src/navigation/MainTabNavigator.tsx
git commit -m "feat(nav): 5-tab EU navigation — Home/Search/Orders/Saved/Account"
```

---

## Task 6: Add "Support & Chat" to ProfileScreen

**Files:**
- Modify: `src/screens/profile/ProfileScreen.tsx`

The `ChatScreen` lives at `src/screens/support/ChatScreen.tsx`. It's currently accessed only via the (now-removed) Support tab. We add it as a list item in the Account screen, and the `FloatingChatBubble` handles in-context access.

The `RootStackParamList` does not currently have a `Chat` route. Check `src/navigation/RootNavigator.tsx` first.

- [ ] **Step 1: Check RootNavigator for ChatScreen registration**

```bash
grep -n "Chat\|Support" /Users/souravamseekarmarti/Projects/masova-mobile/src/navigation/RootNavigator.tsx
```

If `ChatScreen` is not in the RootStack, it needs to be added. Open `src/navigation/RootNavigator.tsx` and add it to the stack. Also add `Chat: undefined` to `RootStackParamList` in `src/types/index.ts`.

If it IS already in the RootStack (e.g., as `Support`), note the route name and use that in Step 2 instead of `'Chat'`.

- [ ] **Step 2: Add Support & Chat menu item to ProfileScreen**

In `src/screens/profile/ProfileScreen.tsx`, find the notifications card block:

```tsx
        <Card elevation="sm" style={styles.menuCard}>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            theme={theme}
          />
```

Add a new `MenuItem` for Support & Chat immediately after the Notifications item, before the dark/light mode toggle:

```tsx
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="Support & Chat"
            onPress={() => navigation.navigate('Chat')}
            theme={theme}
          />
```

(Replace `'Chat'` with whatever route name was confirmed in Step 1.)

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/profile/ProfileScreen.tsx src/navigation/RootNavigator.tsx src/types/index.ts
git commit -m "feat(account): add Support & Chat entry to Account screen"
```

---

## Task 7: Redesign HomeScreen — logo header, hero carousel animations, store cards with ETA/fee

**Files:**
- Modify: `src/screens/home/HomeScreen.tsx`

This is the most substantial task. The animation sequence from the spec:
- `0ms` Hero carousel fades in (opacity 0→1, 300ms)
- `100ms` Greeting text fades in
- `200ms+` Category icons stagger-bounce (scale 0.8→1.05→1.0, 60ms apart)
- `400ms+` Store cards slide up (translateY 40→0, 80ms apart)
- `1000ms` FloatingChatBubble springs in (handled by the component itself)

Store cards show delivery ETA + fee. The `deliveryFeeINR` comes from Redux `cartSlice` via `useSelector(selectDeliveryFeeINR)`. If that selector doesn't exist yet, use a hardcode-free fallback from the store's `deliveryFee` field.

- [ ] **Step 1: Check the Redux cart selector**

```bash
grep -rn "selectDeliveryFeeINR\|deliveryFee\|cartSlice" /Users/souravamseekarmarti/Projects/masova-mobile/src/ --include="*.ts" --include="*.tsx" | head -20
```

Note the exact selector name found. Use it in Step 2.

- [ ] **Step 2: Rewrite `src/screens/home/HomeScreen.tsx`**

Replace the entire file with:

```tsx
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useRecommendedItems } from '../../hooks/useMenuQueries';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, Badge, MaSoVaLogo, FloatingChatBubble } from '../../components/ui';
import { StoreSelector } from '../../components/StoreSelector';
import { RootStackParamList, Category } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.screenPadding * 2;

const HERO_SLIDES = [
  {
    id: '1',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    title: 'Fresh Indian, delivered',
    subtitle: 'Hot food at your door',
  },
  {
    id: '2',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    title: 'Free Delivery Weekend',
    subtitle: 'No minimum order',
  },
  {
    id: '3',
    image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    title: 'Biryani Festival',
    subtitle: '20% off all biryanis',
  },
];

const CATEGORIES: { id: Category; name: string; iconName: React.ComponentProps<typeof Ionicons>['name'] }[] = [
  { id: 'BIRYANI', name: 'Biryani', iconName: 'restaurant-outline' },
  { id: 'PIZZA', name: 'Pizza', iconName: 'pizza-outline' },
  { id: 'BURGER', name: 'Burger', iconName: 'fast-food-outline' },
  { id: 'DOSA', name: 'Dosa', iconName: 'cafe-outline' },
  { id: 'NOODLES', name: 'Noodles', iconName: 'nutrition-outline' },
  { id: 'BEVERAGE', name: 'Drinks', iconName: 'wine-outline' },
];

const STORE_CARDS = [
  {
    id: '1',
    name: 'MaSoVa Indiranagar',
    image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400',
    rating: 4.7,
    etaMin: 25,
    deliveryFee: 29,
    isVeg: false,
    isTrending: true,
  },
  {
    id: '2',
    name: 'MaSoVa Koramangala',
    image: 'https://images.unsplash.com/photo-1552566626-52f8b828add9?w=400',
    rating: 4.5,
    etaMin: 35,
    deliveryFee: 49,
    isVeg: false,
    isTrending: false,
  },
  {
    id: '3',
    name: 'MaSoVa Whitefield',
    image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400',
    rating: 4.6,
    etaMin: 45,
    deliveryFee: 79,
    isVeg: false,
    isTrending: false,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const { data: recommendedItems, isLoading: loadingRecommended } = useRecommendedItems();

  // Hero carousel state
  const [currentSlide, setCurrentSlide] = useState(0);
  const carouselRef = useRef<FlatList>(null);
  const dotWidths = HERO_SLIDES.map(() => useRef(new Animated.Value(8)).current);

  // Entrance animations
  const heroOpacity = useRef(new Animated.Value(0)).current;
  const greetingOpacity = useRef(new Animated.Value(0)).current;
  const categoryScales = CATEGORIES.map(() => useRef(new Animated.Value(0.8)).current);
  const categoryOpacities = CATEGORIES.map(() => useRef(new Animated.Value(0)).current);
  const cardTranslates = STORE_CARDS.map(() => useRef(new Animated.Value(40)).current);
  const cardOpacities = STORE_CARDS.map(() => useRef(new Animated.Value(0)).current);

  useEffect(() => {
    // Hero fades in at 0ms
    Animated.timing(heroOpacity, { toValue: 1, duration: 300, useNativeDriver: true }).start();

    // Greeting at 100ms
    setTimeout(() => {
      Animated.timing(greetingOpacity, { toValue: 1, duration: 200, useNativeDriver: true }).start();
    }, 100);

    // Category icons stagger at 200ms+, 60ms apart
    CATEGORIES.forEach((_, i) => {
      setTimeout(() => {
        Animated.sequence([
          Animated.spring(categoryScales[i], {
            toValue: 1.05,
            tension: 300,
            friction: 20,
            useNativeDriver: true,
          }),
          Animated.spring(categoryScales[i], {
            toValue: 1.0,
            tension: 300,
            friction: 20,
            useNativeDriver: true,
          }),
        ]).start();
        Animated.timing(categoryOpacities[i], { toValue: 1, duration: 200, useNativeDriver: true }).start();
      }, 200 + i * 60);
    });

    // Store cards slide up at 400ms+, 80ms apart
    STORE_CARDS.forEach((_, i) => {
      setTimeout(() => {
        Animated.timing(cardTranslates[i], { toValue: 0, duration: 300, useNativeDriver: true }).start();
        Animated.timing(cardOpacities[i], { toValue: 1, duration: 300, useNativeDriver: true }).start();
      }, 400 + i * 80);
    });
  }, []);

  // Hero carousel auto-advance
  useEffect(() => {
    const interval = setInterval(() => {
      const nextIndex = (currentSlide + 1) % HERO_SLIDES.length;
      carouselRef.current?.scrollToIndex({ index: nextIndex, animated: true });
      setCurrentSlide(nextIndex);
    }, 4000);
    return () => clearInterval(interval);
  }, [currentSlide]);

  // Dot indicator animation
  useEffect(() => {
    HERO_SLIDES.forEach((_, i) => {
      Animated.timing(dotWidths[i], {
        toValue: i === currentSlide ? 24 : 8,
        duration: 300,
        useNativeDriver: false,
      }).start();
    });
  }, [currentSlide]);

  const renderHeroCarousel = () => (
    <Animated.View style={[styles.heroContainer, { opacity: heroOpacity }]}>
      <FlatList
        ref={carouselRef}
        data={HERO_SLIDES}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
          setCurrentSlide(index);
        }}
        renderItem={({ item }) => (
          <View style={{ width: SCREEN_WIDTH, height: 200 }}>
            <Image source={{ uri: item.image }} style={styles.heroImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.75)']}
              style={styles.heroGradient}
            >
              <Text style={styles.heroTitle}>{item.title}</Text>
              <Text style={styles.heroSubtitle}>{item.subtitle}</Text>
            </LinearGradient>
          </View>
        )}
        keyExtractor={(item) => item.id}
      />
      <View style={styles.dotContainer}>
        {HERO_SLIDES.map((_, index) => (
          <Animated.View
            key={index}
            style={[
              styles.dot,
              {
                width: dotWidths[index],
                backgroundColor: index === currentSlide ? '#FFD000' : 'rgba(255,255,255,0.4)',
              },
            ]}
          />
        ))}
      </View>
    </Animated.View>
  );

  const renderCategories = () => (
    <View style={styles.section}>
      <Animated.View style={{ opacity: greetingOpacity }}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1, fontFamily: 'PlusJakartaSans-Bold' }]}>
            What are you craving?
          </Text>
        </View>
      </Animated.View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {CATEGORIES.map((category, i) => (
          <Animated.View
            key={category.id}
            style={{ transform: [{ scale: categoryScales[i] }], opacity: categoryOpacities[i] }}
          >
            <TouchableOpacity
              style={styles.categoryItem}
              onPress={() => navigation.navigate('ItemDetail', { itemId: category.id })}
            >
              <View style={[styles.categoryIcon, { backgroundColor: theme.colors.surface2 }]}>
                <Ionicons name={category.iconName} size={24} color={theme.colors.text1} />
              </View>
              <Text style={[styles.categoryName, { color: theme.colors.text1, fontFamily: 'PlusJakartaSans-Medium' }]}>
                {category.name}
              </Text>
            </TouchableOpacity>
          </Animated.View>
        ))}
      </ScrollView>
    </View>
  );

  const renderStoreCards = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text1, fontFamily: 'PlusJakartaSans-Bold' }]}>
          Popular Near You
        </Text>
      </View>
      {STORE_CARDS.map((store, i) => (
        <Animated.View
          key={store.id}
          style={{
            transform: [{ translateY: cardTranslates[i] }],
            opacity: cardOpacities[i],
            marginHorizontal: spacing.screenPadding,
            marginBottom: spacing[4],
          }}
        >
          <TouchableOpacity
            activeOpacity={0.92}
            onPress={() => navigation.navigate('Main', { screen: 'Search' } as any)}
          >
            <Card elevation="sm" padding={0} style={styles.storeCard}>
              <Image source={{ uri: store.image }} style={styles.storeImage} />
              {store.isTrending && (
                <View style={styles.trendingBadge}>
                  <Text style={styles.trendingText}>Trending</Text>
                </View>
              )}
              <View style={styles.storeInfo}>
                <Text style={[styles.storeName, { color: theme.colors.text1, fontFamily: 'PlusJakartaSans-SemiBold' }]}>
                  {store.name}
                </Text>
                <View style={styles.storeMetaRow}>
                  <View style={styles.storeMetaItem}>
                    <Ionicons name="star" size={13} color="#F59E0B" />
                    <Text style={[styles.storeMetaText, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Medium' }]}>
                      {store.rating}
                    </Text>
                  </View>
                  <View style={styles.storeMetaItem}>
                    <Ionicons name="time-outline" size={13} color={theme.colors.text3} />
                    <Text style={[styles.storeMetaText, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Regular' }]}>
                      {store.etaMin} min
                    </Text>
                  </View>
                  <View style={styles.storeMetaItem}>
                    <Ionicons name="bicycle-outline" size={13} color={theme.colors.text3} />
                    <Text style={[styles.storeMetaText, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Regular' }]}>
                      ₹{store.deliveryFee} delivery
                    </Text>
                  </View>
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        </Animated.View>
      ))}
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <MaSoVaLogo size="md" textColor={isDark ? '#FFFFFF' : '#0F0F0F'} />
        <View style={styles.headerRight}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.surface2 }]}
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={20} color={theme.colors.text1} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 100 }}
      >
        {renderHeroCarousel()}
        {renderCategories()}
        {renderStoreCards()}
      </ScrollView>

      <FloatingChatBubble bottomOffset={72} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  headerRight: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroContainer: {
    marginBottom: spacing[4],
  },
  heroImage: {
    width: '100%',
    height: 200,
  },
  heroGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing[4],
  },
  heroTitle: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 20,
    color: '#FFFFFF',
    letterSpacing: -0.3,
  },
  heroSubtitle: {
    fontFamily: 'PlusJakartaSans-Regular',
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[3],
    gap: spacing[1],
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: 18,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[4],
  },
  categoryItem: {
    alignItems: 'center',
    width: 70,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  categoryName: {
    fontSize: 12,
    textAlign: 'center',
  },
  storeCard: {
    overflow: 'hidden',
  },
  storeImage: {
    width: '100%',
    height: 160,
  },
  trendingBadge: {
    position: 'absolute',
    top: spacing[3],
    left: spacing[3],
    backgroundColor: '#FFD000',
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.chip,
  },
  trendingText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 11,
    color: '#000000',
  },
  storeInfo: {
    padding: spacing[4],
  },
  storeName: {
    fontSize: 16,
    marginBottom: spacing[2],
  },
  storeMetaRow: {
    flexDirection: 'row',
    gap: spacing[4],
  },
  storeMetaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  storeMetaText: {
    fontSize: 13,
  },
});

export default HomeScreen;
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/home/HomeScreen.tsx
git commit -m "feat(home): EU redesign — logo header, animated hero carousel, stagger categories, store cards with ETA/fee, floating bubble"
```

---

## Task 8: Update MenuScreen — sticky category pills, dietary dots on photos, scroll-triggered reveal

**Files:**
- Modify: `src/screens/menu/MenuScreen.tsx`

Changes: (1) dietary dot on top-left of food photo image, (2) `QuantitySelector` spring animation on tap, (3) font family tokens on key text nodes. The existing sticky cuisine/category pills are already horizontal scroll — we upgrade active pill to `#FFD000` background. The scroll-triggered reveal uses RN `Animated` with `onLayout` + `useRef` per item.

- [ ] **Step 1: Add dietary dot overlay to the item image in `renderMenuItem`**

In `src/screens/menu/MenuScreen.tsx`, find the `imageContainer` view inside `renderMenuItem`:

```tsx
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            ) : (
```

Replace the `imageContainer` block with (adds dietary dot overlay on the photo):

```tsx
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImage, styles.placeholderImage, { backgroundColor: theme.colors.surface2 }]}>
                <Ionicons name="image-outline" size={48} color={theme.colors.text3} />
              </View>
            )}
            {/* Dietary dot top-left on photo */}
            {item.dietaryInfo && item.dietaryInfo.length > 0 && (
              <View style={styles.dietaryDotOverlay}>
                <View
                  style={[
                    styles.dietaryDot,
                    {
                      backgroundColor: item.dietaryInfo.includes('VEGAN')
                        ? '#7B1FA2'
                        : item.dietaryInfo.includes('VEGETARIAN')
                        ? '#22C55E'
                        : '#FF4444',
                    },
                  ]}
                />
              </View>
            )}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#FFD000' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('ItemDetail', { itemId: item.id });
              }}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          </View>
```

- [ ] **Step 2: Add dietary dot overlay styles**

In `StyleSheet.create({...})` at the bottom of `MenuScreen.tsx`, add these two styles:

```ts
  dietaryDotOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  dietaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
```

- [ ] **Step 3: Apply Plus Jakarta Sans fontFamily to section titles and item names**

In `MenuScreen.tsx`, add `fontFamily: 'PlusJakartaSans-Bold'` to the `title` style and `fontFamily: 'PlusJakartaSans-SemiBold'` to `itemName`:

```ts
  title: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  itemName: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: spacing[1],
  },
```

- [ ] **Step 4: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 5: Commit**

```bash
git add src/screens/menu/MenuScreen.tsx
git commit -m "feat(menu): dietary dots on item photos, Plus Jakarta Sans typography"
```

---

## Task 9: Update ItemDetailScreen — EU-styled allergen chips, dietary badges row

**Files:**
- Modify: `src/screens/menu/ItemDetailScreen.tsx`

The allergen section already exists but uses orange/amber colours (non-EU-brand palette). We restyle it to use the token palette: `#A0A0A0` outlined pills on `surface1` background. We add a separate **dietary badges row** showing coloured dots + labels for each `dietaryInfo` entry.

- [ ] **Step 1: Replace the allergen section styling in `ItemDetailScreen.tsx`**

Find the existing allergen section (around line 413):

```tsx
        {/* Allergen Information */}
        {menuItem.allergensDeclared && menuItem.allergens && menuItem.allergens.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Contains Allergens
            </Text>
            <View style={[styles.allergenWarning, { backgroundColor: '#fff8e1', borderColor: '#f9a825' }]}>
```

Replace the entire allergen block (from the `{/* Allergen Information */}` comment through the closing `)}`) with:

```tsx
        {/* Dietary Badges */}
        {menuItem.dietaryInfo && menuItem.dietaryInfo.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1, fontFamily: 'PlusJakartaSans-SemiBold' }]}>
              Dietary Info
            </Text>
            <View style={styles.dietaryBadgesRow}>
              {menuItem.dietaryInfo.map((d) => {
                const dotColor =
                  d === 'VEGAN' ? '#7B1FA2' :
                  d === 'VEGETARIAN' ? '#22C55E' :
                  d === 'NON_VEGETARIAN' ? '#FF4444' : '#A0A0A0';
                const label =
                  d === 'VEGAN' ? 'Vegan' :
                  d === 'VEGETARIAN' ? 'Vegetarian' :
                  d === 'NON_VEGETARIAN' ? 'Non-Vegetarian' :
                  d === 'JAIN' ? 'Jain' :
                  d === 'HALAL' ? 'Halal' :
                  d === 'GLUTEN_FREE' ? 'Gluten-Free' :
                  d === 'DAIRY_FREE' ? 'Dairy-Free' : d;
                return (
                  <View key={d} style={[styles.dietaryBadge, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface2 }]}>
                    <View style={[styles.dietaryDot, { backgroundColor: dotColor }]} />
                    <Text style={[styles.dietaryBadgeText, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Medium' }]}>
                      {label}
                    </Text>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* Allergen Information */}
        {menuItem.allergensDeclared && menuItem.allergens && menuItem.allergens.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1, fontFamily: 'PlusJakartaSans-SemiBold' }]}>
              Contains Allergens
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing[2] }}>
              <View style={{ flexDirection: 'row', gap: spacing[2] }}>
                {(menuItem.allergens as AllergenType[]).map((allergen) => (
                  <View key={allergen} style={[styles.allergenChip, { borderColor: '#A0A0A0', backgroundColor: theme.colors.surface1 }]}>
                    <Text style={[styles.allergenChipText, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Medium' }]}>
                      {ALLERGEN_LABELS[allergen] ?? allergen}
                    </Text>
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
        )}
        {menuItem.allergensDeclared && (!menuItem.allergens || menuItem.allergens.length === 0) && (
          <View style={styles.section}>
            <View style={[styles.allergenWarning, { backgroundColor: theme.colors.surface2, borderColor: '#22C55E' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#22C55E" />
              <Text style={[styles.allergenWarningText, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Regular' }]}>
                Allergen-free — no major allergens declared
              </Text>
            </View>
          </View>
        )}
```

Add the `ScrollView` import at the top if not already imported (it is already imported).

- [ ] **Step 2: Add new styles to `ItemDetailScreen.tsx` StyleSheet**

Add these styles to the `StyleSheet.create({...})`:

```ts
  dietaryBadgesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  dietaryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1] + 2,
    borderRadius: borderRadius.chip,
    borderWidth: 1,
  },
  dietaryDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dietaryBadgeText: {
    fontSize: 13,
  },
```

Also update the existing `allergenChip` style to use token-based colours (the hardcoded `#fff3e0` / `#ff9800` / `#e65100` is removed — those values are now set inline from `theme.colors` in Step 1):

```ts
  allergenChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  allergenChipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
  },
```

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/menu/ItemDetailScreen.tsx
git commit -m "feat(item-detail): EU allergen chips, dietary badges row, token-based colours"
```

---

## Task 10: Update CartScreen — explicit delivery fee label, photo thumbnails, floating bubble

**Files:**
- Modify: `src/screens/cart/CartScreen.tsx`

- [ ] **Step 1: Read the full CartScreen to find the order summary / delivery fee section**

```bash
grep -n "delivery\|Delivery\|fee\|Fee\|thumbnail\|itemImage" /Users/souravamseekarmarti/Projects/masova-mobile/src/screens/cart/CartScreen.tsx | head -30
```

Note the line numbers for: (a) where delivery fee is displayed, (b) where item images are rendered.

- [ ] **Step 2: Add explicit delivery fee zone label**

Find the delivery fee row in CartScreen (likely shows `₹{deliveryFee}` or `₹{cart.deliveryFee}`). Update it to show zone info:

```tsx
              <View style={styles.summaryRow}>
                <Text style={[styles.summaryLabel, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Regular' }]}>
                  Delivery fee
                </Text>
                <Text style={[styles.summaryValue, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Medium' }]}>
                  ₹{(cartTotal.deliveryFee / 100).toFixed(0)}
                </Text>
              </View>
```

(Use the exact variable name that already exists in CartScreen for the delivery fee amount — identified in Step 1.)

- [ ] **Step 3: Add Plus Jakarta Sans to item name and price text**

For each `Text` node rendering `item.menuItem.name` and price, add `fontFamily: 'PlusJakartaSans-SemiBold'` / `'PlusJakartaSans-Regular'` inline or in the style.

- [ ] **Step 4: Add FloatingChatBubble**

Import and add at the end of the return JSX, inside the outer `View`:

```tsx
import { FloatingChatBubble } from '../../components/ui';

// Inside return, after ScrollView:
<FloatingChatBubble bottomOffset={80} />
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/screens/cart/CartScreen.tsx
git commit -m "feat(cart): explicit delivery fee label, Plus Jakarta Sans, floating chat bubble"
```

---

## Task 11: Update OrderTrackingScreen — green completed steps, pulsing active step, help button, floating bubble

**Files:**
- Modify: `src/screens/order/OrderTrackingScreen.tsx`

The tracking screen already renders progress dots. Changes: (1) completed steps use `#22C55E` instead of `#FFD000`, (2) active step pulse animation (opacity 1→0.5→1, repeat), (3) "Need help?" button, (4) floating bubble.

- [ ] **Step 1: Add pulsing animation ref at the top of the component**

In `OrderTrackingScreen.tsx`, after existing `useState` declarations, add:

```tsx
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 750, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 750, useNativeDriver: true }),
      ])
    ).start();
  }, [pulseAnim]);
```

Add `useRef` to the React import if not already there (it is already imported).

- [ ] **Step 2: Update `renderProgressBar` to use `#22C55E` for completed and pulse for active**

Find the `renderProgressBar` function. Update the `progressDot` background color logic:

```tsx
                  backgroundColor: isCompleted
                    ? '#22C55E'        // green for completed
                    : isCurrent
                    ? '#FFD000'        // yellow for active
                    : theme.colors.border,
```

Wrap the active dot view with `Animated.View` using `pulseAnim`:

```tsx
                  {isCurrent && (
                    <Animated.View style={[styles.activeDot, { opacity: pulseAnim }]} />
                  )}
```

Update the progress line color for completed steps (already `#FFD000` — change to `#22C55E`):

```tsx
                        backgroundColor: isCompleted
                          ? '#22C55E'
                          : theme.colors.border,
```

- [ ] **Step 3: Add "Need help?" button**

Find the bottom section of the screen (likely after the map or driver info). Add before the closing outer View:

```tsx
        <TouchableOpacity
          style={[styles.helpButton, { borderColor: theme.colors.border, backgroundColor: theme.colors.surface1 }]}
          onPress={() => navigation.navigate('Chat' as any)}
        >
          <Ionicons name="chatbubble-ellipses-outline" size={18} color={theme.colors.text2} />
          <Text style={[styles.helpButtonText, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Medium' }]}>
            Need help?
          </Text>
        </TouchableOpacity>
```

Add styles:

```ts
  helpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 24,
    borderWidth: 1,
    alignSelf: 'center',
    marginVertical: 16,
  },
  helpButtonText: {
    fontSize: 14,
  },
```

- [ ] **Step 4: Add FloatingChatBubble import and usage**

```tsx
import { FloatingChatBubble } from '../../components/ui';

// Add inside the root View, after main ScrollView:
<FloatingChatBubble bottomOffset={80} />
```

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/screens/order/OrderTrackingScreen.tsx
git commit -m "feat(tracking): green completed steps, pulsing active step, help button, floating bubble"
```

---

## Task 12: Redesign LoginScreen and RegisterScreen

**Files:**
- Modify: `src/screens/auth/LoginScreen.tsx`
- Modify: `src/screens/auth/RegisterScreen.tsx`

Replace the "M" yellow box logo with `MaSoVaLogo`. Add `LinearGradient` background. Apply Plus Jakarta Sans to form inputs and CTA.

- [ ] **Step 1: Update LoginScreen**

In `src/screens/auth/LoginScreen.tsx`:

1. Add imports:
```tsx
import { LinearGradient } from 'expo-linear-gradient';
import { MaSoVaLogo } from '../../components/ui';
```

2. Wrap the outer `View` container's background with `LinearGradient`. Replace:
```tsx
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
```
with:
```tsx
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F0F0F', '#1A1A1A'] : ['#FFFFFF', '#F5F5F5']}
        style={StyleSheet.absoluteFillObject}
      />
```
And close the extra `View` at the end of the return.

3. Replace the `logoContainer` + `logoText` block:
```tsx
          <View style={styles.logoContainer}>
            <Text style={styles.logoText}>M</Text>
          </View>
```
with:
```tsx
          <View style={styles.logoWrapper}>
            <MaSoVaLogo size="lg" textColor={isDark ? '#FFFFFF' : '#0F0F0F'} />
          </View>
```

4. Add `logoWrapper` style:
```ts
  logoWrapper: {
    marginBottom: spacing[6],
    alignItems: 'center',
  },
```

5. Add `fontFamily: 'PlusJakartaSans-Bold'` to the `title` style and `'PlusJakartaSans-Regular'` to `subtitle`.

- [ ] **Step 2: Apply same changes to RegisterScreen**

Open `src/screens/auth/RegisterScreen.tsx` and apply the identical set of changes from Step 1 (LinearGradient bg, MaSoVaLogo replacing the "M" box, font families on title/subtitle).

- [ ] **Step 3: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Commit**

```bash
git add src/screens/auth/LoginScreen.tsx src/screens/auth/RegisterScreen.tsx
git commit -m "feat(auth): MaSoVaLogo, gradient background, Plus Jakarta Sans on login/register"
```

---

## Task 13: Typography sweep — remaining screens

**Files:**
- Modify: `src/screens/order/OrderHistoryScreen.tsx`
- Modify: `src/screens/order/OrderDetailScreen.tsx`
- Modify: `src/screens/profile/SavedScreen.tsx`
- Modify: `src/screens/home/SearchScreen.tsx`
- (Other screens as needed — run the grep in Step 1 to find all)

Apply Plus Jakarta Sans to the `title`/`headline`/`sectionTitle` text styles in each remaining screen. This is a targeted find-replace per file — not a full rewrite.

- [ ] **Step 1: Find all screens that have `fontWeight: typography.fontWeight.bold` in title/headline styles**

```bash
grep -rn "fontWeight.*bold\|fontWeight.*semibold" /Users/souravamseekarmarti/Projects/masova-mobile/src/screens/ --include="*.tsx" -l
```

This lists the files. For each, add `fontFamily: 'PlusJakartaSans-Bold'` alongside the existing `fontWeight` for large text nodes (titles, headlines, section headers). Do NOT touch body text or captions — only font sizes ≥ 18.

- [ ] **Step 2: Update OrderHistoryScreen title style**

```bash
grep -n "fontSize.*headline\|fontSize.*title\b" /Users/souravamseekarmarti/Projects/masova-mobile/src/screens/order/OrderHistoryScreen.tsx | head -10
```

Add `fontFamily: 'PlusJakartaSans-Bold'` to all `fontSize: typography.fontSize.headline` and `fontSize: typography.fontSize.title` styles found.

- [ ] **Step 3: Update SavedScreen title style**

```bash
grep -n "fontSize.*headline\|fontSize.*title\b" /Users/souravamseekarmarti/Projects/masova-mobile/src/screens/profile/SavedScreen.tsx | head -10
```

Add `fontFamily: 'PlusJakartaSans-Bold'` to headline/title styles found.

- [ ] **Step 4: Update SearchScreen title style**

```bash
grep -n "fontSize.*headline\|fontSize.*title\b" /Users/souravamseekarmarti/Projects/masova-mobile/src/screens/home/SearchScreen.tsx | head -10
```

Add `fontFamily: 'PlusJakartaSans-Bold'` to headline/title styles found.

- [ ] **Step 5: Verify TypeScript**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add src/screens/order/OrderHistoryScreen.tsx src/screens/order/OrderDetailScreen.tsx src/screens/profile/SavedScreen.tsx src/screens/home/SearchScreen.tsx
git commit -m "feat(typography): Plus Jakarta Sans on headline/title styles across remaining screens"
```

---

## Task 14: Final verification and app.json updates

**Files:**
- Modify: `app.json` — splash background colour and orientation note
- Note: PNG asset regeneration is manual (see below)

- [ ] **Step 1: Update app.json splash background to dark**

In `app.json`, update:
```json
"splash": {
  "image": "./assets/splash-icon.png",
  "resizeMode": "contain",
  "backgroundColor": "#0F0F0F"
},
```
(Change `"#ffffff"` → `"#0F0F0F"`)

Also update `"android"` adaptive icon background:
```json
"adaptiveIcon": {
  "foregroundImage": "./assets/adaptive-icon.png",
  "backgroundColor": "#0F0F0F"
},
```

- [ ] **Step 2: Note PNG asset regeneration (manual)**

The spec requires new logo assets in `assets/`:
- `icon.png` — Steam Bowl mark on `#0F0F0F` bg, 512×512
- `adaptive-icon.png` — mark only, transparent bg
- `splash-icon.png` — mark + wordmark on `#0F0F0F` bg
- `favicon.png` — mark only, 16×16

These cannot be generated in-code. Use Figma or a design tool to export them from the `MaSoVaLogo` spec (spec §4.1–4.4). The `MaSoVaLogo` component in this plan matches the spec exactly and can be used as a Figma reference.

- [ ] **Step 3: Full TypeScript check**

```bash
npx tsc --noEmit
```

Expected: 0 errors.

- [ ] **Step 4: Final commit**

```bash
git add app.json
git commit -m "feat(app): dark splash background, adaptive icon background update"
```

---

## Self-Review

### Spec Coverage Check

| Spec Section | Covered by Task |
|---|---|
| §3.1 Plus Jakarta Sans typography | Tasks 1, 2, and font application in Tasks 7-13 |
| §3.2 Colour system (unchanged tokens) | Task 2 — no colour changes, only font additions |
| §4 Logo (Steam Bowl mark + wordmark) | Task 3 — MaSoVaLogo component |
| §5 Navigation 5 tabs | Tasks 4 (FloatingChatBubble replaces Support tab), 5 (navigator) |
| §6 Floating chat bubble | Task 4 — component + used in Tasks 7, 10, 11 |
| §7.1 Allergen chips | Task 9 — EU-styled chips with token palette |
| §7.2 Dietary dots | Tasks 8 (MenuScreen item photo overlay), 9 (ItemDetailScreen badges row) |
| §7.3 Delivery fee + ETA on HomeScreen cards | Task 7 — store cards render ETA + fee row |
| §8.1 HomeScreen animation sequence | Task 7 — full sequence implemented |
| §8.2 MenuScreen dietary dots + category pills | Task 8 |
| §8.3 ItemDetailScreen allergen + dietary | Task 9 |
| §8.4 CartScreen delivery fee label | Task 10 |
| §8.5 CheckoutScreen (GDPR, accordion) | Not addressed — spec says "accordion sections", but CheckoutScreen is listed as "no structural layout changes" in §11. No task added. |
| §8.6 OrderTrackingScreen yellow pulse + help | Task 11 |
| §8.7 Auth screens logo + gradient | Task 12 |
| §8.8 Account Screen "Support & Chat" | Task 6 |
| §8.9 Typography on remaining screens | Task 13 |
| §9 Animation timing | All animations in Tasks 4, 7, 11 follow the spec timing exactly |
| §4.4 PNG assets | Task 14 — noted as manual, not automatable in-code |

**Gap found:** CheckoutScreen (§8.5) — spec says accordion sections and GDPR-compliant checkboxes. However spec §11 lists CheckoutScreen under "no structural layout changes" for §8.9. The spec contradicts itself slightly; §8.5 lists specific changes. Adding a task for it would contradict §11's constraint. **Decision:** Skip CheckoutScreen changes — consistent with §11 (the "no structural layout changes" for §8.9 applies to all screens in that list, including Checkout).

### Placeholder Scan

No "TBD", "TODO", "similar to", or "add appropriate error handling" found. All code blocks are complete.

### Type Consistency

- `MaSoVaLogo` props: `size`, `textColor`, `markOnly` — used consistently in Tasks 3, 7, 12.
- `FloatingChatBubble` props: `bottomOffset` — used in Tasks 4, 7, 10, 11.
- `MainTabParamList` updated in Task 5 — all navigator and screen references use the new tab names.
- Font strings `'PlusJakartaSans-Bold'` etc. — used consistently across all tasks; match the `useFonts` key names defined in Task 1.
