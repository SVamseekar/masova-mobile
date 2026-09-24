import { canRequestCancellation } from '../orderCancellation';

describe('canRequestCancellation', () => {
  const accepted = [
    'RECEIVED',
    'PREPARING',
    'OVEN',
    'BAKED',
    'READY',
    'DISPATCHED',
    'OUT_FOR_DELIVERY',
    'SERVED',
    'COMPLETED',
  ];

  it.each(accepted)('allows %s when no request is pending', (status) => {
    expect(canRequestCancellation(status, false)).toBe(true);
  });

  it.each(['CANCELLED', 'DELIVERED', 'PENDING'])('rejects %s', (status) => {
    expect(canRequestCancellation(status, false)).toBe(false);
  });

  it('rejects a second request while one is pending', () => {
    expect(canRequestCancellation('PREPARING', true)).toBe(false);
  });
});
