/**
 * Payment Service
 * Handles Razorpay payment integration
 */

import { Platform } from 'react-native';
import { paymentApi } from './api';
import { PaymentInitResponse, PaymentVerifyRequest } from '../types';

/**
 * Payment options for Razorpay
 */
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

/**
 * Payment response from Razorpay
 */
interface RazorpayResponse {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
}

/**
 * Initialize payment with backend
 * This creates a Razorpay order ID on the backend
 */
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

/**
 * Open Razorpay payment modal
 * Uses native react-native-razorpay SDK for development builds
 */
export const openRazorpayCheckout = async (
  options: RazorpayOptions
): Promise<RazorpayResponse> => {
  // Always use native checkout since we have a development build with react-native-razorpay
  return await openNativeCheckout(options);
};

/**
 * Open native Razorpay checkout (for bare React Native)
 * Requires: npm install react-native-razorpay
 */
const openNativeCheckout = async (
  options: RazorpayOptions
): Promise<RazorpayResponse> => {
  try {
    // react-native-razorpay requires a native build (not compatible with Expo Go)
    // For Expo Go testing, payment will fall back to web checkout
    let RazorpayCheckout: any = null;
    try { RazorpayCheckout = require('react-native-razorpay').default; } catch { /* not available in Expo Go */ }
    if (!RazorpayCheckout) throw new Error('Native payment not available in Expo Go — use web checkout');

    const response = await RazorpayCheckout.open(options);
    return {
      razorpay_payment_id: response.razorpay_payment_id,
      razorpay_order_id: response.razorpay_order_id,
      razorpay_signature: response.razorpay_signature,
    };
  } catch (error: any) {
    console.error('Razorpay native checkout error:', error);
    if (error.code === 0) {
      // Payment cancelled by user
      throw new Error('Payment cancelled');
    }
    throw error;
  }
};

/**
 * Open web-based Razorpay checkout (for Expo)
 * Uses expo-web-browser to open Razorpay hosted checkout
 */
const openWebCheckout = async (
  options: RazorpayOptions
): Promise<RazorpayResponse> => {
  try {
    // For Expo, we'll use WebView or expo-web-browser
    // This is a simplified version - you'll need to implement a web handler
    throw new Error(
      'Web checkout not implemented. Please use bare React Native with react-native-razorpay.'
    );
  } catch (error) {
    console.error('Razorpay web checkout error:', error);
    throw error;
  }
};

/**
 * Verify payment with backend
 * Backend will verify the Razorpay signature
 */
export const verifyPayment = async (data: PaymentVerifyRequest): Promise<boolean> => {
  try {
    const response = await paymentApi.verify(data);
    // Backend returns status: 'SUCCESS' or 'FAILED', not a success boolean
    return response.status === 'SUCCESS';
  } catch (error) {
    console.error('Payment verification failed:', error);
    throw error;
  }
};

/**
 * Complete payment flow
 * 1. Initiate payment (get Razorpay order ID)
 * 2. Open Razorpay checkout
 * 3. Verify payment with backend
 */
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
    // Step 1: Initiate payment with backend
    const initResponse = await initiatePayment({
      orderId: params.orderId,
      amount: params.amount,
      customerId: params.customerId,
      customerEmail: params.customerEmail,
      customerPhone: params.customerPhone,
      storeId: params.storeId,
    });

    // Step 2: Open Razorpay checkout
    const razorpayOptions: RazorpayOptions = {
      key: initResponse.razorpayKeyId,
      amount: initResponse.amount,
      currency: initResponse.currency || 'INR',
      name: 'MaSoVa',
      description: `Order #${params.orderId}`,
      order_id: initResponse.razorpayOrderId,
      prefill: {
        name: params.customerName,
        email: params.customerEmail,
        contact: params.customerPhone,
      },
      theme: {
        color: '#E53E3E', // MaSoVa brand red
      },
    };

    const paymentResponse = await openRazorpayCheckout(razorpayOptions);

    // Step 3: Verify payment with backend
    const isVerified = await verifyPayment({
      orderId: params.orderId,
      razorpayOrderId: paymentResponse.razorpay_order_id,
      razorpayPaymentId: paymentResponse.razorpay_payment_id,
      razorpaySignature: paymentResponse.razorpay_signature,
    });

    if (isVerified) {
      return {
        success: true,
        paymentId: paymentResponse.razorpay_payment_id,
      };
    } else {
      throw new Error('Payment verification failed');
    }
  } catch (error) {
    console.error('Payment process failed:', error);
    throw error;
  }
};

/**
 * Payment service object
 */
export const PaymentService = {
  initiate: initiatePayment,
  openCheckout: openRazorpayCheckout,
  verify: verifyPayment,
  process: processPayment,
};

export default PaymentService;
