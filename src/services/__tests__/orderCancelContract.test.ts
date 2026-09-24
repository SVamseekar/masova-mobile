import httpClient from '../http/client';
import { orderApi } from '../api/orderApi';

jest.mock('../http/client', () => ({
  __esModule: true,
  default: {
    get: jest.fn(),
    post: jest.fn(),
    patch: jest.fn(),
    delete: jest.fn(),
  },
}));

/**
 * Commerce customer cancel contract.
 * POST /api/orders/{orderId}/cancel-request — optional JSON key `reason`.
 * DELETE /api/orders/{orderId} is staff-only and is not this call.
 */
describe('commerce customer cancel contract', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (httpClient.post as jest.Mock).mockResolvedValue({
      data: { id: 'ord_100', status: 'PREPARING', cancellationRequested: true },
    });
  });

  it('posts /orders/{id}/cancel-request and does not DELETE /orders/{id}', async () => {
    await orderApi.cancel('ord_100', 'Changed mind');
    await orderApi.cancel('ord_100');

    expect(httpClient.post).toHaveBeenNthCalledWith(1, '/orders/ord_100/cancel-request', {
      reason: 'Changed mind',
    });
    expect(httpClient.post).toHaveBeenNthCalledWith(2, '/orders/ord_100/cancel-request', {});
    expect(httpClient.delete).not.toHaveBeenCalled();
  });

  it('sends reason only when the caller sets it', async () => {
    await orderApi.cancel('ord_100', 'Changed mind');
    const withReason = (httpClient.post as jest.Mock).mock.calls[0][1];
    expect(Object.keys(withReason)).toEqual(['reason']);

    await orderApi.cancel('ord_100');
    const withoutReason = (httpClient.post as jest.Mock).mock.calls[1][1];
    expect(withoutReason).not.toHaveProperty('reason');
  });
});
