# MaSoVa Mobile — Platform API Contract Reference

**Document Version:** 1.0.0 (Phase A Canonical Contract Alignment)  
**Platform Source of Truth:** `MaSoVa-restaurant-management-system` (`api-gateway`, microservice controllers, RTK Query slices)

---

## 1. Gateway & Connectivity

| Environment | Base URL | WebSocket Endpoint | Notes |
|-------------|----------|-------------------|-------|
| **Development** | `http://192.168.50.88:8080/api` | `ws://192.168.50.88:8080/api/ws` | Dell host via LAN / Metro port 8888 |
| **Staging** | `https://staging-api.masova.com/api` | `wss://staging-api.masova.com/api/ws` | Staging cluster |
| **Production** | `https://api.masova.com/api` | `wss://api.masova.com/api/ws` | Live gateway |

---

## 2. Mandatory HTTP Headers

Every authenticated request sent from `masova-mobile` to the API gateway must include:

| Header Name | Type | Value / Source |
|-------------|------|----------------|
| `Authorization` | String | `Bearer <accessToken>` (from iOS Keychain / Android Keystore) |
| `X-User-Id` | String | Logged-in User ID (`user.id`) |
| `X-User-Type` | String | `CUSTOMER` (hardcoded for customer app) |
| `X-Selected-Store-Id` | String | Selected store `storeCode` (e.g. `DOM001`) or `storeId` |

---

## 3. Auth & Identity Contracts

### Endpoints

```
POST   /api/auth/login            Body: { email, password } -> { accessToken, refreshToken, user }
POST   /api/auth/register         Body: { name, email, password, phone, role: "CUSTOMER" } -> { accessToken, refreshToken, user }
POST   /api/auth/refresh          Body: { refreshToken } -> { accessToken }
POST   /api/auth/logout           Clears session
POST   /api/auth/google           Body: { idToken } -> { accessToken, refreshToken, user }
POST   /api/auth/change-password  Body: { currentPassword, newPassword } -> { message }
GET    /api/auth/me               Returns current authenticated User object
```

### Identity Rule

- **`user.id`**: Auth principal / JWT subject.
- **`customer.id`**: Customer aggregate ID retrieved via `GET /api/customers?userId=<user.id>`.
- **Order ownership**: Always pass `customer.id` (NOT raw `user.id`) when querying or placing customer orders.

---

## 4. Canonical Route Reference

### Menu Service (`commerce-service`)

```
GET    /api/menu?storeId=&category=&cuisine=&dietary=&search=&recommended=&tag=
GET    /api/menu/{id}
```
*Note:* Legacy `/menu/public`, `/menu/public/{id}`, and `/menu/public/recommended` paths are removed.

### Store Service (`core-service`)

```
GET    /api/stores
GET    /api/stores?lat=&lng=
GET    /api/stores/{idOrCode}
```

### Customer Service (`core-service`)

```
GET    /api/customers?userId=<userId>
GET    /api/customers/{id}
PATCH  /api/customers/{id}
POST   /api/customers/{id}/addresses
PATCH  /api/customers/{id}/addresses/{addressId}
DELETE /api/customers/{id}/addresses/{addressId}
POST   /api/customers/{id}/loyalty
```
*Forbidden Gateway Route:* `POST /api/customers/get-or-create` (Gateway returns 403 DENY).

### Order Service (`commerce-service`)

```
POST   /api/orders                        Body: { storeId, customerId, customerName, orderType, paymentMethod, items }
GET    /api/orders/{orderId}
GET    /api/orders/track/{orderId}        (Public endpoint)
GET    /api/orders?customerId=<id>        (Query param for customer history)
DELETE /api/orders/{orderId}              (Cancel order)
```

### Payment Service (`payment-service`)

```
POST   /api/payments/initiate             Body: { orderId, amount ("250.00"), customerId, customerEmail, customerPhone, storeId }
POST   /api/payments/verify               Body: { orderId, razorpayOrderId, razorpayPaymentId, razorpaySignature }
GET    /api/payments?orderId=<id>
```

### Delivery Service (`logistics-service`)

```
GET    /api/delivery/track/{orderId}
POST   /api/delivery/{orderId}/otp        (Generate OTP)
POST   /api/delivery/verify               (Verify OTP: { orderId, otp })
GET    /api/delivery/zones?storeId=&lat=&lng=&check=true
```

### Notification Service (`core-service`)

```
GET    /api/notifications?userId=&unread=true
PATCH  /api/notifications/{id}/read
PATCH  /api/notifications/read-all?userId=
```

### Review Service (`core-service`)

```
POST   /api/reviews                       Body: { orderId, overallRating, comment }
GET    /api/reviews/public/token/{token}
```

---

## 5. DTO & Enum Standards

| Field / Enum | Allowed Values |
|--------------|----------------|
| **Order Payment Status** | `PENDING \| PAID \| FAILED \| REFUNDED` |
| **Order Payment Method** | `CASH \| CARD \| UPI \| WALLET` |
| **Order Type** | `DELIVERY \| TAKEAWAY \| DINE_IN` |
| **Review Rating Field** | `overallRating` (Integer 1..5) |
