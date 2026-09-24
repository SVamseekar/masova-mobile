import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useCancelOrder } from '../useOrderQueries';
import { orderApi } from '../../services/api';

jest.mock('../../services/api', () => ({
  orderApi: { cancel: jest.fn() },
  deliveryApi: { track: jest.fn() },
}));

function wrapper({ children }: { children: React.ReactNode }) {
  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}

let queryClient: QueryClient;

describe('useCancelOrder', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    queryClient = new QueryClient({
      defaultOptions: {
        mutations: { retry: false, gcTime: Infinity },
        queries: { retry: false, gcTime: Infinity },
      },
    });
  });

  afterEach(() => {
    queryClient.clear();
  });

  it('passes reason through to orderApi.cancel', async () => {
    (orderApi.cancel as jest.Mock).mockResolvedValue({
      id: 'ord_100',
      status: 'PREPARING',
      cancellationRequested: true,
    });

    const { result, unmount } = await renderHook(() => useCancelOrder(), { wrapper });

    await act(async () => {
      result.current.mutate({ orderId: 'ord_100', reason: 'Changed mind' });
    });

    await waitFor(() => {
      expect(orderApi.cancel).toHaveBeenCalledWith('ord_100', 'Changed mind');
    });
    await unmount();
  });
});
