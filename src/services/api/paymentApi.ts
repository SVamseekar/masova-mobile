import httpClient from '../http/client';
import { PaymentInitRequest, PaymentInitResponse, PaymentVerifyRequest, PaymentStatus } from '../../types';

export interface PaymentTransactionResponse {
  transactionId: string;
  orderId: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  amount: number;
  status: PaymentStatus;
  currency: string;
  stripeClientSecret?: string;
  stripePublishableKey?: string;
  razorpayKeyId?: string;
}

export const paymentApi = {
  initiate: async (params: PaymentInitRequest): Promise<PaymentInitResponse> => {
    const payload = {
      ...params,
      amount: typeof params.amount === 'number' ? params.amount.toFixed(2) : params.amount,
    };
    const response = await httpClient.post<PaymentInitResponse>('/payments/initiate', payload);
    return response.data;
  },

  verify: async (params: PaymentVerifyRequest): Promise<PaymentTransactionResponse> => {
    const response = await httpClient.post<PaymentTransactionResponse>('/payments/verify', params);
    return response.data;
  },

  getByOrderId: async (orderId: string): Promise<PaymentTransactionResponse> => {
    const response = await httpClient.get<PaymentTransactionResponse>(`/payments?orderId=${encodeURIComponent(orderId)}`);
    return response.data;
  },
};

export default paymentApi;
