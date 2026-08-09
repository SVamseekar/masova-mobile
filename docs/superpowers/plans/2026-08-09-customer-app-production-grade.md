# MaSoVa Customer Mobile — Industry / Production Grade Program

**Date:** 2026-08-09  
**App:** `masova-mobile` (React Native 0.81 bare / Metro **:8888**)  
**Backend / platform source of truth:** `MaSoVa-restaurant-management-system`  
**Sibling references:** platform web customer pages (`frontend/src/pages/customer/*`), RTK Query slices (`frontend/src/store/api/*`), API gateway (`api-gateway`), services (`core`, `commerce`, `payment`, `logistics`)  
**Audience:** Implementing agents (esp. Google Antigravity multi-agent), human reviewers, release owners  
**Status:** PLAN — implement phase-by-phase; do not ship partial API rewrites without green gates  

---

## 0. Executive summary

`masova-mobile` is the **customer-facing** mobile client for MaSoVa. The platform backend and staff/customer **web** clients have already gone through **API consolidation** (query-param lists, gateway deny lists, ownership headers, multi-store, payments). Mobile still targets many **legacy paths**, incomplete DTOs, missing identity headers, mock fallbacks, and thin engineering hygiene (tests, CI gates, observability, docs, git).

This program makes the customer app **production-grade end-to-end**:

| Pillar | Outcome |
|--------|---------|
| **Contract** | Mobile API + types match current platform gateway + service controllers |
| **Product** | Customer journeys parity with platform customer web (where mobile-relevant) |
| **Quality** | Unit + integration + contract + E2E gates that block merge |
| **Security** | Token storage, ownership headers, no blocked endpoints, least privilege |
| **Ops** | Env config, logging, crash/analytics hooks, health, release train |
| **Git / process** | Branch protection-compatible CI, conventional commits, PR template, CODEOWNERS, docs that match reality |

**Non-goals (unless explicitly scheduled later):** rewriting the entire design system; building POS/kitchen/driver apps; changing backend service ports; Expo Go migration (app is **bare RN**, not Expo Go).

---

## 1. Architecture & system map

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
│  Rate limits · JWT filter · route deny (get-or-create, GDPR │
│  service-only paths) · public menu/stores/track routes      │
└───┬──────────┬──────────┬──────────┬──────────┬─────────────┘
    │          │          │          │          │
 core:8085  commerce:8084  payment:8089  logistics:8086  intel:8087
 users      menu/orders    payments      delivery         analytics
 customers  tips/fiscal    refunds       inventory
 reviews    WS orders      webhooks      WS delivery
 notif
```

**Canonical base URL**

| Env | Base |
|-----|------|
| Dev (physical device) | `http://192.168.50.88:8080/api` (+ `adb reverse` if needed) |
| Staging | from env / secrets (never hardcode prod secrets) |
| Prod | `https://api.masova.com/api` (or current prod gateway host) |

**WebSocket (via gateway only — never direct service ports)**

| Topic | Path (gateway) |
|-------|----------------|
| Orders | `/api/ws/orders` (confirm exact path in `GatewayConfig` + STOMP destination from platform web) |
| Delivery | `/api/ws/delivery` |

Mobile must **not** use legacy direct ports `8083` / `8090` for WS in production or dev config comments that diverge from `websocketService`.

**Platform SSOT for client contracts**

1. Controllers under platform services (canonical paths in Javadoc)  
2. `frontend/src/store/api/*.ts` (customer-facing slices)  
3. `api-gateway/.../GatewayConfig.java` (public vs JWT vs deny)  
4. `docs/guidelines/gotchas.md` (canonical path table)

---

## 2. Ground truth: known drift (must fix)

These were verified against platform code as of investigation date. Treat as **P0 acceptance criteria** for Phase A.

### 2.1 API paths — mobile → canonical

