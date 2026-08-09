# Architecture & System Map — MaSoVa Mobile Customer App

## Overview

`masova-mobile` is the React Native bare mobile client for customer food ordering, menu browsing, order tracking, profile management, and reviews.

```
┌─────────────────────────────────────────────────────────────┐
│  masova-mobile (Mac, physical Android preferred)            │
│  Metro :8888 · secure Keychain tokens · React Query         │
└───────────────────────────┬─────────────────────────────────┘
                            │ HTTPS/HTTP + JWT
                            │ Headers: Authorization, X-User-Id,
                            │   X-User-Type, X-Selected-Store-Id
                            ▼
┌─────────────────────────────────────────────────────────────┐
│  API Gateway :8080  (Dell 192.168.50.88 in dev)             │
│  Rate limits · JWT filter · route deny                      │
└───┬──────────┬──────────┬──────────┬──────────┬─────────────┘
    │          │          │          │          │
 core:8085  commerce:8084  payment:8089  logistics:8086  intel:8087
```

## Folder Structure

- `src/config/`: Environment configuration (`API_BASE_URL`, `WS_BASE_URL`, feature flags).
- `src/services/http/`: Axios client foundation with auth refresh mutex and header injection.
- `src/services/api/`: Domain API modules (`authApi`, `menuApi`, `orderApi`, `customerApi`, `paymentApi`, `deliveryApi`, `storeApi`, `notificationApi`, `reviewApi`).
- `src/services/secureTokenStorage.ts`: Keychain token storage (access and refresh tokens).
- `src/services/websocketService.ts`: WebSocket / STOMP client routing through API gateway.
- `src/types/`: TypeScript DTO definitions matching platform services.
- `src/hooks/`: React Query custom hooks for data fetching and mutations.
- `src/screens/`: Presentation screens (Auth, Home, Menu, Cart, Order, Profile, Support).
- `src/components/`: Reusable UI components.
- `src/navigation/`: React Navigation stack and tab navigation.
- `src/utils/`: Money formatting, date helpers, error handling.

## Security Baseline

1. Access & Refresh Tokens are stored ONLY in secure storage (`react-native-keychain`).
2. Authentication headers sent on all requests: `Authorization`, `X-User-Id`, `X-User-Type=CUSTOMER`, `X-Selected-Store-Id`.
3. Forbidden endpoints (e.g. `POST /api/customers/get-or-create`) are NEVER called.
