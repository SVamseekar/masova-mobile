# Operations & Support Runbook

## Incident Response Matrix

| Symptom | Cause | Diagnostic Steps | Mitigation |
|---------|-------|------------------|------------|
| **Empty Menu / Store load failure** | Incorrect store code, store closed, or gateway down | 1. Check `X-Selected-Store-Id` header<br>2. Test `GET /api/stores` directly<br>3. Check Commerce Service logs | Select valid store or verify Dell gateway |
| **Auth 401 Loop** | Expired refresh token or missing `accessToken` property | 1. Inspect `/auth/refresh` response structure (must read `accessToken`) | Clear keychain token state, force user login |
| **Orders Missing** | Order list requested with `userId` instead of `customer.id` | 1. Check `GET /customers?userId=` response<br>2. Verify `GET /orders?customerId=<customer.id>` | Ensure customer aggregate ID is used |
| **WebSocket Connection Failed** | Legacy direct service port used (e.g. 8083/8090) | 1. Verify WS URL points to `/api/ws/*`<br>2. Check gateway STOMP endpoint | Update WS configuration to route through gateway |

## Health Checks

- Backend Gateway: `http://192.168.50.88:8080/actuator/health`
- Dell Host IP: `192.168.50.88`
