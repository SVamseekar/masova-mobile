# MaSoVa Mobile Customer App

React Native + Expo mobile application for the MaSoVa Restaurant Management System.

## Design System

Uses **Glassmorphism + Material You Hybrid** design:
- Frosted glass surfaces with blur effects
- MaSoVa brand red (#E53E3E) gradients
- Light/Dark theme support
- Haptic feedback on interactions

## Getting Started

### Prerequisites

- Node.js 18+
- Expo CLI (`npm install -g expo-cli`)
- iOS Simulator (Mac) or Android Emulator

### Installation

```bash
npm install
```

### Running the App

```bash
# Start development server
npx expo start

# Run on iOS Simulator
npx expo start --ios

# Run on Android Emulator
npx expo start --android
```

## Project Structure

```
src/
├── components/ui/       # Reusable UI components
├── hooks/              # React hooks (useTheme)
├── navigation/         # React Navigation setup
├── screens/            # App screens
│   ├── auth/          # Login, Register
│   ├── home/          # Home, Search, Notifications
│   ├── menu/          # Menu browsing, Item detail
│   ├── cart/          # Cart, Checkout
│   ├── order/         # Tracking, History
│   └── profile/       # Profile, Addresses
├── services/          # API layer
├── styles/            # Design tokens & theme
└── types/             # TypeScript definitions
```

## Backend Configuration

Update `src/services/api.ts` BASE_URL for your backend:

```typescript
const BASE_URL = 'http://your-backend:8080/api';
```

## Features

- Browse menu with filters
- Item customization (variants, toppings)
- Cart management with coupon support
- Order placement & tracking
- User profile & saved addresses
- Push notification ready

## Tech Stack

- React Native + Expo
- TypeScript
- React Navigation
- React Query
- Axios
- Expo Blur, Haptics, Linear Gradient
