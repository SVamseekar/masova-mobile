/**
 * Certificate Pinning Configuration (Phase F)
 *
 * Full TLS public-key pinning is DEFERRED until:
 * 1. Production API is served exclusively over HTTPS (api.masova.com or current prod host)
 * 2. Leaf / intermediate pin set is published by platform ops and rotated on a schedule
 * 3. A pin-failure kill-switch (feature flag or remote config) exists so a bad pin cannot brick the app
 *
 * Dev / Dell LAN continues to use plain HTTP (192.168.50.88:8080) — pinning does not apply.
 *
 * See docs/SECURITY.md § Certificate Pinning for the full plan and rollout checklist.
 */

export type CertificatePinMode = 'disabled' | 'report-only' | 'enforce';

export interface CertificatePinConfig {
  /** Hostnames that require pins when mode !== disabled (no scheme, no path). */
  hosts: string[];
  /**
   * Base64 SPKI SHA-256 pins (sha256/<base64>).
   * Always include at least two pins (current + backup) before enforce.
   */
  pins: string[];
  mode: CertificatePinMode;
  /**
   * When true, pin failures are logged / sent to Sentry breadcrumbs but requests still proceed.
   * Use during staging soak before flipping mode to enforce.
   */
  reportOnly: boolean;
}

/**
 * Production pin set is intentionally empty until ops supplies pins.
 * Do not invent pins; an incorrect enforce pin blocks all API traffic.
 */
export const CERTIFICATE_PINNING: CertificatePinConfig = {
  hosts: ['api.masova.com'],
  pins: [
    // 'sha256/AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', // current leaf SPKI
    // 'sha256/BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB=', // backup / intermediate
  ],
  mode: 'disabled',
  reportOnly: true,
};

/**
 * Whether pinning should be considered active for the current runtime config.
 * Always false while pins are empty or mode is disabled (current production path).
 */
export function isCertificatePinningActive(
  config: CertificatePinConfig = CERTIFICATE_PINNING
): boolean {
  return (
    config.mode !== 'disabled' &&
    config.pins.length >= 2 &&
    config.hosts.length > 0
  );
}

export default CERTIFICATE_PINNING;
