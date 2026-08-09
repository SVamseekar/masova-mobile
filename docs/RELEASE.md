# Release & Deployment Procedures — MaSoVa Mobile

## 1. Versioning Scheme & Bumping Procedure

Semantic Versioning (`MAJOR.MINOR.PATCH`) is strictly enforced across configuration files:

- **`package.json`**: `"version": "X.Y.Z"`
- **`android/app/build.gradle`**:
  - `versionCode`: Integer incremented with **every** release build (e.g., `100` -> `101`).
  - `versionName`: String matching `package.json` (e.g., `"1.0.0"`).

### Version Bump Steps
```bash
# 1. Update package.json version
npm version patch # or minor / major

# 2. Update android/app/build.gradle
# Increment versionCode by +1 and update versionName to match package.json
```

---

## 2. Changelog & Git Tagging Process

1. Document all notable user-facing changes, bug fixes, and infrastructure updates in `CHANGELOG.md` following [Keep a Changelog](https://keepachangelog.com/en/1.0.0/) format:
   ```markdown
   ## [1.0.0] - 2026-08-10
   ### Added
   - Observability & Sentry error reporting integration.
   - Core analytics events (`auth.login`, `order.create`, `payment`, `menu.load.fail`).
   - Local & remote-ready feature flags module.
   ```
2. Commit version bump: `git commit -m "chore(release): bump version to 1.0.0"`
3. Tag git release commit: `git tag -a v1.0.0 -m "Release v1.0.0"`
4. Push release tag: `git push origin v1.0.0`

---

## 3. Bare React Native Signed Release Build Pipeline

`masova-mobile` is a **bare React Native app** (Metro port 8888). Release builds do **not** rely on Expo Go.

### 3.1 Keystore Generation
Generate a release signing key if one does not exist (never commit the `.keystore` file or credentials to git):
```bash
keytool -genkeypair -v \
  -keystore android/app/my-release-key.keystore \
  -alias my-key-alias \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```

### 3.2 Gradle Release Configuration
Add signing credentials to local `android/gradle.properties` (or environment variables in CI):
```properties
MYAPP_RELEASE_STORE_FILE=my-release-key.keystore
MYAPP_RELEASE_KEY_ALIAS=my-key-alias
MYAPP_RELEASE_STORE_PASSWORD=your_store_password
MYAPP_RELEASE_KEY_PASSWORD=your_key_password
```

Ensure `android/app/build.gradle` attaches the `release` signing config to `buildTypes.release`.

### 3.3 Building Release Artifacts
```bash
# Clean previous build artifacts
npm run clean

# Build signed Android Release APK
npm run build:android

# Or build Android App Bundle (AAB) for Google Play Store upload
cd android && ./gradlew bundleRelease && cd ..
```
The output binaries will be generated at:
- **APK**: `android/app/build/outputs/apk/release/app-release.apk`
- **AAB**: `android/app/build/outputs/bundle/release/app-release.aab`

---

## 4. Observability & Crash Reporting (Sentry)

1. **DSN Configuration**: DSN is loaded exclusively via environment / secret variables (`SENTRY_DSN`). Never commit production DSN keys to git.
2. **Environment Variable**: Set `SENTRY_DSN="https://<key>@sentry.io/<project>"` in `.env` or EAS / CI build secrets.
3. **Debug Verification**:
   To test crash & exception capturing from a debug build:
   ```typescript
   import { sendTestErrorEvent } from './src/services/observability';
   sendTestErrorEvent(); // Fires a test exception captured in Sentry dashboard
   ```

---

## 5. Google Play Store Submission Checklist

Before submitting an update or new release to Google Play Console:

- [ ] **Quality Gates**: `npm run typecheck && npm run lint && npm test` passes with zero errors.
- [ ] **Gateway Config**: Verify `ENABLE_MOCK_FALLBACK=false` in release builds.
- [ ] **Metro Port**: Metro configured on port 8888 (`npm run start --port 8888`).
- [ ] **Device Testing**: Test release APK on physical Samsung Galaxy Z Flip 5 USB target.
- [ ] **Privacy Policy URL**: `https://masova.souravamseekar.com/privacy`
- [ ] **Data Safety Notes (Play Console Declaration)**:
  - **Personal Data**: Name, Email address, Phone number, Delivery address (Collected for account authentication & order fulfillment). Encrypted in transit.
  - **Financial Info**: Payment metadata (Processed securely via Razorpay/Stripe SDKs; no raw credit card details stored).
  - **App Info & Performance**: Crash logs and diagnostics collected via Sentry (`SENTRY_DSN`).
  - **Security Practices**: All auth tokens stored exclusively in iOS Keychain / Android Keystore (`react-native-keychain`).
- [ ] **Store Graphics & Screenshots**: High-resolution screenshots generated for phone display formats (Samsung Galaxy Z Flip 5 / 16:9 / 19.5:9), 512x512 app icon, and 1024x500 feature graphic.