| Domain | Mobile (broken / legacy) | Canonical (platform) |
|--------|--------------------------|----------------------|
| Menu list | `GET /menu/public` | `GET /menu?storeId=&category=&cuisine=&dietary=&search=&recommended=&tag=` |
| Menu item | `GET /menu/public/{id}` | `GET /menu/{id}` |
| Menu recommended | `GET /menu/public/recommended` | `GET /menu?recommended=true` |
| Menu search | `GET /menu/public/search?q=` | `GET /menu?search=` |
| Menu by category/cuisine | path segments | query params on `GET /menu` |
| Customer by user | `GET /customers/user/{userId}` | `GET /customers?userId=` |
| Customer by email | `GET /customers/email/{email}` | `GET /customers?email=` |
| Set default address | `PATCH .../set-default` | `PATCH /customers/{id}/addresses/{aid}` with `isDefault: true` |
| Get-or-create | `POST /customers/get-or-create` | **FORBIDDEN at gateway** — do not call externally |
| Orders by customer | `GET /orders/customer/{id}` | `GET /orders?customerId=` |
| Orders by status | `GET /orders/status/{status}` | `GET /orders?status=` |
| Order status update | `PATCH .../status` | `POST /orders/{id}/status` (staff; not customer primary path) |
| Notifications list | `GET /notifications/user/{id}` | `GET /notifications?userId=` |
| Unread | `.../unread` | `GET /notifications?userId=&unread=true` |
| Mark all read | `.../user/{id}/read-all` | `PATCH /notifications/read-all?userId=` |
| Delivery OTP gen | `POST .../generate-otp` | `POST /delivery/{orderId}/otp` |
| Delivery verify | `POST /delivery/verify-otp` | `POST /delivery/verify` (body type) |
| Delivery ETA | `GET /delivery/eta/{id}` | remove or re-derive from track payload |
| Stores nearest | `GET /stores/public/nearest` | `GET /stores?lat=&lng=` |
| Stores public list | `/stores/public` | still aliased; prefer `GET /stores` |
| Reviews public order | `/reviews/public/{orderId}` | token public + authenticated create; list by query for staff |
| Auth refresh body field | reads `token` | backend returns **`accessToken`** |

### 2.2 Headers (mandatory)

Every authenticated request must send (match platform `baseQueryWithAuth`):

| Header | Source |
|--------|--------|
| `Authorization: Bearer <accessToken>` | secure storage |
| `X-User-Id` | logged-in user id |
| `X-User-Type` | `CUSTOMER` for this app |
| `X-Selected-Store-Id` | selected store **code or id** consistent with menu DB filtering (prefer `storeCode` when present — same rule as today) |

Optional if available: `X-User-Store-Id` (usually empty for pure customers).

### 2.3 Identity rules

| Concept | Rule |
|---------|------|
| `user.id` | Auth principal / JWT subject |
| `customer.id` | Customer aggregate id from `GET /customers?userId=` |
| Order list / ownership | Use **customer.id** where API expects `customerId`; never pass raw user id unless backend documents equivalence |
| Guest checkout | Must not use blocked `get-or-create`. Options (pick one, document in ADR): (A) force register/login before order, (B) order with guest fields only if backend allows unauthenticated create (it generally requires auth roles), (C) register lightweight customer via public register + customer creation path that gateway allows |

### 2.4 DTO / enum alignment

| Topic | Production rule |
|-------|-----------------|
| Order payment status | `PENDING \| PAID \| FAILED \| REFUNDED` (order entity) — UI must map correctly (not only `SUCCESS`) |
| Payment txn status | Handle payment-service statuses (`SUCCESS`, etc.) separately from order payment status |
| Payment method on order | `CASH \| CARD \| UPI \| WALLET` (no `ONLINE` — map UI “online” → `UPI`/`CARD` per flow) |
| Create order items | Required: `menuItemId`, `name`, `quantity`, `price` (major units as backend expects) |
| Create order | Required: `customerName`, `storeId`, `orderType`, `items` |
| Review create | `overallRating` not bare `rating`; send identity headers |
| Store model | Map `status`, `operatingConfig`, `storeCode`, `currency`, `countryCode`, `locale` |
| Menu prices | Confirm paise vs major units with platform web cart math; single converter module |

### 2.5 Product gaps vs platform customer web

Implement or explicitly defer with ticket:

