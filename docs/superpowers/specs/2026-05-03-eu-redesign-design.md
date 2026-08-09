# MaSoVa Mobile — EU Market Redesign Spec
**Date:** 2026-05-03  
**Scope:** masova-mobile (React Native 0.81, bare, Metro :8888)  
**Constraint:** Zero backend changes — purely frontend/visual  

---

## 1. Goals

- Redesign the customer-facing mobile app for the EU market
- UX inspired by Swiggy, Zomato, Blinkit (Indian leaders) + Deliveroo, Uber Eats, Just Eat (EU leaders)
- Elevate food photography, introduce motion/animation on the home screen
- Surface EU trust signals (allergens, dietary info, delivery fee/ETA) earlier in the flow
- Add a new logo in the same design philosophy
- No new dependencies, no removed files, no backend changes

---

## 2. Target User

Blend of:
- **Urban professional** — London, Paris, Berlin, Amsterdam. Time-poor, values speed, clean UI, transparency
- **Student / young adult** — budget-conscious, discount-first
- **Family household** — dietary filters, scheduled delivery, loyalty

---

## 3. Design System

### 3.1 Typography

**Add:** Plus Jakarta Sans (Google Font)
- Weights: 400 (Regular), 500 (Medium), 600 (SemiBold), 700 (Bold), 800 (ExtraBold)
- Replaces system font (SF Pro / Roboto) across all 22 screens
- Chosen for: geometric precision, excellent Latin diacritic support (EU languages — é, ü, ø, ñ), premium feel
- Fallback: existing system font while font loads

### 3.2 Colour System

All existing tokens retained. Yellow stays as the primary accent — bold EU differentiator.

```
#FFD000              Accent yellow — CTAs, active states, price highlights, key badges ONLY
#0F0F0F              Dark background (primary canvas)
#1A1A1A              Surface 1 — cards, bottom sheets
#242424              Surface 2 — input backgrounds, section backgrounds
#FFFFFF / #0F0F0F    Text 1 (dark/light mode)
#A0A0A0              Text 2 — secondary text
#606060              Text 3 — inactive states
rgba(255,208,0,0.08) Yellow tint — active/hover backgrounds (already in token as activeBackground)
#22C55E              Success / completed order steps
#FF4444              Error states
```

**Philosophy:** Yellow as a scalpel, not a paintbrush. Dark surface does the heavy lifting. Food photography is the hero.

### 3.3 Spacing & Radius

No changes — existing 4px grid token system is correct.

### 3.4 Dark/Light Mode

Both modes retained with auto sunrise/sunset switching (`useSunriseTheme` hook — unchanged).  
Dark-first feel: dark mode is the default premium experience.

---

## 4. Logo

### 4.1 The Mark — "Steam Bowl"

Three stacked arcs representing steam rising from a bowl. Abstract, food-native, works at all sizes.

```
Arc 1 (top):    #FFD000 — 100% opacity, 24px wide, 2px stroke
Arc 2 (middle): #FFD000 — 60% opacity,  18px wide, 2px stroke
Arc 3 (bottom): #FFD000 — 30% opacity,  12px wide, 2px stroke

Arc spacing: 3px between each
Total mark height: ~20px at 1x, scales proportionally
Arcs are open-bottom semicircles, centred on a vertical axis
```

### 4.2 The Wordmark

```
Font:           Plus Jakarta Sans ExtraBold (800)
"Ma"          — #FFFFFF (dark mode) / #0F0F0F (light mode)
"So"          — #FFD000
"Va"          — #FFFFFF (dark mode) / #0F0F0F (light mode)
Letter spacing: -0.5px (tight, premium)
Mark + wordmark spacing: 8px
```

### 4.3 Usage Sizes

| Context          | Treatment              | Size          |
|------------------|------------------------|---------------|
| App icon         | Mark only, #0F0F0F bg  | 512px canvas  |
| Splash screen    | Mark + wordmark        | Centred       |
| Home header      | Mark + wordmark        | 32px tall     |
| Adaptive icon    | Mark only              | Android spec  |
| Favicon          | Mark only              | 16px          |

### 4.4 Assets to Create

