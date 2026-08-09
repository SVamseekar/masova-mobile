# Testing Strategy & Execution

## Overview

The `masova-mobile` application uses a multi-layered testing pyramid:

1. **Unit & Utility Tests (Jest):** Services (`src/services/`), HTTP client interceptors, secure token storage, pure utilities (`src/utils/money.ts`).
2. **Contract Tests (Jest):** Request payload mapping, response data structure normalization, header injection against backend API contracts.
3. **Component Tests (React Native / Jest):** Auth login error states, menu empty/error states, checkout offline/disabled states, and offline banner visibility.
4. **E2E Smoke Tests (Maestro / Node):** Mobile Android smoke flow (`.maestro/smoke.yaml`) and live Dell Gateway smoke script (`scripts/dell-smoke-test.js`).

---

## 1. Unit & Component Test Suite

### Execution Commands

```bash
# Run all unit, contract, and component tests
npm test

# Run tests with coverage output
npm test -- --coverage

# Run tests in CI mode (max 2 workers)
npm run test:ci

# Run TypeScript type check & ESLint
npm run typecheck && npm run lint
```

### Coverage Achievements

- **`src/services/api/`**: **100%** Line Coverage (`authApi`, `customerApi`, `orderApi`, `paymentApi`, `storeApi`, `menuApi`, `notificationApi`, `reviewApi`, `deliveryApi`).
- **`src/utils/`**: **100%** Line Coverage (`money.ts`).
- **`src/services/secureTokenStorage.ts`**: **100%** Line Coverage.
- **Total Tests**: **120 Passing Tests** across **19 Test Suites**.

---

## 2. E2E Mobile Smoke Test Path (Maestro)

Maestro is configured for Android E2E smoke test automation (Launch App -> Login / Guest -> Menu Load).

### Flow Definition: `.maestro/smoke.yaml`

```yaml
appId: com.masovamobile
---
- launchApp:
    clearState: true

- runFlow:
    when:
      visible: "Email Address"
    commands:
      - tapOn: "Email Address"
      - inputText: "customer@masova.com"
      - tapOn: "Password"
      - inputText: "Password123!"
      - tapOn: "Sign In"

- assertVisible:
    text: ".*"
    id: "StoreSelector"
- assertVisible: "Categories"
```

### Execution Instructions

```bash
# Install Maestro CLI (if not already installed)
curl -FsSL "https://get.maestro.mobile.dev" | bash

# Launch Android Emulator (or connected device)
# Start Metro bundler in another tab:
npm start

# Run Maestro smoke test
maestro test .maestro/smoke.yaml
```

---

## 3. Staging / Dell Gateway API Smoke Test Script

The smoke test script validates core gateway routes against the live Dell staging server (`http://192.168.50.88:8080/api`).

### Execution via NPM Script

```bash
# Run Staging Smoke Test against default gateway (192.168.50.88:8080)
npm run smoke:dell

# Run against custom API base URL
node scripts/dell-smoke-test.js http://192.168.50.88:8080/api
```

### Direct `curl` Verification Commands

```bash
# 1. Store Service Health & Store List
curl -s http://192.168.50.88:8080/api/stores

# 2. Store Details & Operating Config
curl -s http://192.168.50.88:8080/api/stores/DOM001

# 3. Menu Service Items Endpoint
curl -s http://192.168.50.88:8080/api/menu

# 4. Auth Service Gateway Route Verification
curl -s -X POST http://192.168.50.88:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"customer@masova.com","password":"Password123!"}'
```

---

## 4. CI/CD Quality Gates

GitHub Actions workflow (`.github/workflows/ci.yml`):

1. **Pull Requests & Pushes**: Must pass `npm run typecheck`, `npm run lint`, and `npm run test:ci` without soft failures (`|| true` is strictly prohibited).
2. **Nightly & Manual Job**: Scheduled at 2 AM UTC (`cron: '0 2 * * *'`) or triggered via `workflow_dispatch` to run `npm run smoke:dell` against the staging gateway.
