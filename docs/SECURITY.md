# Security Policy & Baseline — MaSoVa Mobile

**Last reviewed:** 2026-08-10 (Phase F)

## 1. Token Storage

| Rule | Status |
|------|--------|
| Access + refresh tokens **only** in iOS Keychain / Android Keystore via `react-native-keychain` (`src/services/secureTokenStorage.ts`) | **PASS** |
| `AsyncStorage` may hold non-sensitive prefs only (theme, selected store, cart lines, chat session id, `activeOrderId`) | **PASS** |
| Legacy AsyncStorage token keys are migrated once then deleted (`migrateLegacyTokens`) | **PASS** |
| Accessibility: `WHEN_UNLOCKED_THIS_DEVICE_ONLY` (no iCloud keychain sync of tokens) | **PASS** |

**Never store:** JWTs, refresh tokens, payment PANs, CVV, gateway secrets, or API keys in AsyncStorage, logs, analytics properties, or Sentry extras.

## 2. Request Identity Headers

All authenticated API calls (see `src/services/http/client.ts`) must include:

| Header | Source |
|--------|--------|
| `Authorization: Bearer <accessToken>` | Keychain |
| `X-User-Id` | logged-in user id |
| `X-User-Type` | `CUSTOMER` |
| `X-Selected-Store-Id` | selected `storeCode` or store id |

Refresh uses a mutex so concurrent 401s do not stampede `/auth/refresh`.

## 3. Gateway Route Constraints

Do **not** call gateway-denied or legacy paths. Verified absent from `src/`:

| Forbidden / legacy | Status |
|--------------------|--------|
| `POST /customers/get-or-create` | **Not called** |
| `/menu/public`, `/customers/user/`, `/orders/customer/`, `/notifications/user/` | **Not called** |
| `/generate-otp`, `/verify-otp` legacy delivery paths | **Not called** |
| Direct service ports (8083–8090) for HTTP/WS | **Not used** — WS via gateway `/api/ws` |

Canonical contract: `docs/API_CONTRACT.md` + platform `GatewayConfig.java`.

## 4. Secrets & Repository Hygiene

| Rule | Status |
|------|--------|
| No production secrets in git | **PASS** (`.env` gitignored; `.env.example` placeholders only) |
| Sentry DSN via env / build secrets (`CONFIG.SENTRY_DSN`) | **PASS** |
| Release keystore & passwords not committed | **PASS** (local `gradle.properties` / CI secrets) |
| `ENABLE_MOCK_FALLBACK` forced false outside `__DEV__` | **PASS** |

## 5. Certificate Pinning (Plan + Deferred Enforce)

**Implementation status:** Config + documentation only (`src/config/certificatePinning.ts`). Mode is `disabled`; pin arrays are empty until ops publishes SPKI hashes.

### Why deferred
1. Dev/Dell uses **HTTP** (`http://192.168.50.88:8080/api`) — TLS pinning does not apply.
2. Production hostname and cert chain must be stable (leaf + backup intermediate).
3. Enforcing a wrong pin **bricks** the app until a store update; need report-only soak + remote kill-switch.

### Rollout checklist (when prod HTTPS is live)
1. Export current leaf SPKI SHA-256 and one backup (intermediate or next cert).
2. Populate `CERTIFICATE_PINNING.pins` with ≥ 2 `sha256/<base64>` entries.
3. Set `mode: 'report-only'` and ship a release; monitor Sentry for pin mismatch reports.
4. After ≥ 1 week clean soak, set `mode: 'enforce'` behind a feature flag / remote config.
5. Document pin rotation procedure in platform runbooks (rotate backup pin **before** leaf expires).
6. Prefer a maintained RN pinning library (e.g. TrustKit / okhttp CertificatePinner on Android, TrustKit on iOS) wired at the HTTP client layer — **do not invent custom TLS validation**.

### Out of scope for this phase
- Full native pin module implementation  
- Pinning non-API hosts (CDN images, Sentry, maps)  

## 6. Screenshot / Screen Capture Security

| Surface | Behavior |
|---------|----------|
| `PaymentSuccessScreen`, `PaymentFailedScreen` | Call `useSecureScreen()` (`src/services/screenSecurity.ts`) to block screenshots / recents previews when `expo-screen-capture` is linked |
| Other screens | Capture allowed |

**Native module:** Optional `expo-screen-capture`. Without it the hook no-ops safely (tests / partial installs). Install and rebuild for production:

```bash
npx expo install expo-screen-capture
# then rebuild native Android/iOS binaries
```

## 7. Payment & PII

- Never log full card numbers, UPI secrets, or OTPs.
- Order ids on payment screens are covered by capture protection when the native module is present.
- Payment gateway traffic only through platform payment APIs (`paymentApi` / `PaymentService`) — no client-side secret keys.

## 8. Feature Flags (Security-Relevant)

| Flag | Effect when **false** |
|------|------------------------|
| `ENABLE_PAYMENT_GATEWAY` | Hides online/UPI; forces cash path (orders still create) |
| `ENABLE_STRICT_STORE_GUARD` | Skips confirm dialog; cart still cleared on store change |
| `ENABLE_DELIVERY_TRACKING_WS` | REST polling only for order tracking |
| `ENABLE_REVIEWS` / `ENABLE_LOYALTY` / `ENABLE_PREFERENCES_EDIT` | Hides entry points / disabled UI |

Flags live in `src/config/featureFlags.ts` (local defaults + runtime overrides).

## 9. Security Review Checklist (Phase F)

- [x] Tokens Keychain/Keystore only; AsyncStorage audit clean for JWTs  
- [x] No secrets in git; env placeholders only  
- [x] Gateway-denied routes never called (ripgrep audit)  
- [x] Identity headers on authenticated client  
- [x] Certificate pinning **plan** documented; enforce deferred with empty pin set  
- [x] Payment screens request screenshot blocking  
- [x] Mock menu fallback cannot enable in release builds  
- [ ] Prod TLS pin enforce (blocked on prod HTTPS + ops pin set)  
- [ ] Optional jailbreak/root detection (explicitly deferred)  
- [ ] Optional install of `expo-screen-capture` on release pipeline  

## 10. Reporting

Security issues: treat as P0. Prefer private channel to maintainers; do not open public issues with exploit detail until a fix is staged.
