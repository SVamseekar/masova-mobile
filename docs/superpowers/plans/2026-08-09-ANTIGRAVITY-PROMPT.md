# Prompt for Google Antigravity

Copy everything inside the **PROMPT** block below into Antigravity (desktop or CLI).
Attach / open these workspaces if Antigravity supports multi-root:

1. `/Users/souravamseekarmarti/Projects/masova-mobile` (**primary — implement here**)
2. `/Users/souravamseekarmarti/Projects/MaSoVa-restaurant-management-system` (**read-only SSOT for APIs**)

Do **not** edit the platform backend unless a Phase A blocker is documented and the user explicitly approves.

---

## PROMPT (copy from here)

```
# Mission

You are implementing an industry-grade / production-grade upgrade of the MaSoVa **customer mobile app**.

Primary repo (WRITE):
  masova-mobile  (React Native 0.81 bare — NOT Expo Go — Metro port 8888)

Platform repo (READ-ONLY source of truth for APIs, DTOs, gateway rules):
  MaSoVa-restaurant-management-system

## Single source of truth document

Read and execute this plan end-to-end, phase by phase:

  masova-mobile/docs/superpowers/plans/2026-08-09-customer-app-production-grade.md

Also read before coding:
  - masova-mobile/CLAUDE.md (or Claude.md)
  - MaSoVa-restaurant-management-system/AGENTS.md
  - MaSoVa-restaurant-management-system/docs/guidelines/gotchas.md
  - MaSoVa-restaurant-management-system/docs/guidelines/git-branching.md
  - MaSoVa-restaurant-management-system/docs/guidelines/testing.md
  - Platform customer API slices: frontend/src/store/api/{auth,menu,order,customer,payment,delivery,store,notification,review}Api.ts
  - Gateway: api-gateway/src/main/java/com/MaSoVa/gateway/config/GatewayConfig.java
  - Controllers for menu, orders, customers, payments, delivery, notifications, reviews, stores, auth

## Why this exists

Investigation found the mobile client is on **legacy API paths** and incomplete contracts after platform API consolidation. Menu/public paths, customers/user/*, orders/customer/*, notifications/user/*, get-or-create (gateway DENY), wrong refresh field (token vs accessToken), missing X-User-Id, mock menu fallbacks, fake review submit, thin CI, inaccurate README (Expo Go), weak testing/monitoring/docs/git hygiene.

Your job: make the app production-grade **frontend + integration + testing + monitoring + docs + git/CI**, aligned with the live platform backend — not a redesign for its own sake.

## Your capabilities (use them)

You are Google Antigravity. Use agentic strengths:

1. **Plan then execute** with verifiable artifacts (checklists, test output, API_CONTRACT.md).
2. **Spawn parallel subagents** for independent workstreams (types/http, menu/store, customer/auth, order/payment, delivery/notifications/reviews, CI/docs) then merge carefully.
3. Use **editor + terminal + browser** as needed. Prefer terminal verification (tsc, lint, tests).
4. Prefer **small stacked PRs** over one mega-diff when possible.
5. After each phase, produce a short **verification report** (what ran, what passed, residual risk).

Do NOT:
- Invent backend endpoints.
- Call gateway-blocked routes (POST /api/customers/get-or-create, service-only GDPR anonymize, etc.).
- Suggest Expo Go or `expo start` as the app runner.
- Commit secrets, tokens, or AI co-author trailers.
- Force-push main or skip typecheck failures with `|| true`.
- Leave production builds depending on MOCK_MENU_ITEMS.

## Hard constraints

- Physical device standard: Samsung Galaxy Z Flip 5 over USB (not emulator as primary).
- Metro: port 8888; adb reverse when needed.
- Backend dev gateway: http://192.168.50.88:8080/api (Dell).
- Auth tokens only in Keychain/Keystore (secureTokenStorage), never AsyncStorage for tokens.
- Every network screen: loading + error + empty states.
- Navigation params typed.
- Conventional commits: feat()/fix()/chore()/test()/docs().
- GitHub Flow: feature branch → PR → squash-merge ready.
- Branch protection expects real "Lint and Type Check" — make CI actually fail on errors.

## Execution order (mandatory)

### Phase 0 — Scaffolding
- Branch from latest main (or current working branch if user is already on a feature branch — do not destroy existing uncommitted security work; integrate carefully).
- package.json scripts: typecheck, lint, test, test:ci, start, android, ios (bare RN).
- ESLint + Prettier + Jest + RNTL.
- CI: remove soft-fail `|| true`; require tsc + lint + unit tests.
- PR template, CODEOWNERS, dependabot, .env.example, docs skeleton from the plan §3.8.
- Rewrite README to match reality (bare RN, not Expo Go).

### Phase A — API contract re-sync (P0 — do not skip)
- Rebuild HTTP client: base URL config, refresh mutex, accessToken, headers:
  Authorization, X-User-Id, X-User-Type=CUSTOMER, X-Selected-Store-Id (prefer storeCode).
- Split/rewrite API modules to canonical paths (see plan §2.1 and §13).
- Align types/enums (order payment PAID not SUCCESS-only; no ONLINE payment method; CreateOrderRequest fields; Store model; Review overallRating).
- Customer identity: resolve customer via GET /customers?userId=; use customer.id for orders.
- Remove external get-or-create; implement guest strategy per plan (default: require auth for order unless a legal path exists).
- Wire screens; remove release mock menu; implement real review submit.
- Fix websocket to gateway paths only (no direct 8083/8090).
- Contract unit tests for URL builders + headers + mappers.

Acceptance for Phase A (must prove):
- [ ] ripgrep shows no legacy paths listed in the plan as mobile call sites
- [ ] npm run typecheck && npm run lint && npm test pass
- [ ] docs/API_CONTRACT.md written and accurate
- [ ] Manual or automated smoke notes for: login, menu by store, customer profile, create order shape, payment initiate fields

### Phase B — Product parity
Preferences, notification settings, loyalty history, delivery radius, payment status UI correctness, optional Stripe/non-IN if store countryCode requires it, GDPR entry if customer-allowed, change password.

### Phase C — Realtime & resilience
WS reconnect, offline banner, double-submit protection, basic a11y.

### Phase D — Testing hardening
Coverage on services/utils; component tests; Maestro or Detox smoke; docs/TESTING.md.

### Phase E — Observability & release
Sentry (or equivalent) + analytics events; RELEASE.md; versioning; release pipeline docs.

### Phase F — Hardening
Only after A–E review: pinning, perf, security checklist, runbook drills.

## After every phase

1. Run typecheck, lint, tests.
2. Update the plan checklist or add docs/superpowers/plans/PROGRESS.md with phase status.
3. Summarize for the human: files changed, how to verify, open blockers (docs/BLOCKERS.md if backend-blocked).
4. Prefer opening/preparing PR description text; do not force-push; do not merge without user approval.

## Success definition

The mobile app is industry/production grade when Definition of Done in the plan §9 is met: live contract alignment, docs truthfulness, strict CI, monitoring hook, E2E path, security baseline, GitHub Flow ready.

Start now with Phase 0, then Phase A. Do not jump to visual redesign. Re-read platform controllers if any path is uncertain.
```

