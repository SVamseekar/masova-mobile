# Release & Deployment Procedures

## Versioning Scheme

Semantic Versioning (`MAJOR.MINOR.PATCH`) is enforced:
- `android/app/build.gradle`: `versionCode` (integer, incremented per build) and `versionName` (string).
- `package.json`: `"version": "x.y.z"`.

## Release Checklist

1. [ ] Run full CI checks locally: `npm run typecheck && npm run lint && npm test`.
2. [ ] Verify `ENABLE_MOCK_FALLBACK=false` in release build configuration.
3. [ ] Verify Metro port is 8888 (`npm run build:android`).
4. [ ] Test release APK on physical Samsung Galaxy Z Flip 5 USB device.
5. [ ] Tag release commit in git (`vX.Y.Z`).
6. [ ] Update `CHANGELOG.md`.