| Feature | Target |
|---------|--------|
| Preferences (allergens, spice, dietary, notif toggles) | Profile edit + PATCH customer preferences |
| Notification settings | Settings screen + preferences API |
| Loyalty history | Display `pointHistory` |
| Delivery radius check | Before place order (store lat/lng + customer address) |
| Reviews submit | Real API, no fake success |
| Remove mock menu fallback in production builds | Fail with error UI only |
| GDPR | Link/export/delete via platform `/api/gdpr/*` where customer-allowed |
| Multi-currency / Stripe | If store `countryCode` ≠ IN, follow payment-service Stripe fields (parity with web PaymentPage) |
| Tips | Optional Phase E if product requires `tipAmountINR` |
| Change password | Wire `POST /auth/change-password` |

---

## 3. Target engineering standard (definition of “industry grade”)

### 3.1 Application layering

```
src/
  config/           # env, feature flags, API base URLs (no secrets in repo)
  types/            # DTOs matching backend (generated or hand-synced + contract tests)
  services/
    http/           # axios instance, interceptors, refresh mutex
    api/            # domain modules: auth, menu, order, customer, payment, ...
    realtime/       # STOMP websocket
    storage/        # secure tokens + non-sensitive prefs
  features/         # optional vertical slices over time
  hooks/            # React Query hooks per domain
  screens/          # presentational + orchestration only
  components/
  navigation/
  utils/            # money, dates, store mapping, error mapping
  test/             # helpers, MSW handlers, fixtures
```

Rules:

- Screens never hardcode raw paths.
- One **error mapper** → user-safe messages + structured log fields.
- Money helpers: `toMajor` / `toMinor` / `formatMoney(currency, locale)`.
- Loading / empty / error states on **every** network screen (project hard rule).
- Typed navigation params only.

### 3.2 Security baseline

- Access + refresh tokens **only** in Keychain/Keystore (`secureTokenStorage`); never AsyncStorage for tokens.
- Certificate pinning plan for prod (document + optional Phase F).
- No secrets in git; `.env.example` only; EAS secrets / CI secrets for release.
- Logout clears tokens + React Query cache + sensitive AsyncStorage keys.
- Jailbreak/root detection optional (Phase F).
- Do not call gateway-denied endpoints.
- Validate SSL in prod; allow cleartext only for documented LAN dev (`android` network security config scoped to debug).

### 3.3 Reliability

- Axios timeout 30s; retry only idempotent GETs (max 2, backoff).
- Token refresh: **mutex** (platform web pattern) — single in-flight refresh; queue waiters.
- Offline banner + queued actions policy (orders must not double-submit — idempotency key if backend supports, else client lock).
- App version header `X-App-Version` + platform for support/debug.

### 3.4 Observability

| Signal | Tooling (recommended) |
|--------|------------------------|
| Crashes | Sentry React Native (or Crashlytics) |
| Analytics | Product events: login, add_to_cart, begin_checkout, purchase, track_order |
| Logs | Structured console in dev; remote breadcrumb on error in prod |
| Performance | Sentry perf or Flipper in dev; TTI metrics optional |
| Backend correlation | Log `X-Request-Id` if gateway returns it |

Minimum events: `auth.login.success|fail`, `order.create.success|fail`, `payment.success|fail`, `menu.load.fail`.

### 3.5 Testing pyramid

| Layer | What | Gate |
|-------|------|------|
| Unit | mappers, money, auth refresh, reducers/hooks pure logic | PR required |
| Component | critical UI states (loading/error/empty) with RNTL | PR required for touched areas |
| Contract | MSW or Pact-style fixtures from platform OpenAPI / recorded responses | PR required for API modules |
| Integration | React Query + axios mock full flows | nightlies + PR smoke |
| E2E | Detox or Maestro: login → menu → cart → checkout (mock or staging) | release required |
| Manual | Physical Galaxy Z Flip 5 USB checklist | pre-release |

**Remove** `|| true` from CI lint/type jobs — failures must fail the job.

### 3.6 CI / CD

Target workflows (tighten existing `.github/workflows`):

1. **PR gate (required):** `npm ci` → `tsc --noEmit` → `eslint` (strict) → `jest`/`vitest` unit  
2. **PR optional / path-based:** Android debug assemble (if secrets allow)  
3. **Main:** same + tag release pipeline  
4. **Release:** signed APK/AAB (Gradle or EAS — pick one strategy and document; today README contradicts bare RN)  
5. Branch protection: require “Lint and Type Check” (already noted in Claude.md)

### 3.7 Git & process hygiene

Align with platform GitHub Flow:

