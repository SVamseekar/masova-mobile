# Operations & Support Runbook — MaSoVa Mobile

**Last updated:** 2026-08-10 (Phase F)

## 1. Incident Response Matrix

| Symptom | Likely cause | Diagnostic steps | Mitigation |
|---------|--------------|------------------|------------|
| **Empty menu / store load failure** | Wrong store code, store closed, gateway down | 1. Check `X-Selected-Store-Id` 2. `GET /api/stores` 3. Commerce logs | Select valid store; verify Dell gateway |
| **Auth 401 loop** | Expired refresh token or body field mismatch | 1. Inspect `/auth/refresh` returns `accessToken` 2. Keychain contents | Clear Keychain tokens; force login |
| **Orders missing** | List used `userId` instead of `customer.id` | 1. `GET /customers?userId=` 2. `GET /orders?customerId=` | Use customer aggregate id only |
| **WebSocket failed** | Legacy direct port or bad topic | 1. WS URL is `/api/ws` via gateway 2. Topics `/topic/order/{id}`, `/topic/delivery/{id}` | Fix config; REST polling still works |
| **Payment stuck / false success** | Payment service error; client assumed PAID | 1. Payment service logs 2. Order `paymentStatus` | Never mark paid client-side without verify; show PaymentFailed |
| **Offline banner missing** | `ENABLE_OFFLINE_BANNER=false` | Check feature flags | Re-enable flag |
| **Online pay options missing** | `ENABLE_PAYMENT_GATEWAY=false` | Check feature flags | Re-enable for production |

## 2. Health Checks

| Check | Command / URL |
|-------|----------------|
| Gateway health | `http://192.168.50.88:8080/actuator/health` (or staging equivalent) |
| API base (dev) | `http://192.168.50.88:8080/api` |
| WS base (dev) | `ws://192.168.50.88:8080/api/ws` |
| Mobile smoke (Dell) | `npm run smoke:dell` |
| Quality gates | `npm run typecheck && npm run lint && npm test` |

**Device (P0):** Samsung Galaxy Z Flip 5 USB · Metro **:8888** · `adb reverse tcp:8888 tcp:8888`

---

## 3. Runbook Drills (Phase F)

Execute these drills before a major release or after gateway/payment changes. Record date, operator, and outcome in the release notes.

### Drill A — Gateway down

**Goal:** User sees friendly errors; no mock menu; place-order disabled offline.

| Step | Action | Expected |
|------|--------|----------|
| A1 | Stop API gateway or block device → Dell (Wi‑Fi off / wrong IP) | NetInfo reports offline |
| A2 | Open app home / menu | Offline banner visible (if `ENABLE_OFFLINE_BANNER`) |
| A3 | Open Menu | Loading then **error** state with Retry — **not** mock pizza list (`ENABLE_MOCK_FALLBACK` must be false in release) |
| A4 | Open Checkout with items | Place Order CTA disabled / blocked when offline |
| A5 | Restore gateway + network | Retry loads real data; banner dismisses |

**Pass criteria:** No crash; no fake success orders; Sentry may record network errors without PII.

### Drill B — Payment fail

**Goal:** Failed/cancelled payment never shows as paid; cart/order messaging is correct.

| Step | Action | Expected |
|------|--------|----------|
| B1 | Login as demo user, add items, checkout ONLINE/UPI | Order create may succeed |
| B2 | Cancel payment at gateway UI **or** force payment service failure | Navigate to `PaymentFailed` with order id + message |
| B3 | Inspect order | Order not shown as `PAID` / success path not taken |
| B4 | Confirm analytics | `payment.fail` (and not `payment.success`) |
| B5 | Retry from checkout when service healthy | Can complete; `PaymentSuccess` only after verify success |

**Pass criteria:** No false “Payment Successful”; order id preserved for support; screenshot protection requested on fail/success screens.

### Drill C — Token revoke / refresh failure

**Goal:** User is returned to login; Keychain cleared; no infinite 401 loop.

| Step | Action | Expected |
|------|--------|----------|
| C1 | Login successfully; confirm authenticated API works | Menu/orders load with Bearer token |
| C2 | Simulate revoke: clear refresh on server **or** replace Keychain tokens with garbage via debug | Next API call gets 401 |
| C3 | Observe client refresh path | Single refresh attempt; on failure tokens cleared |
| C4 | UI | Session ends; Auth stack / login prompt |
| C5 | Re-login | Fresh tokens in Keychain; API works again |

**Pass criteria:** No stuck spinner; no tokens left in AsyncStorage; user can recover by logging in.

### Drill log template

```
Date:
Operator:
Build / commit:
Environment: Dell | Staging | Prod
Drill A: PASS / FAIL — notes
Drill B: PASS / FAIL — notes
Drill C: PASS / FAIL — notes
Follow-ups:
```

---

## 4. Common Fixes

| Issue | Fix |
|-------|-----|
| Metro unreachable on phone | `adb reverse tcp:8888 tcp:8888`; confirm `npm start` on 8888 |
| Wrong backend | Check `API_BASE_URL` / `CONFIG` defaults to Dell gateway |
| Stale store header | Reselect store; verify `X-Selected-Store-Id` |
| Cart items after store switch | Strict guard confirms + clears cart |

---

## 5. Escalation

| Area | Owner |
|------|--------|
| Mobile client bugs | masova-mobile maintainers |
| Gateway routes / deny lists | Platform API gateway |
| Payment / Razorpay-Stripe | payment-service + platform ops |
| Menu / orders data | commerce service |
