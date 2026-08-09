import * as Sentry from '@sentry/react-native';
import { CONFIG } from '../../config';

let isInitialized = false;

/**
 * Initializes Sentry error reporting if a DSN is provided via environment/config.
 */
export function initErrorReporting(): void {
  if (isInitialized) {
    return;
  }

  if (!CONFIG.SENTRY_DSN) {
    if (__DEV__) {
      console.log('[ErrorReporting] SENTRY_DSN is not configured; running in silent console mode.');
    }
    return;
  }

  try {
    Sentry.init({
      dsn: CONFIG.SENTRY_DSN,
      environment: CONFIG.APP_ENV,
      enabled: !__DEV__ || process.env.SENTRY_ENABLE_IN_DEV === 'true',
      tracesSampleRate: 1.0,
      debug: __DEV__,
    });
    isInitialized = true;
    console.log('[ErrorReporting] Sentry initialized successfully.');
  } catch (err) {
    console.warn('[ErrorReporting] Sentry initialization failed:', err);
  }
}

/**
 * Capture an error / exception with optional structured context.
 */
export function captureException(error: unknown, context?: Record<string, unknown>): void {
  if (CONFIG.SENTRY_DSN && isInitialized) {
    Sentry.captureException(error, { extra: context });
  }
  if (__DEV__) {
    console.error('[ErrorReporting] Exception captured:', error, context);
  }
}

/**
 * Capture a text message with level and context.
 */
export function captureMessage(
  message: string,
  level: Sentry.SeverityLevel = 'info',
  context?: Record<string, unknown>
): void {
  if (CONFIG.SENTRY_DSN && isInitialized) {
    Sentry.captureMessage(message, { level, extra: context });
  }
  if (__DEV__) {
    console.log(`[ErrorReporting] Message (${level}):`, message, context);
  }
}

/**
 * Set user context in Sentry scope (call on login).
 */
export function setUserContext(user: { id: string; email?: string; userType?: string }): void {
  if (CONFIG.SENTRY_DSN && isInitialized) {
    Sentry.setUser({
      id: user.id,
      email: user.email,
      username: user.userType,
    });
  }
}

/**
 * Clear user context in Sentry scope (call on logout).
 */
export function clearUserContext(): void {
  if (CONFIG.SENTRY_DSN && isInitialized) {
    Sentry.setUser(null);
  }
}

/**
 * Send a test crash/error event to verify Sentry setup in debug/staging builds.
 */
export function sendTestErrorEvent(): string {
  const testMessage = `MaSoVa Debug Test Event (${new Date().toISOString()})`;
  const testError = new Error(testMessage);

  captureException(testError, { testEvent: true, timestamp: Date.now() });
  return testMessage;
}