| Rule | Detail |
|------|--------|
| Branches | `feat/…`, `fix/…`, `chore/…` off `main` |
| Commits | Conventional: `feat(customer-api): …`, `fix(auth): …`, `test: …`, `docs: …` |
| PR | Template: summary, risk, test plan, screenshots, API contract impact |
| Squash-merge | Linear history |
| No | force-push main, Co-Authored-By AI trailers, committing secrets, `.claude/` etc. |
| CODEOWNERS | mobile owners + optional platform backend owners for contract files |
| Dependabot | npm + gradle weekly |
| After merge | delete local + remote branch (`auto-delete` not enabled) |

### 3.8 Documentation set (must exist and be accurate)

| Doc | Purpose |
|-----|---------|
| `README.md` | Correct bare RN setup, Metro 8888, physical device, adb reverse, env, scripts |
| `docs/ARCHITECTURE.md` | Layering + integration map |
| `docs/API_CONTRACT.md` | Canonical endpoints used by mobile + header rules |
| `docs/ENVIRONMENTS.md` | Dev/staging/prod, Dell IP, secrets |
| `docs/TESTING.md` | How to run unit/E2E |
| `docs/RELEASE.md` | Version bump, changelog, store submission checklist |
| `docs/RUNBOOK.md` | Incidents: auth fail, payment fail, menu empty, WS down |
| `docs/SECURITY.md` | Token storage, threat model summary |
| `CONTRIBUTING.md` | Branch/PR/commit rules |
| `AGENTS.md` or update `CLAUDE.md` | Agent runbook consistent with platform `AGENTS.md` |
| `.env.example` | `API_BASE_URL`, `WS_BASE_URL`, Sentry DSN placeholder, feature flags |
| `CHANGELOG.md` | Keep a Changelog format |

---

## 4. Implementation program (phased)

Each phase has: **goal**, **work items**, **artifacts**, **acceptance**, **suggested Antigravity parallelism**.

### Phase 0 — Program scaffolding (1–2 agent days)

**Goal:** Repo ready for production work without breaking main.

1. Create branch `feat/customer-production-grade` (or stacked PRs per phase).  
2. Add/refresh docs skeleton listed in §3.8 (stub OK if accurate).  
3. Fix `package.json` scripts: `typecheck`, `lint`, `test`, `test:ci`, `start`, `android`, `ios` — **no Expo Go**.  
4. Add ESLint + Prettier + Jest (+ React Native Testing Library) configs.  
5. Fix CI: remove `|| true`; add test job; fail on type errors.  
6. PR template + Dependabot + CODEOWNERS.  
7. `.env.example` + `src/config/env.ts` reading `react-native-config` or Babel inline env (choose one; document).  

**Acceptance:** `npm run typecheck && npm run lint && npm test` green on empty/minimal suite; CI matches scripts.

---

### Phase A — API contract re-sync (P0)  ★ highest priority

**Goal:** Mobile talks to **current** platform; no legacy paths; no mocks in release.

#### A1. HTTP client foundation

- Rebuild `src/services/http/client.ts`: base URL from config, interceptors, refresh mutex, headers.  
- Fix refresh: read `accessToken` from `/auth/refresh`.  
- Attach `X-User-Id` / `X-User-Type` / `X-Selected-Store-Id`.  
- Central `ApiError` type.

#### A2. Domain API modules (replace monolithic outdated `api.ts` gradually)

Implement modules mirroring platform slices:

| Module | Reference |
|--------|-----------|
| `authApi` | `frontend/src/store/api/authApi.ts` |
| `menuApi` | `menuApi.ts` + MenuController |
| `orderApi` | `orderApi.ts` + OrderController |
| `customerApi` | `customerApi.ts` + CustomerController |
| `paymentApi` | `paymentApi.ts` + PaymentController |
| `deliveryApi` | `deliveryApi.ts` + DeliveryController |
| `storeApi` | `storeApi.ts` + StoreController |
| `notificationApi` | `notificationApi.ts` + NotificationController |
| `reviewApi` | `reviewApi.ts` + ReviewController |
| `gdprApi` (optional A+) | `gdprApi.ts` |

#### A3. Types

- Rewrite `src/types` against platform DTOs (order payment status, store, customer preferences, payment response Stripe fields).  
- Shared mappers: menu item id (`id` vs `_id`), store open state from `operatingConfig` + `status`.

