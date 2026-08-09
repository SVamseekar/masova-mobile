# MaSoVa Mobile Customer App

Production-grade customer mobile application for the MaSoVa Restaurant Management System built with **React Native (Bare Workflow - NOT Expo Go)**.

## Architecture & Tech Stack

- **Framework:** React Native `0.81.5` bare workflow
- **Metro Port:** `8888` (defaulted in all package scripts)
- **State & Data Fetching:** `@tanstack/react-query` v5, Axios
- **Navigation:** `@react-navigation/native` v7
- **Security:** `react-native-keychain` for access & refresh tokens
- **Design System:** Glassmorphism (`expo-blur`, `expo-linear-gradient`, `expo-haptics`)

## Testing Device Standard

- **Physical Device:** Samsung Galaxy Z Flip 5 over USB (**Primary standard — not emulator**)
- **Connect Device:** Enable USB Debugging on phone, plug via USB, confirm `adb devices`
- **Reverse Port:** `adb reverse tcp:8888 tcp:8888` (allows physical device to reach Metro on `:8888`)

## Quick Start

### 1. Installation

```bash
npm install
```

### 2. Environment Setup

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Default backend development gateway: `http://192.168.50.88:8080/api` (Dell host).

### 3. Development Commands

```bash
# Start Metro bundler on port 8888
npm start

# Run on physical Android device (over USB)
npm run android

# Run on iOS device / simulator
npm run ios

# TypeScript check
npm run typecheck

# ESLint check
npm run lint

# Run Unit & Contract Tests
npm test

# Clean Android build artifacts
npm run clean

# Build Android Release APK
npm run build:android
```

## Documentation Set

- [Architecture & System Map](file:///Users/souravamseekarmarti/Projects/masova-mobile/docs/ARCHITECTURE.md)
- [API Contract Reference](file:///Users/souravamseekarmarti/Projects/masova-mobile/docs/API_CONTRACT.md)
- [Environments & Setup](file:///Users/souravamseekarmarti/Projects/masova-mobile/docs/ENVIRONMENTS.md)
- [Testing & Quality Gates](file:///Users/souravamseekarmarti/Projects/masova-mobile/docs/TESTING.md)
- [Security Baseline](file:///Users/souravamseekarmarti/Projects/masova-mobile/docs/SECURITY.md)
- [Support Runbook](file:///Users/souravamseekarmarti/Projects/masova-mobile/docs/RUNBOOK.md)
- [Release Guide](file:///Users/souravamseekarmarti/Projects/masova-mobile/docs/RELEASE.md)
- [Contributing Guidelines](file:///Users/souravamseekarmarti/Projects/masova-mobile/CONTRIBUTING.md)
