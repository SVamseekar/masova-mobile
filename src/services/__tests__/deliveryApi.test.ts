import httpClient from '../http/client';
import { deliveryApi } from '../api/deliveryApi';

jest.mock('../http/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
  httpClient: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

describe('deliveryApi Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('track', () => {
    it('fetches delivery tracking by orderId', async () => {
      const mockTrack = { orderId: 'ord_1', status: 'IN_TRANSIT' };
      (httpClient.get as jest.Mock).mockResolvedValue({ data: mockTrack });

      const res = await deliveryApi.track('ord_1');

      expect(httpClient.get).toHaveBeenCalledWith('/delivery/track/ord_1');
      expect(res).toEqual(mockTrack);
    });
  });

  describe('generateOtp & verifyOtp', () => {
    it('generateOtp posts to /delivery/{orderId}/otp', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { otp: '123456', expiresAt: '2026-08-10T12:00:00Z' } });

      const res = await deliveryApi.generateOtp('ord_1');

      expect(httpClient.post).toHaveBeenCalledWith('/delivery/ord_1/otp');
      expect(res.otp).toBe('123456');
    });

    it('verifyOtp posts orderId and otp to /delivery/verify', async () => {
      (httpClient.post as jest.Mock).mockResolvedValue({ data: { success: true } });

      const res = await deliveryApi.verifyOtp('ord_1', '123456');

      expect(httpClient.post).toHaveBeenCalledWith('/delivery/verify', { orderId: 'ord_1', otp: '123456' });
      expect(res.success).toBe(true);
    });
  });

  describe('checkDeliveryZone', () => {
    it('calls /delivery/zones and resolves inZone properly', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({
        data: { isWithinDeliveryZone: true, zoneName: 'HiTech City', distanceKm: 2.1 },
      });

      const res = await deliveryApi.checkDeliveryZone('DOM001', 17.44, 78.38);

      expect(httpClient.get).toHaveBeenCalledWith('/delivery/zones?storeId=DOM001&lat=17.44&lng=78.38&check=true');
      expect(res.inZone).toBe(true);
      expect(res.zoneName).toBe('HiTech City');
    });

    it('evaluates inZone false when isWithinDeliveryZone is false', async () => {
      (httpClient.get as jest.Mock).mockResolvedValue({
        data: { isWithinDeliveryZone: false },
      });

      const res = await deliveryApi.checkDeliveryZone('DOM001', 17.1, 78.1);
      expect(res.inZone).toBe(false);
    });
  });
});