#### A4. Guest / customer bootstrap

- Remove external `get-or-create` usage.  
- Implement approved guest strategy (see §2.3) — **default recommendation:** authenticated checkout only + clear guest CTA to register; keep guest UI only if product insists and backend path is legal.

#### A5. Screen wiring

- Menu: real API only; error/empty UI; no production mock catalog.  
- Profile: `GET /customers?userId=` then use `customer.id`.  
- Order history: `GET /orders?customerId=<customer.id>`.  
- Checkout: valid `CreateOrderRequest`; payment method mapping; amount precision like web (`toFixed(2)` where required).  
- Reviews: real submit with `overallRating`.  
- Addresses: set default via PATCH body.  
- Notifications: query-param endpoints.  
- Delivery track: track + OTP path fix; WS via gateway.

#### A6. Contract tests

- Fixture JSON from platform responses (or OpenAPI samples).  
- Unit tests asserting URL builders and header injection.  
- Optional: consumer contract tests if platform publishes OpenAPI via gateway `/v3/api-docs`.

**Acceptance checklist (Phase A)**

- [x] No references to `/menu/public`, `/customers/user/`, `/orders/customer/`, `/notifications/user/`, `get-or-create`, `generate-otp`, `verify-otp` as standalone legacy paths  
- [x] Refresh uses `accessToken`  
- [x] `X-User-Id` present on authenticated calls  
- [x] Order history loads for a real customer against Dell gateway  
- [x] Menu loads for selected `storeCode` without mock fallback in release  
- [x] Contract unit tests green  

**Parallelism for Antigravity:** subagent1 types+client; subagent2 menu+store; subagent3 customer+auth; subagent4 order+payment; subagent5 delivery+notifications+reviews; orchestrator merges + integration pass.

---

### Phase B — Product parity (customer web)

**Goal:** Feature completeness for customer mobile journeys.

1. Preferences editor (allergens, dietary, spice, notification flags).  
2. Notification settings screen.  
3. Loyalty points history.  
4. Delivery radius validation at checkout.  
5. Payment success/fail reliability (verify, order payment status display).  
6. Stripe path if `countryCode` not IN (parity with web).  
7. GDPR entry points (request export / delete) if legal product requirement.  
8. Change password.  
9. Saved favorites if backend supports (or local-only with clear labeling).  

**Acceptance:** Side-by-side checklist vs `frontend/src/pages/customer/*` marked done/deferred with tickets.

---

### Phase C — Realtime & UX resilience

1. Single WS client; reconnect with backoff; auth token refresh on reconnect.  
2. Order tracking + delivery location updates.  
3. Optimistic cart (already local) with store-switch confirmation.  
4. Global offline banner.  
5. Double-tap order submit protection.  
6. Accessibility: labels, contrast, large text (basic a11y audit).  

---

### Phase D — Testing hardening

1. Unit coverage target: **≥70%** on `services/`, `utils/`, money/auth mappers.  
2. Component tests for auth, checkout error states, menu empty/error.  
3. Maestro or Detox happy path on Android.  
4. Staging smoke script documented in `docs/TESTING.md`.  
5. CI: unit required; E2E on main or nightly.  

---

### Phase E — Observability & release engineering

1. Sentry (or equivalent) + release health.  
2. Analytics events (§3.4).  
3. Feature flags file (remote optional later).  
4. `docs/RELEASE.md` + versioning (`1.x.y` + android versionCode).  
5. Signed release build pipeline.  
6. Play Store listing checklist (privacy policy URL, data safety).  

---

### Phase F — Hardening (production+)

1. Certificate pinning.  
2. Screenshot security on payment screens (optional).  
3. Perf: list virtualization audit, image caching.  
4. Security review checklist completed.  
5. Load test of checkout against staging (coordination with backend).  
6. Runbook drills: gateway down, payment fail, token revoke.  

---

## 5. End-to-end customer journeys (must pass)

### Happy paths

1. **Browse:** open app → select store → menu loads → filters/search work  
2. **Auth:** register → login → refresh after expiry → logout clears state  
3. **Cart:** add item with variant/customization → cart totals correct currency  
4. **Checkout COD:** place order CASH → success → appears in history → track  
5. **Checkout online:** create order → payment initiate → verify → PAID → success screen  
6. **Address:** add / edit / set default / delete  
7. **Review:** completed order → submit ratings → success from API  
8. **Notifications:** list / mark read / mark all  

