/**
 * Environment configuration for MaSoVa Mobile Customer App
 */

// Default configuration for development
const DEFAULT_API_BASE_URL = 'http://192.168.50.88:8080/api';
const DEFAULT_WS_BASE_URL = 'ws://192.168.50.88:8080/api/ws';

export const CONFIG = {
  API_BASE_URL: process.env.API_BASE_URL || DEFAULT_API_BASE_URL,
  WS_BASE_URL: process.env.WS_BASE_URL || DEFAULT_WS_BASE_URL,
  APP_ENV: process.env.APP_ENV || 'development',
  ENABLE_MOCK_FALLBACK: process.env.ENABLE_MOCK_FALLBACK === 'true',
  SENTRY_DSN: process.env.SENTRY_DSN || '',
  DEFAULT_TIMEOUT_MS: 30000,
};

export default CONFIG;
