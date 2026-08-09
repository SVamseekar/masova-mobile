# Testing Strategy & Execution

## Overview

The `masova-mobile` project uses a multi-layered testing pyramid:

1. **Unit Tests (Jest):** Mappers, services, HTTP client interceptors, pure utilities.
2. **Contract Tests (Jest):** URL builders, request headers, payload mapping against platform API contracts.
3. **Component Tests (RNTL):** UI component states (loading, error, empty data).
4. **Integration / E2E:** Live gateway smoke tests against Dell dev backend (`192.168.50.88:8080`).

## Running Tests

```bash
# Run unit & contract tests
npm test

# Run tests in CI mode
npm run test:ci

# Run TypeScript type check
npm run typecheck

# Run ESLint check
npm run lint
```

## Quality Gates

PRs must pass all quality gates cleanly without warnings or soft failures (`|| true` is strictly prohibited).