- `Assets/icon.png` — replace with new mark on dark bg (512×512)
- `Assets/adaptive-icon.png` — mark only, transparent bg (Android)
- `Assets/splash-icon.png` — mark + wordmark on dark bg
- `Assets/favicon.png` — mark only (16×16)

---

## 5. Navigation Restructure

**Current:** 6 tabs (Home, Menu, Cart, Saved, Profile, Support)  
**New:** 5 tabs (Home, Search, Orders, Saved, Account)

### Rationale
- NNGroup: 5 tabs is the maximum before touch targets degrade and cognitive load rises
- Every major EU/Indian delivery app (Deliveroo, Uber Eats, Zomato, Swiggy) uses 4-5 tabs
- Support/Chat is never a primary tab in any competitor — it lives in Account or contextually
- Menu is accessed via Home → tap a store, not as a top-level tab destination

### New Tab Bar

```
Tab 1: Home     (house icon)      — discovery, hero, store listing
Tab 2: Search   (search icon)     — search + dietary/cuisine filters
Tab 3: Orders   (receipt icon)    — active order tracking + order history
Tab 4: Saved    (heart icon)      — saved/favourite stores
Tab 5: Account  (person icon)     — profile, addresses, payments, support
```

### Screens Affected

| Screen | Change |
|--------|--------|
| `MainTabNavigator.tsx` | Remove Menu + Support tabs, add Search tab wired to SearchScreen |
| `MenuScreen.tsx` | No change — accessed via Home → store tap |
| `ChatScreen.tsx` | No change — accessed via Account → Support & Chat + floating bubble |
| `ProfileScreen.tsx` | Add "Support & Chat" list item navigating to ChatScreen |
| All other screens | No navigation changes |

### Active Tab Styling

```
Active icon + label:  #FFD000
Active background:    rgba(255,208,0,0.10) pill behind icon (already in tokens)
Inactive:             #606060
Tab bar height:       56px + safe area bottom (unchanged)
Dark bg:              #1A1A1A (unchanged)
Light bg:             #FFFFFF (unchanged)
```

---

## 6. Floating Chat Bubble

Persistent entry point to `ChatScreen` replacing the Support tab.

**Presence:** HomeScreen, MenuScreen, CartScreen, OrderTrackingScreen  
**Position:** Bottom-right, 24px from edge, above tab bar  
**Size:** 56px circle  
**Colour:** `#FFD000` background, dark chat icon  
**Animation:** Springs in (scale 0→1.1→1.0) after 1000ms on screen mount  
**Hides when:** Keyboard is open  
**On tap:** Navigate to `ChatScreen` (existing screen, no changes)

---

## 7. EU Trust Signals

All data already available from existing APIs — visual prominence only.

### 7.1 Allergen Information
- **Where:** `ItemDetailScreen` (prominent chips row) + `MenuScreen` item cards (icon strip)
- **Treatment:** Pill badges, outlined, `#A0A0A0` border, `label` size text, horizontally scrollable row
- **Data source:** `src/constants/allergens.ts` (already exists)

### 7.2 Dietary Badges
- **Where:** Every menu item card (top-left corner of food photo) + `ItemDetailScreen`
- **Treatment:** Coloured dot system — Veg: `#22C55E` · Non-veg: `#FF4444` · Vegan: `#7B1FA2`
- **Data source:** Menu API response (already fetched)

### 7.3 Delivery Fee + ETA
- **Where:** HomeScreen store cards (not hidden until checkout)
- **Treatment:** Small row below store name — clock icon + ETA · scooter icon + fee from Redux `cartSlice`
- **Data source:** `selectDeliveryFeeINR` Redux selector (already wired)

---

## 8. Screen-by-Screen Design

### 8.1 HomeScreen

**On open — animation sequence:**
```
0ms    Hero carousel fades in          (opacity 0→1, 300ms ease-out)
100ms  Greeting text fades in          (opacity 0→1, 200ms)
200ms  Category icon 1 bounces in      (scale 0.8→1.05→1.0, 250ms spring)
260ms  Category icon 2
320ms  Category icon 3
380ms  Category icon 4 ... (60ms stagger per icon)
400ms  Store card 1 slides up          (translateY 40→0 + opacity 0→1, 300ms ease-out)
480ms  Store card 2
560ms  Store card 3 ... (80ms stagger per card)
1000ms Floating chat bubble springs in (scale 0→1.1→1.0, 400ms spring)
```