### Failure paths

1. Gateway unreachable → friendly error, retry  
2. 401 → refresh → retry; refresh fail → login  
3. Payment cancel → PaymentFailed, order not falsely “paid”  
4. Wrong store / empty menu → empty state, not mock pizza list  
5. Cross-customer order access → 403 handled  

### Device matrix

| Device | Priority |
|--------|----------|
| Samsung Galaxy Z Flip 5 USB | **P0** (project standard) |
| One mid Android emulator | P1 CI smoke only |
| iOS simulator | P1 if shipping iOS |

---

## 6. Monitoring & production operations

### 6.1 SLOs (suggested)

| SLO | Target |
|-----|--------|
| App crash-free sessions | ≥ 99.5% |
| Checkout success (payment complete / order created) | track weekly |
| Menu p95 load (client-visible) | < 3s on Wi-Fi LAN/staging |
| Auth success rate | monitor |

### 6.2 Alerts (owner: mobile + platform)

- Spike in `payment.fail` / `order.create.fail`  
- Spike in 401 after refresh  
- Sentry new issue regression on release  
- Backend gateway 5xx (platform ops)

### 6.3 Support runbook (summary)

| Symptom | Checks |
|---------|--------|
| Empty menu | Store selected? `storeCode` header? Gateway menu route? Commerce up? |
| Orders missing | Using `customer.id`? JWT valid? |
| Payment stuck | Payment service logs; Razorpay/Stripe keys; verify endpoint |
| WS no updates | Gateway WS route; token; topic names vs platform web |

Full detail → `docs/RUNBOOK.md`.

---

## 7. Git & collaboration tightening (concrete deliverables)

1. **`.github/pull_request_template.md`** — summary, risk, test plan, contract impact, screenshots.  
2. **`.github/CODEOWNERS`** — `/src/services/`, `/docs/API_CONTRACT.md`.  
3. **`.github/dependabot.yml`** — npm weekly.  
4. **CI required checks** — typecheck + lint + unit (no soft-fail).  
5. **Commit lint** (optional husky + commitlint) for conventional commits.  
6. **Branch naming** documented in CONTRIBUTING.  
7. **No AI trailers**; respect root `.gitignore` for tool caches.  
8. **Changelog** on release tags.  
9. **Issue templates** for bug / contract drift.  

---

## 8. Backend coordination (when mobile cannot fix alone)

Raise platform tickets if discovered:

| Issue | Owner |
|-------|-------|
| Guest order without blocked get-or-create | Backend product decision |
| Customer list returns array — confirm single-customer convenience endpoint | Optional BE |
| Public menu item ratings for customers | Reviews public surface |
| Idempotency key on order create | Backend enhancement |
| Consistent payment status vocabulary across services | Platform API design |

Mobile must not reintroduce legacy gateway routes.

---

## 9. Definition of Done (program-level)

Program is **done** when:

1. All Phase A acceptance boxes checked against **live Dell gateway** or staging.  
2. Phases B–E either done or explicitly deferred with issues.  
3. README and docs match actual scripts and architecture (no Expo Go instructions).  
4. CI required checks green; no `|| true` on quality gates.  
5. Sentry (or agreed alternative) receives a test event from release build.  
6. E2E happy path recorded (Maestro/Detox or documented manual script on Z Flip 5).  
7. `docs/API_CONTRACT.md` matches platform controllers (spot-checked).  
8. Security pass: no tokens in AsyncStorage; no secrets in repo.  
9. PR merged via GitHub Flow with linear history.  

---

## 10. Suggested PR stack (for implementers)

| PR | Title | Depends |
|----|-------|---------|
| PR0 | chore: tooling, CI gates, docs skeleton | — |
| PR1 | feat(api): http client + auth refresh + headers | PR0 |
| PR2 | feat(api): menu + store contract re-sync | PR1 |
| PR3 | feat(api): customer identity + addresses | PR1 |
| PR4 | feat(api): orders + payments | PR2, PR3 |
| PR5 | feat(api): delivery, notifications, reviews | PR4 |
| PR6 | feat: product parity preferences + notif settings | PR3 |
| PR7 | test: contract + unit + e2e smoke | PR5 |
| PR8 | chore: monitoring + release docs | PR7 |

