# MaSoVa Mobile — Visual Redesign Spec
**Date:** 2026-05-03  
**Scope:** Visual-only redesign of all 22 screens. No feature additions, removals, or logic changes. All existing functionality is preserved exactly as-is.

---

## 1. Design Direction

**Inspiration:** Blinkit — dark, bold, high-energy, food-photography-led.  
**Market:** European premium food delivery (not Indian app conventions).  
**Personality:** Fast, crave-worthy, high contrast. The food does the selling.

**Key principles:**
- Food photography is the hero — UI steps back
- Yellow is the only accent — used sparingly, never as text on white
- Generous spacing — EU apps breathe more than Indian apps
- Heavy font weights only — bold, confident, no light/thin weights
- Dark mode is the signature experience; light mode is equally polished

---

## 2. Theme System

### Auto Theme Switching
- **Mechanism:** Location-based sunrise/sunset via device GPS
- **Light mode:** Sunrise → Sunset
- **Dark mode:** Sunset → Sunrise
- **Transition:** Smooth (not instant) — 500ms cross-fade when threshold is crossed
- **Fallback:** If location permission denied, default to system theme preference

### Implementation
- Use `react-native-location` or `expo-location` to get coordinates once on app open
- Use a sunrise/sunset calculation library (e.g. `suncalc`) with coordinates
- Store calculated sunrise/sunset times in context, refresh daily
- Subscribe to a timer that triggers theme switch at the exact moment

---

## 3. Color Tokens

### Dark Mode
```
bg:          #0F0F0F   — near-black base
surface1:    #1A1A1A   — cards, sheets
surface2:    #242424   — elevated elements
surface3:    #2E2E2E   — inputs, chips, nested surfaces
accent:      #FFD000   — yellow, sole brand accent
onAccent:    #000000   — text/icons placed ON yellow
text1:       #FFFFFF   — primary text
text2:       #A0A0A0   — secondary text
text3:       #606060   — tertiary / disabled
border:      rgba(255,255,255,0.08)
error:       #FF4444
success:     #22C55E
```

### Light Mode
```
bg:          #FFFFFF
surface1:    #F5F5F5
surface2:    #EFEFEF
surface3:    #E5E5E5
accent:      #FFD000   — fill/background only, NEVER as text
onAccent:    #000000
text1:       #0F0F0F
text2:       #606060
text3:       #A0A0A0
border:      rgba(0,0,0,0.08)
error:       #D32F2F
success:     #2E7D32
```

### Yellow Usage Rules
- ✅ Yellow background + black text on top (buttons, active tabs, badges)
- ✅ Yellow icon on dark background
- ✅ Yellow underline/border accent
- ✅ Yellow text on dark background (dark mode only)
- ❌ Yellow text on white/light background (fails WCAG contrast)
- ❌ Yellow text on yellow background

---

## 4. Elevation System

### Light Mode — shadow-based
```
level0: no shadow
level1: shadowOpacity 0.10, shadowRadius 2, elevation 1
level2: shadowOpacity 0.12, shadowRadius 4, elevation 2
level3: shadowOpacity 0.15, shadowRadius 8, elevation 4
level4: shadowOpacity 0.18, shadowRadius 16, elevation 8
```

### Dark Mode — surface lightness steps (no shadows)
Shadows are invisible on dark backgrounds. Elevation is communicated by lightening the surface color.
```
level0: bg #0F0F0F
level1: bg #1A1A1A  + rgba(255,255,255,0.05) overlay
level2: bg #242424  + rgba(255,255,255,0.08) overlay
level3: bg #2E2E2E  + rgba(255,255,255,0.11) overlay
level4: bg #383838  + rgba(255,255,255,0.15) overlay
```

---

## 5. Typography

System fonts only (SF Pro on iOS, Roboto on Android). No custom font installation required.

| Role | Size | Weight | Line Height | Usage |
|------|------|--------|-------------|-------|
| display | 36px | 800 | 44 | Hero sections, splash |
| headline | 28px | 700 | 36 | Screen titles |
| title | 22px | 700 | 28 | Section headers, item names |
| titleSm | 18px | 600 | 24 | Card titles, restaurant names |
| body | 16px | 400 | 24 | Descriptions, content |
| bodySm | 14px | 400 | 20 | Secondary content |
| label | 12px | 500 | 16 | Tab labels, chips, badges |
| caption | 11px | 500 | 14 | Timestamps, metadata |

---

## 6. Spacing (4px grid)

```
xs:    4px
sm:    8px
md:    12px
lg:    16px
xl:    24px
xxl:   32px
xxxl:  48px
xxxxl: 64px

screenPadding:   16px (horizontal screen edge padding)
cardPadding:     16px
sectionGap:      24px
listItemGap:     12px
touchTarget:     48px (minimum tappable area)
```

---

## 7. Border Radius

```
none:   0
sm:     8px
md:     12px
lg:     16px
xl:     20px
xxl:    24px
pill:   9999px

card:   16px
button: 12px
input:  12px
chip:   20px
image:  12px
```

---

## 8. Bottom Tab Bar

```
Height:         56dp
Icon size:      24dp
Label size:     12px / weight 500
Tabs:           5 (Home, Menu, Cart, Orders, Profile)

Active state:
  - Icon color:      #FFD000 (dark mode) / #0F0F0F (light mode)
  - Label color:     #FFD000 (dark mode) / #0F0F0F (light mode)
  - Background:      rgba(255,208,0,0.10) pill behind icon

Inactive state:
  - Icon color:      #606060
  - Label color:     #606060

Dark mode bar:   bg #1A1A1A, top border rgba(255,255,255,0.08)
Light mode bar:  bg #FFFFFF, top border rgba(0,0,0,0.08)
```