**Layout:**
```
┌──────────────────────────────┐
│  [Mark] MaSoVa    🔔   👤   │  header: logo left, notification + profile right
├──────────────────────────────┤
│                              │
│   [CYCLING FOOD PHOTO]       │  hero carousel — LinearGradient dark overlay
│   "Fresh Indian, delivered"  │  bottom-left text over gradient
│        ● ○ ○ ○              │  animated dot indicators
│                              │
├──────────────────────────────┤
│  📍 Delivering to: [addr]   │  tappable → AddressManagementScreen
├──────────────────────────────┤
│  🍛  🍕  🥗  🍜  🥘  →    │  staggered category icons, horizontal scroll
├──────────────────────────────┤
│  Popular Near You            │
│  ┌──────┐  ┌──────┐          │  store cards: name, ETA, fee, veg dot,
│  │photo │  │photo │          │  rating, "Trending" pulse badge in #FFD000
│  └──────┘  └──────┘          │
│                    [💬]      │  floating chat bubble, bottom-right
└──────────────────────────────┘
```

### 8.2 MenuScreen

- Sticky category pill bar at top (horizontal scroll)
- Active pill: `#FFD000` background, dark text
- Inactive pills: `surface2` background, `text2` text
- Each item card: food photo left · name/description right · veg/non-veg dot top-left on photo · price in `#FFD000` bottom-right
- Scroll-triggered card reveal: fade + 20px upward slide as cards enter viewport
- `QuantitySelector`: springy scale 1.0→1.15→1.0 on tap + haptic medium

### 8.3 ItemDetailScreen

- Large hero food photo, full-width, with `LinearGradient` bottom overlay
- Allergen chips row — horizontally scrollable pill badges
- Dietary badges row — coloured dot + label for each dietary property
- Description, portion size, calories (if in API response)
- Full-width `#FFD000` "Add to Cart" CTA with haptic feedback

### 8.4 CartScreen

- Item rows: thumbnail photo left, name/quantity/price right
- Delivery fee line item: explicitly labelled with zone info
- Order summary card: `surface2` background, subtle border
- Full-width `#FFD000` "Proceed to Checkout" CTA

### 8.5 CheckoutScreen

- Accordion sections: Address → Delivery time → Payment → Review → Confirm
- Each section is a collapsible card (tap to expand/collapse)
- GDPR: no pre-ticked marketing consent checkboxes
- Payment method icons displayed as a horizontal row

### 8.6 OrderTrackingScreen

- `react-native-maps` full-screen behind `expo-blur` bottom sheet
- Status timeline: vertical steps, active step `#FFD000`, completed `#22C55E`
- Real-time ETA countdown (WebSocket via `@stomp/stompjs` — already wired)
- Pulsing yellow dot for driver location on map
- "Need help?" button → navigates to `ChatScreen`

### 8.7 Auth Screens (Login + Register)

- MaSoVa mark + wordmark centred, prominent
- `LinearGradient` background: `#0F0F0F` → `#1A1A1A` (dark mode)
- Input fields: `surface2` bg, `#FFD000` focused border ring
- CTA: full-width `#FFD000` button, dark text, Plus Jakarta Sans Bold
- "Continue as Guest" secondary text link below CTA

### 8.8 Account Screen (replaces ProfileScreen tab)

```
┌──────────────────────────────┐
│  [Avatar]  Name              │
│            Email             │
│            [Edit Profile]    │
├──────────────────────────────┤
│  📦  Order History           │
│  📍  Saved Addresses         │
│  💳  Payment Methods         │
│  🔔  Notifications           │
│  💬  Support & Chat          │  ← navigates to ChatScreen
│  ⚙️   Settings               │
│  🚪  Sign Out                │
└──────────────────────────────┘
```

### 8.9 All Other Screens