Prefer **small PRs**; Antigravity may implement stack in worktrees but human merges sequentially.

---

## 11. Risk register

| Risk | Mitigation |
|------|------------|
| Mock menu hides API failure | Ban mocks in `__DEV__` only behind flag; never release |
| Guest checkout product dependency | Default to auth-required until BE path exists |
| Price unit confusion (paise/rupees) | Single money module + contract tests |
| Header identity mismatch | Mirror web baseQuery; integration test |
| Scope explosion | Phases A then stop for review before B+ |
| CI EAS without secrets | Make store builds optional; keep tsc/lint/test required |

---

## 12. Working agreements for AI implementers (Antigravity)

1. Read this plan + platform `AGENTS.md` + `docs/guidelines/gotchas.md` before coding.  
2. Prefer **platform frontend RTK APIs** as client contract SSOT over mobile comments.  
3. Verify endpoints against **gateway + controller** if conflict.  
4. Do not invent backend endpoints.  
5. Do not use Expo Go. Metro port **8888**. Physical device preferred for final verify.  
6. After each phase: typecheck, lint, tests, short demo notes.  
7. Produce **artifacts**: API_CONTRACT updates, test reports, checklist markdown.  
8. Conventional commits; no Co-Authored-By AI trailers.  
9. If blocked on backend, file a `docs/BLOCKERS.md` entry and continue adjacent work.  
10. Keep PRs reviewable (< ~400 LOC ideal; hard cap soft 800 unless pure renames).  

---

## 13. Appendix — quick canonical route cheat sheet (customer)

```
POST   /api/auth/login
POST   /api/auth/register
POST   /api/auth/refresh          → { accessToken }
POST   /api/auth/logout
POST   /api/auth/google
POST   /api/auth/change-password

GET    /api/menu?storeId=&search=&recommended=&category=&cuisine=&dietary=
GET    /api/menu/{id}

GET    /api/stores
GET    /api/stores?lat=&lng=
GET    /api/stores/{idOrCode}
GET    /api/stores/public                # alias ok
GET    /api/stores/public/{code}         # by code

GET    /api/customers?userId=
GET    /api/customers/{id}
PATCH  /api/customers/{id}
POST   /api/customers/{id}/addresses
PATCH  /api/customers/{id}/addresses/{addressId}
DELETE /api/customers/{id}/addresses/{addressId}
POST   /api/customers/{id}/loyalty       # earn/redeem

POST   /api/orders
GET    /api/orders/{orderId}
GET    /api/orders/track/{orderId}        # public
GET    /api/orders?customerId=
DELETE /api/orders/{orderId}             # cancel

POST   /api/payments/initiate
POST   /api/payments/verify
GET    /api/payments?orderId=

GET    /api/delivery/track/{orderId}
POST   /api/delivery/{orderId}/otp

GET    /api/notifications?userId=&unread=
PATCH  /api/notifications/{id}/read
PATCH  /api/notifications/read-all?userId=

POST   /api/reviews                      # overallRating + headers
GET    /api/reviews/public/token/{token}

# DO NOT CALL from mobile through gateway:
POST   /api/customers/get-or-create
POST   /api/*/gdpr/anonymize (service-only paths)
```

---

## 14. Appendix — file touch map (expected)

| Path | Action |
|------|--------|
| `src/services/api.ts` | Split / rewrite to modules |
| `src/types/index.ts` | Align DTOs |
| `src/services/secureTokenStorage.ts` | Keep; ensure sole token store |
| `src/services/websocketService.ts` | Gateway URLs + topics |
| `src/services/paymentService.ts` | Status mapping + Stripe branch |
| `src/contexts/*` | Customer id cache after login |
| `src/hooks/useMenuQueries.ts` etc. | New endpoints |
| `src/screens/**` | Wire, remove mocks/TODOs |
| `package.json` | scripts + test deps |
| `.github/workflows/ci.yml` | strict gates |
| `README.md` | rewrite accurate |
| `docs/**` | new contract/architecture/runbook |

---

**End of plan.** Implement Phase 0 → A first; re-verify against live platform before B+.
