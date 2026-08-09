import {
  CERTIFICATE_PINNING,
  isCertificatePinningActive,
} from '../certificatePinning';

describe('certificatePinning', () => {
  it('is disabled by default until ops supplies pins', () => {
    expect(CERTIFICATE_PINNING.mode).toBe('disabled');
    expect(CERTIFICATE_PINNING.pins).toHaveLength(0);
    expect(isCertificatePinningActive()).toBe(false);
  });

  it('requires mode + ≥2 pins + hosts to activate', () => {
    expect(
      isCertificatePinningActive({
        hosts: ['api.masova.com'],
        pins: ['sha256/AAA', 'sha256/BBB'],
        mode: 'enforce',
        reportOnly: false,
      })
    ).toBe(true);

    expect(
      isCertificatePinningActive({
        hosts: ['api.masova.com'],
        pins: ['sha256/AAA'],
        mode: 'enforce',
        reportOnly: false,
      })
    ).toBe(false);

    expect(
      isCertificatePinningActive({
        hosts: ['api.masova.com'],
        pins: ['sha256/AAA', 'sha256/BBB'],
        mode: 'disabled',
        reportOnly: true,
      })
    ).toBe(false);
  });
});
