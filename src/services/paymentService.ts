/**
 * Payment Service
 * Handles Razorpay & online payment integration for customer app
 */

import { paymentApi } from './api';
import { PaymentInitResponse, PaymentVerifyRequest } from '../types';
import { analytics } from './observability';

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  prefill: {
    name: string;
    email: string;
    contact: string;
  };
  theme: {
    color: string;
  };
}

interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

export const initiatePayment = async (data: {
  orderId: string;
  amount: number;
  customerId: string;
  customerEmail: string;
  customerPhone: string;
  storeId: string;
}): Promise<PaymentInitResponse> => {
  try {
    const response = await paymentApi.initiate(data);
    return response;
  } catch (error) {
    console.error('Payment initiation failed:', error);
    throw error;
  }
};

export const openRazorpayCheckout = async (
  options: RazorpayOptions
): Promise<RazorpayResponse> => {
  return await openNativeCheckout(options);
};

const openNativeCheckout = async (
  options: RazorpayOptions
): Promise<RazorpayResponse> => {
  try {
    let RazorpayCheckout: any = null;
    try {
      RazorpayCheckout = require('react-native-razorpay').default;
    } catch {
      // SDK not installed or simulator mock mode
    }
    if (!RazorpayCheckout) {
      throw new Error('Native payment SDK (react-native-razorpay) is not available in this environment');
    }

    const response = await RazorpayCheckout.open(options);
    return {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    };
  } catch (error: any) {
    console.error('Razorpay native checkout error:', error);
    if (error.code === 0) {
      throw new Error('Payment cancelled');
    }
    throw error;
  }
};

export const verifyPayment = async (data: PaymentVerifyRequest): Promise<boolean> => {
  try {
    const response = await paymentApi.verify(data);
    const status = response.status as string;
    return status === 'SUCCESS' || status === 'PAID' || status === 'INITIATED';
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
};

export const processPayment = async (params: {
  orderId: string;
  amount: number;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  storeId: string;
}): Promise<{ success: boolean; paymentId?: string }> => {
  try {
    const initResponse = await initiatePayment({
      orderId: params.orderId,
      amount: params.amount,
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      storeId: params.storeId,
    });

    const razorpayOptions: RazorpayOptions = {
      key: initResponse.razorpayKeyId || '',
      amount: initResponse.amount,
      currency: initResponse.currency || 'EUR',
      name: 'MaSoVa',
      description: `Order #${params.orderId}`,
      order_id: initResponse.razorpayOrderId || '',
      prefill: {
        name: params.customerName,
        email: params.customerEmail,
        contact: params.customerPhone,
      },
      theme: {
        color: '#E53E3E',
      },
    };

    const paymentResponse = await openRazorpayCheckout(razorpayOptions);

    const isVerified = await verifyPayment({
      orderId: params.orderId,
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature,
    });

    if (isVerified) {
      analytics.track('payment.success', {
        orderId: params.orderId,
        transactionId: paymentResponse.razorpay_payment_id,
        paymentMethod: 'ONLINE',
      });
      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
      };
    } else {
      analytics.track('payment.fail', {
        orderId: params.orderId,
        reason: 'Payment verification failed',
      });
      throw new Error('Payment verification failed');
    }
  } catch (error: any) {
    analytics.track('payment.fail', {
      orderId: params.orderId,
      reason: error?.message || 'Payment processing failed',
    });
    console.error('Payment process failed:', error);
    throw error;
  }
};

export const PaymentService = {
  initiate: initiatePayment,
  openCheckout: openRazorpayCheckout,
  verify: verifyPayment,
  process: processPayment,
};

export default PaymentService;