---

## PROMPT ends

## How to use this with Antigravity (tips)

| Tip                                                              | Why                                                                      |
| ---------------------------------------------------------------- | ------------------------------------------------------------------------ |
| Paste the full PROMPT block as the **task**                      | Agents follow mission + constraints better with one sealed brief         |
| Add the production plan as a **pinned / always-on** context file | Prevents drift mid-run                                                   |
| Enable **multi-agent / subagents** for Phase A modules           | Parallel menu/order/customer work is independent after HTTP client lands |
| Ask for **artifacts** after each phase                           | Matches Antigravity’s verification style (reports, checklists)           |
| Run Phase A first, then pause for your review                    | Highest risk is API re-sync; don’t let it blend with monitoring fluff    |
| Keep platform repo **read-only** in the prompt                   | Avoids accidental backend edits                                          |
| If Antigravity has Skills, optional skill ideas                  | `masova-api-contract`, `rn-ci-gate`, `conventional-commit`               |

## Optional follow-up prompts (after Phase A merges)

**Verify against live gateway:**

```
Using the Dell gateway at 192.168.50.88:8080, run a smoke verification of masova-mobile API modules: login (test creds if present in local env only — never commit), GET /menu?storeId=, GET /customers?userId=, and document results in docs/superpowers/plans/SMOKE-RESULTS.md. Do not print secrets.
```

**Phase B only:**

```
Continue masova-mobile production program Phase B only per docs/superpowers/plans/2026-08-09-customer-app-production-grade.md. Do not re-litigate Phase A unless tests fail.
```

## What I prepared for you

| File                                                                 | Role                                              |
| -------------------------------------------------------------------- | ------------------------------------------------- |
| `docs/superpowers/plans/2026-08-09-customer-app-production-grade.md` | Full production program (SSOT for implementation) |
| `docs/superpowers/plans/2026-08-09-ANTIGRAVITY-PROMPT.md`            | This file — copy-paste prompt + usage tips        |

## Note on current git state

Your branch is `security-remediation-plan-b` with possible uncommitted docs. Before Antigravity starts large rewrites, either:

1. Commit/stash this plan doc, or
2. Tell Antigravity to branch from current HEAD without discarding security work.

The prompt tells it not to destroy existing uncommitted work.
