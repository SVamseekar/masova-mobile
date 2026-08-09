# Security Policy & Baseline

## Token Storage
- **Keychain / Keystore (`react-native-keychain`):** All access tokens and refresh tokens MUST be stored exclusively in iOS Keychain / Android Keystore.
- **AsyncStorage:** `AsyncStorage` is restricted to non-sensitive preferences (e.g. theme, selected store ID, search history). NEVER store JWT tokens in `AsyncStorage`.

## Request Identity Headers
All API calls to the gateway must include:
- `Authorization: Bearer <accessToken>`
- `X-User-Id: <userId>`
- `X-User-Type: CUSTOMER`
- `X-Selected-Store-Id: <storeCode|storeId>`

## Gateway Route Constraints
- Do NOT call gateway-denied routes (e.g. `POST /api/customers/get-or-create`).
- Respect gateway route rules defined in platform `GatewayConfig.java`.

## Data Loss & Secrets
- Never commit `.env` files containing production secrets.
- Secrets are injected via CI / environment variables at build time.