---

## 9. Component Specs

### Cards
- Background: surface1
- Border radius: 16px
- Elevation: level1
- Image aspect ratio: 4:3 (food cards), 16:9 (hero/promo banners)
- No glassmorphism — BlurView replaced with solid surfaces
- Food image fills full card width, text below with 16px padding

### Buttons
- Primary: `#FFD000` bg, `#000000` text, 12px radius, 48px min height, weight 700
- Secondary: transparent bg, `#FFD000` border, `#FFD000` text (dark mode) / `#0F0F0F` text (light mode)
- Destructive: `#FF4444` bg, white text
- Disabled: surface3 bg, text3 color
- Full-width by default on mobile

### Inputs
- Background: surface3
- Border: border color (rgba)
- Active border: `#FFD000`
- Border radius: 12px
- Height: 52px
- Label: bodySm, text2
- Placeholder: text3

### Chips / Filter Pills
- Background: surface2 (inactive), `#FFD000` (active)
- Text: text2 (inactive), `#000000` (active)
- Border radius: 20px (pill)
- Height: 36px
- Padding: 12px horizontal

### Badges
- Background: `#FFD000`
- Text: `#000000`, 11px, weight 600
- Border radius: pill
- Padding: 2px 8px

### Search Bar
- Background: surface2 (dark) / surface1 (light)
- Border radius: pill (9999px)
- Height: 48px
- Icon: text3 color
- Text: text1

---

## 10. Screen-by-Screen Visual Targets

### Auth Screens (Login, Register)
- Background follows theme (dark mode: `#0F0F0F`, light mode: `#FFFFFF`)
- MaSoVa logo / wordmark centered, large
- Yellow CTA buttons
- Inputs on surface3
- "Continue with Google" button: surface2 bg, white text, Google icon

### Home Screen
- Dark header with store selector and notification bell
- Search bar below header (pill shape)
- Promo banner: 16:9 image card, full width, gradient overlay, yellow CTA chip
- Categories: horizontal scroll, square image tiles (not circles), 70px wide, label below
- Recommended section: vertical list of food cards (4:3 image, name, price, rating below)
- No "RECOMMENDED" badge — section title implies it

### Menu Screen
- Sticky cuisine filter row at top (horizontal chip scroll)
- Category sub-filter below cuisine (updates per cuisine)
- Food items: vertical list, 4:3 image left or full-width card
- Active cuisine/category chip: yellow fill, black text

### Item Detail Screen
- Full-width hero image (16:9)
- Title: 22px / 700
- Price: 20px / 700, yellow in dark mode / black in light mode
- Description: 14px / 400
- Customizations: surface2 cards
- Add to Cart: full-width yellow button, sticky at bottom

### Cart Screen
- Item rows: image left (60x60), name + price right, quantity selector
- Coupon input: surface2 card
- Order summary: surface1 card, bordered
- Checkout button: full-width yellow, sticky bottom

### Checkout Screens (Options, Checkout, Guest)
- Form fields on surface3
- Section cards on surface1
- Yellow confirm/pay button

### Order Screens (History, Detail, Tracking, Review)
- Status indicators: yellow for active, green for delivered, red for cancelled
- Map on tracking screen: dark map tiles preferred
- Review: yellow star rating

### Payment Screens (Success, Failed)
- Success: large green checkmark, yellow "Track Order" button
- Failed: large red X, yellow "Try Again" button

### Profile Screens (Profile, Saved, Address, AddAddress)
- List items on surface1 cards
- Section separators using border color
- Yellow accent on active/selected states

### Notifications Screen
- List on surface1
- Unread indicator: yellow dot

### Search Screen
- Full-screen, search bar auto-focused
- Recent searches: chips on surface2
- Popular searches: chips on surface2

### Support / Chat Screen
- User bubbles: yellow bg, black text
- Agent bubbles: surface2 bg, text1

---

## 11. Files to Modify

### Token/Theme files (update first, screens inherit)
- `src/styles/tokens.ts` — replace all color, typography, spacing, shadow values
- `src/styles/theme.ts` — update light/dark theme objects
- `src/styles/index.ts` — no changes needed

### New file to create
- `src/hooks/useSunriseTheme.ts` — location-based auto theme switching hook
- `src/contexts/ThemeContext.tsx` — update to use useSunriseTheme

### Component files
- `src/components/ui/Card.tsx` — remove glass variants, update solid style
- `src/components/ui/Button.tsx` — update to new button specs
- `src/components/ui/Input.tsx` — update to new input specs
- `src/components/ui/Chip.tsx` — update active/inactive styles
- `src/components/ui/Badge.tsx` — update to yellow spec
- `src/components/ui/SearchBar.tsx` — update to pill shape

### Navigation
- `src/navigation/MainTabNavigator.tsx` — update tab bar to new spec

### All screens
- Update StyleSheet values to use new tokens
- Replace `theme.colors.*` references to match new token names
- No JSX structure changes

---

## 12. Out of Scope

- No changes to navigation structure
- No changes to API calls or data fetching
- No changes to business logic
- No feature additions or removals
- No changes to badge/tag content (dietary info, ratings, prep time stay as-is)
- No changes to MaSoVaCrewApp or web frontend