`OrderHistoryScreen`, `OrderDetailScreen`, `OrderReviewScreen`, `PaymentSuccessScreen`, `PaymentFailedScreen`, `SavedScreen`, `AddressManagementScreen`, `AddAddressScreen`, `NotificationsScreen`, `SearchScreen`, `GuestCheckoutScreen`, `CheckoutOptionsScreen` — apply updated typography (Plus Jakarta Sans), colour tokens (unchanged, already migrated), and EU trust signal patterns where relevant. No structural layout changes.

---

## 9. Animation Timing Spec

### 9.1 Hero Carousel

```
Display duration per slide: 4000ms
Transition type:            crossfade (opacity outgoing 1→0, incoming 0→1 simultaneously)
Transition duration:        400ms
Dot indicator active width: animates 8px → 24px (300ms ease-in-out)
```

### 9.2 Micro-interactions

```
Card tap press:     scale 1.0 → 0.97 (80ms) → 1.0 (120ms) + haptic light
Add to cart:        QuantitySelector scale 1.0 → 1.15 → 1.0 (200ms spring) + haptic medium
Tab icon tap:       scale 1.0 → 1.2 → 1.0 (150ms) + label fade in
Pulse badge:        opacity 1.0 → 0.5 → 1.0 (1500ms, repeat infinite)
Skeleton reveal:    opacity 0 → 1 (400ms ease-in, triggered on data load)
Floating bubble:    scale 0 → 1.1 → 1.0 (400ms spring, 1000ms delay on mount)
```

### 9.3 Spring Config

```javascript
// Bouncy elements: category icons, floating bubble, tab icons
{ tension: 300, friction: 20 }

// Responsive elements: quantity selector, card press
{ tension: 200, friction: 15 }
```

### 9.4 Page Transitions

No changes to existing config:
- Modal screens (ItemDetail, Checkout, OrderReview, AddAddress): `slide_from_bottom`
- Stack screens: native platform default
- Search: `fade`

---

## 10. Files to Change

| File | Change Type |
|------|-------------|
| `src/navigation/MainTabNavigator.tsx` | Remove Menu + Support tabs, add Search tab, update styling |
| `src/screens/profile/ProfileScreen.tsx` | Add Support & Chat list item |
| `src/screens/home/HomeScreen.tsx` | Hero carousel, stagger animations, floating bubble, trust signals on cards |
| `src/screens/menu/MenuScreen.tsx` | Sticky category pills, dietary dots, scroll-triggered reveal |
| `src/screens/menu/ItemDetailScreen.tsx` | Allergen chips row, dietary badges, hero photo treatment |
| `src/screens/cart/CartScreen.tsx` | Explicit delivery fee label, photo thumbnails |
| `src/screens/order/OrderTrackingScreen.tsx` | Yellow pulse dot, yellow active step, help button |
| `src/screens/auth/LoginScreen.tsx` | Logo prominent, gradient bg, yellow focused inputs |
| `src/screens/auth/RegisterScreen.tsx` | Same as LoginScreen |
| `src/styles/tokens.ts` | Add Plus Jakarta Sans font family token |
| `Assets/icon.png` | New logo mark (512×512) |
| `Assets/adaptive-icon.png` | New logo mark (Android) |
| `Assets/splash-icon.png` | New logo mark + wordmark |
| `Assets/favicon.png` | New logo mark (16×16) |
| All other screen files | Typography token update only |

## 11. Files NOT Changing

- All service files (`api.ts`, `paymentService.ts`, `websocketService.ts`)
- All context files (`AuthContext`, `CartContext`, `StoreContext`)
- All hook files except `useTheme` (font token update only)
- All type definitions
- All backend services (core, commerce, logistics, payment, intel, api-gateway)
- No new npm packages (all animation via RN `Animated` API, already available)
- No removed screen or component files

---

## 12. Reference Apps

| App | What We Borrow |
|-----|----------------|
| Swiggy | Staggered category entrance, hero carousel, live pulse badges |
| Zomato | Scroll-triggered card reveals, editorial section headers |
| Blinkit | Springy quantity selector, skeleton → content reveal |
| Deliveroo | Dark premium canvas, food-as-hero photography treatment |
| Uber Eats | Clean crossfade carousel, minimal tab bar |
| Just Eat | Trust signal prominence, delivery fee upfront |
