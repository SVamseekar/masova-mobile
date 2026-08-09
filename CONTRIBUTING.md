# Contributing Guidelines

## Git Branching & GitHub Flow

1. Create a feature branch off `main`:
   - `feat/feature-name`
   - `fix/bug-name`
   - `chore/task-name`
   - `test/test-name`
2. Follow Conventional Commits format:
   - `feat(scope): add new feature`
   - `fix(scope): fix issue`
   - `chore: update dependencies`
   - `test: add unit test`
   - `docs: update documentation`
3. Do NOT include `Co-Authored-By` AI trailers or tool signatures in commits.
4. Ensure all CI quality gates pass before opening PR:
   - `npm run typecheck`
   - `npm run lint`
   - `npm test`
5. PRs require review and clean squash-merge to `main`.
