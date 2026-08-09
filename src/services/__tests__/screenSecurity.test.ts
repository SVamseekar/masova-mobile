import { setScreenCaptureProtection } from '../screenSecurity';

describe('screenSecurity', () => {
  it('setScreenCaptureProtection resolves without throwing when module is absent', async () => {
    await expect(setScreenCaptureProtection(true)).resolves.toBeUndefined();
    await expect(setScreenCaptureProtection(false)).resolves.toBeUndefined();
  });
});
