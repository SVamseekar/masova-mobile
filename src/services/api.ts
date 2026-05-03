/**
 * MaSoVa Mobile API Service
 * Configured for MaSoVa Backend via API Gateway (port 8080)
 */

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// =============================================================================
// CONFIGURATION
// =============================================================================

// For iOS Simulator, localhost works. For Android Emulator, use 10.0.2.2
// For physical devices, use your machine's IP address
const DELL_IP = '192.168.50.88';

const getBaseUrl = () => {
  if (__DEV__) {
    return `http://${DELL_IP}:8080/api`; // Dell backend via LAN
  }
  return 'https://api.masova.com/api';
};

const BASE_URL = getBaseUrl();

// Token storage keys
const AUTH_TOKEN_KEY = 'masova_auth_token';
const REFRESH_TOKEN_KEY = 'masova_refresh_token';
const USER_KEY = 'masova_user';
const SELECTED_STORE_KEY = '@masova_selected_store';

// =============================================================================
// AXIOS INSTANCE
// =============================================================================

const api: AxiosInstance = axios.create({
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Request interceptor - add auth token and store ID
api.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    // Add selected store ID header for store-specific API calls
    // Use storeCode (DOM001, etc.) as that matches menu_items.storeId in DB
    const storedData = await AsyncStorage.getItem(SELECTED_STORE_KEY);
    if (storedData && config.headers) {
      try {
        const store = JSON.parse(storedData);
        // Prefer storeCode over id for menu filtering
        const storeIdentifier = store?.storeCode || store?.id;
        if (storeIdentifier) {
          config.headers['X-Selected-Store-Id'] = storeIdentifier;
          config.headers['X-User-Type'] = 'CUSTOMER';
        }
      } catch (e) {
        // Ignore parse errors
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If 401 and we haven't retried yet, try to refresh token
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
        if (refreshToken) {
          const response = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
          const { token } = response.data;

          await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);

          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${token}`;
          }
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed - clear auth and redirect to login
        await clearAuthData();
      }
    }

    return Promise.reject(error);
  }
);

// =============================================================================
// AUTH HELPERS
// =============================================================================

const saveAuthData = async (token: string | undefined, refreshToken: string | undefined, user: object | undefined) => {
  // Validate that we have the required data
  if (!token || !refreshToken || !user) {
    console.error('saveAuthData: Missing required data', {
      hasToken: !!token,
      hasRefreshToken: !!refreshToken,
      hasUser: !!user
    });
    throw new Error('Cannot save auth data: missing token, refreshToken, or user');
  }

  await AsyncStorage.multiSet([
    [AUTH_TOKEN_KEY, token],
    [REFRESH_TOKEN_KEY, refreshToken],
    [USER_KEY, JSON.stringify(user)],
  ]);
};

const clearAuthData = async () => {
  await AsyncStorage.multiRemove([AUTH_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY]);
};

const getStoredUser = async () => {
  const userJson = await AsyncStorage.getItem(USER_KEY);
  return userJson ? JSON.parse(userJson) : null;
};

// =============================================================================
// AUTH API
// Routes: /api/users/* (mapped to user-service:8081)
// =============================================================================

export const authApi = {
  /**
   * Login with email and password
   * POST /api/auth/login (Public, rate limited: 10 req/min)
   */
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    console.log('Login response:', JSON.stringify(response.data, null, 2));

    // Backend returns accessToken, not token
    const { accessToken, refreshToken, user } = response.data;

    // Validate response has required fields
    if (!accessToken || !refreshToken || !user) {
      console.error('Login response missing required fields:', {
        hasToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        hasUser: !!user,
        response: response.data
      });
      throw new Error('Invalid login response: missing required authentication data');
    }

    await saveAuthData(accessToken, refreshToken, user);
    return response.data;
  },

  /**
   * Register new customer
   * POST /api/auth/register (Public, rate limited: 5 req/min)
   */
  register: async (data: { name: string; email: string; phone: string; password: string }) => {
    const response = await api.post('/auth/register', {
      ...data,
      type: 'CUSTOMER',
    });
    return response.data;
  },

  /**
   * Refresh JWT token
   * POST /api/auth/refresh (Public, rate limited: 20 req/min)
   */
  refreshToken: async () => {
    const refreshToken = await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    if (!refreshToken) throw new Error('No refresh token');

    const response = await api.post('/auth/refresh', { refreshToken });
    const { token } = response.data;
    await AsyncStorage.setItem(AUTH_TOKEN_KEY, token);
    return response.data;
  },

  /**
   * Logout user
   * POST /api/auth/logout (Protected)
   */
  logout: async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      await clearAuthData();
    }
  },

  /**
   * Get current user from storage
   */
  getCurrentUser: getStoredUser,

  /**
   * Sign in or register via Google ID token
   * POST /api/auth/google (Public)
   * Call this after obtaining a Google idToken from @react-native-google-signin/google-signin
   */
  loginWithGoogle: async (idToken: string) => {
    const response = await api.post('/auth/google', { idToken });
    const { accessToken, refreshToken, user } = response.data;
    if (!accessToken || !refreshToken || !user) {
      throw new Error('Invalid Google login response: missing required authentication data');
    }
    await saveAuthData(accessToken, refreshToken, user);
    return response.data;
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated: async () => {
    const token = await AsyncStorage.getItem(AUTH_TOKEN_KEY);
    return !!token;
  },

  /**
   * Validate staff PIN (for POS)
   * POST /api/users/validate-pin (Protected)
   */
  validatePin: async (pin: string, storeId: string) => {
    const response = await api.post('/users/validate-pin', { pin, storeId });
    return response.data;
  },
};

// =============================================================================
// MENU API
// Routes: /api/menu/* (mapped to menu-service:8082)
// =============================================================================

export const menuApi = {
  /**
   * Get all menu items
   * GET /api/menu/public (Public)
   */
  getAll: async (params?: {
    category?: string;
    cuisine?: string;
    dietary?: string;
    page?: number;
    size?: number;
  }) => {
    const response = await api.get('/menu/public', { params });
    return response.data;
  },

  /**
   * Get menu item by ID
   * GET /api/menu/public/:id (Public)
   */
  getById: async (id: string) => {
    const response = await api.get(`/menu/public/${id}`);
    return response.data;
  },

  /**
   * Get items by category
   * GET /api/menu/category/:category (Public)
   */
  getByCategory: async (category: string) => {
    const response = await api.get(`/menu/category/${category}`);
    return response.data;
  },

  /**
   * Get items by cuisine
   * GET /api/menu/cuisine/:cuisine (Public)
   */
  getByCuisine: async (cuisine: string) => {
    const response = await api.get(`/menu/cuisine/${cuisine}`);
    return response.data;
  },

  /**
   * Get recommended items
   * GET /api/menu/public/recommended (Public)
   */
  getRecommended: async () => {
    const response = await api.get('/menu/public/recommended');
    return response.data;
  },

  /**
   * Search menu items
   * GET /api/menu/public/search (Public)
   */
  search: async (query: string) => {
    const response = await api.get('/menu/public/search', { params: { q: query } });
    return response.data;
  },

  /**
   * Get all items (alternative endpoint)
   * GET /api/menu/items (Public)
   */
  getItems: async () => {
    const response = await api.get('/menu/items');
    return response.data;
  },
};

// =============================================================================
// ORDER API
// Routes: /api/orders/* (mapped to order-service:8083)
// =============================================================================

export const orderApi = {
  /**
   * Create new order
   * POST /api/orders (Protected, rate limited: 200 req/min)
   */
  create: async (data: {
    items: Array<{
      menuItemId: string;
      quantity: number;
      variant?: string;
      customizations?: string[];
      specialInstructions?: string;
    }>;
    deliveryAddress?: {
      street: string;
      city: string;
      coordinates?: { latitude: number; longitude: number };
      instructions?: string;
    };
    paymentMethod: 'ONLINE' | 'CASH' | 'CARD' | 'UPI';
    orderType: 'DELIVERY' | 'TAKEAWAY' | 'DINE_IN';
    customerId?: string;
    storeId: string;
  }) => {
    const response = await api.post('/orders', data);
    return response.data;
  },

  /**
   * Get order by ID
   * GET /api/orders/:orderId (Protected)
   */
  getById: async (orderId: string) => {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Track order (Public - for email links)
   * GET /api/orders/track/:orderId (Public, rate limited: 100 req/min)
   */
  track: async (orderId: string) => {
    const response = await api.get(`/orders/track/${orderId}`);
    return response.data;
  },

  /**
   * Get customer's orders
   * GET /api/orders/customer/:customerId (Protected)
   */
  getCustomerOrders: async (customerId: string, params?: { page?: number; size?: number }) => {
    const response = await api.get(`/orders/customer/${customerId}`, { params });
    return response.data;
  },

  /**
   * Get orders by status
   * GET /api/orders/status/:status (Protected)
   */
  getByStatus: async (status: string) => {
    const response = await api.get(`/orders/status/${status}`);
    return response.data;
  },

  /**
   * Cancel order
   * DELETE /api/orders/:orderId (Protected)
   */
  cancel: async (orderId: string) => {
    const response = await api.delete(`/orders/${orderId}`);
    return response.data;
  },

  /**
   * Update order status (Staff only)
   * PATCH /api/orders/:orderId/status (Protected)
   */
  updateStatus: async (orderId: string, status: string) => {
    const response = await api.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  },
};

// =============================================================================
// PAYMENT API
// Routes: /api/payments/* (mapped to payment-service:8086)
// =============================================================================

export const paymentApi = {
  /**
   * Initiate Razorpay payment
   * POST /api/payments/initiate (Protected, rate limited: 50 req/min)
   */
  initiate: async (data: {
    orderId: string;
    amount: number;
    customerId: string;
    customerEmail: string;
    customerPhone: string;
    storeId: string;
  }) => {
    const response = await api.post('/payments/initiate', data);
    return response.data;
  },

  /**
   * Verify Razorpay payment
   * POST /api/payments/verify (Protected)
   */
  verify: async (data: {
    orderId: string;
    razorpayOrderId: string;
    razorpayPaymentId: string;
    razorpaySignature: string;
  }) => {
    const response = await api.post('/payments/verify', data);
    return response.data;
  },

  /**
   * Record cash payment (POS)
   * POST /api/payments/cash (Protected)
   */
  recordCash: async (data: { orderId: string; amount: number }) => {
    const response = await api.post('/payments/cash', data);
    return response.data;
  },

  /**
   * Get transaction by ID
   * GET /api/payments/:transactionId (Protected)
   */
  getById: async (transactionId: string) => {
    const response = await api.get(`/payments/${transactionId}`);
    return response.data;
  },

  /**
   * Get payment by order ID
   * GET /api/payments/order/:orderId (Protected)
   */
  getByOrder: async (orderId: string) => {
    const response = await api.get(`/payments/order/${orderId}`);
    return response.data;
  },
};

// =============================================================================
// DELIVERY API
// Routes: /api/delivery/* (mapped to delivery-service:8090)
// =============================================================================

export const deliveryApi = {
  /**
   * Get delivery tracking info
   * GET /api/delivery/track/:orderId (Protected, rate limited: 150 req/min)
   */
  track: async (orderId: string) => {
    const response = await api.get(`/delivery/track/${orderId}`);
    return response.data;
  },

  /**
   * Get estimated delivery time
   * GET /api/delivery/eta/:orderId (Protected)
   */
  getEta: async (orderId: string) => {
    const response = await api.get(`/delivery/eta/${orderId}`);
    return response.data;
  },

  /**
   * Generate delivery OTP
   * POST /api/delivery/:orderId/generate-otp (Protected)
   */
  generateOtp: async (orderId: string) => {
    const response = await api.post(`/delivery/${orderId}/generate-otp`);
    return response.data;
  },

  /**
   * Verify delivery with OTP
   * POST /api/delivery/verify-otp (Protected)
   */
  verifyOtp: async (data: { orderId: string; otp: string }) => {
    const response = await api.post('/delivery/verify-otp', data);
    return response.data;
  },
};

// =============================================================================
// CUSTOMER API
// Routes: /api/customers/* (mapped to customer-service:8091)
// =============================================================================

export const customerApi = {
  /**
   * Get or create customer (for checkout)
   * POST /api/customers/get-or-create (Public, rate limited: 50 req/min)
   */
  getOrCreate: async (data: { userId: string; email: string; phone: string; name: string }) => {
    const response = await api.post('/customers/get-or-create', data);
    return response.data;
  },

  /**
   * Get customer by ID
   * GET /api/customers/:customerId (Protected, rate limited: 100 req/min)
   */
  getById: async (customerId: string) => {
    const response = await api.get(`/customers/${customerId}`);
    return response.data;
  },

  /**
   * Get customer by user ID
   * GET /api/customers/user/:userId (Protected)
   */
  getByUserId: async (userId: string) => {
    const response = await api.get(`/customers/user/${userId}`);
    return response.data;
  },

  /**
   * Get customer by email
   * GET /api/customers/email/:email (Protected)
   */
  getByEmail: async (email: string) => {
    const response = await api.get(`/customers/email/${encodeURIComponent(email)}`);
    return response.data;
  },

  /**
   * Update customer addresses (deprecated - use addAddress, updateAddress, removeAddress instead)
   * PATCH /api/customers/:customerId/addresses (Protected)
   */
  updateAddresses: async (customerId: string, addresses: object[]) => {
    const response = await api.patch(`/customers/${customerId}/addresses`, { addresses });
    return response.data;
  },

  /**
   * Add a new address
   * POST /api/customers/:customerId/addresses (Protected)
   */
  addAddress: async (customerId: string, address: {
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    landmark?: string;
    isDefault?: boolean;
  }) => {
    const response = await api.post(`/customers/${customerId}/addresses`, {
      ...address,
      country: address.country || 'India',
    });
    return response.data;
  },

  /**
   * Update an existing address
   * PATCH /api/customers/:customerId/addresses/:addressId (Protected)
   */
  updateAddress: async (customerId: string, addressId: string, address: {
    label?: string;
    addressLine1?: string;
    addressLine2?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
    latitude?: number;
    longitude?: number;
    landmark?: string;
    isDefault?: boolean;
  }) => {
    const response = await api.patch(`/customers/${customerId}/addresses/${addressId}`, address);
    return response.data;
  },

  /**
   * Remove an address
   * DELETE /api/customers/:customerId/addresses/:addressId (Protected)
   */
  removeAddress: async (customerId: string, addressId: string) => {
    const response = await api.delete(`/customers/${customerId}/addresses/${addressId}`);
    return response.data;
  },

  /**
   * Set an address as default
   * PATCH /api/customers/:customerId/addresses/:addressId/set-default (Protected)
   */
  setDefaultAddress: async (customerId: string, addressId: string) => {
    const response = await api.patch(`/customers/${customerId}/addresses/${addressId}/set-default`);
    return response.data;
  },

  /**
   * Update customer profile
   * PATCH /api/customers/:customerId (Protected)
   */
  update: async (customerId: string, data: object) => {
    const response = await api.patch(`/customers/${customerId}`, data);
    return response.data;
  },
};

// =============================================================================
// NOTIFICATION API
// Routes: /api/notifications/* (mapped to notification-service:8092)
// =============================================================================

export const notificationApi = {
  /**
   * Get all notifications for user
   * GET /api/notifications/user/:userId (Protected, rate limited: 100 req/min)
   */
  getAll: async (userId: string) => {
    const response = await api.get(`/notifications/user/${userId}`);
    return response.data;
  },

  /**
   * Get unread notifications
   * GET /api/notifications/user/:userId/unread (Protected)
   */
  getUnread: async (userId: string) => {
    const response = await api.get(`/notifications/user/${userId}/unread`);
    return response.data;
  },

  /**
   * Mark notification as read
   * PATCH /api/notifications/:notificationId/read (Protected)
   */
  markAsRead: async (notificationId: string) => {
    const response = await api.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  /**
   * Mark all notifications as read
   * PATCH /api/notifications/user/:userId/read-all (Protected)
   */
  markAllRead: async (userId: string) => {
    const response = await api.patch(`/notifications/user/${userId}/read-all`);
    return response.data;
  },

  /**
   * Delete notification
   * DELETE /api/notifications/:notificationId (Protected)
   */
  delete: async (notificationId: string) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  /**
   * Update device token for push notifications
   * POST /api/notifications/device-token (Protected)
   */
  updateDeviceToken: async (data: { userId: string; token: string; platform: 'ios' | 'android' }) => {
    const response = await api.post('/notifications/device-token', data);
    return response.data;
  },
};

// =============================================================================
// REVIEW API
// Routes: /api/reviews/* (mapped to review-service:8089)
// =============================================================================

export const reviewApi = {
  /**
   * Get public review for order
   * GET /api/reviews/public/:orderId (Public)
   */
  getByOrder: async (orderId: string) => {
    const response = await api.get(`/reviews/public/${orderId}`);
    return response.data;
  },

  /**
   * Create review
   * POST /api/reviews (Protected, rate limited: 60 req/min)
   */
  create: async (data: {
    orderId: string;
    rating: number;
    comment?: string;
    foodRating?: number;
    deliveryRating?: number;
  }) => {
    const response = await api.post('/reviews', data);
    return response.data;
  },

  /**
   * Get reviews by menu item
   * GET /api/reviews/public/item/:itemId (Public)
   */
  getByMenuItem: async (itemId: string) => {
    const response = await api.get(`/reviews/public/item/${itemId}`);
    return response.data;
  },
};

// =============================================================================
// STORE API
// Routes: /api/stores/* (mapped to user-service:8081)
// =============================================================================

export const storeApi = {
  /**
   * Get all stores (public info)
   * GET /api/stores/public (Public)
   */
  getAll: async () => {
    const response = await api.get('/stores/public');
    return response.data;
  },

  /**
   * Get store by ID
   * GET /api/stores/public/:storeId (Public)
   */
  getById: async (storeId: string) => {
    const response = await api.get(`/stores/public/${storeId}`);
    return response.data;
  },

  /**
   * Get nearest store
   * GET /api/stores/public/nearest (Public)
   */
  getNearest: async (latitude: number, longitude: number) => {
    const response = await api.get('/stores/public/nearest', {
      params: { latitude, longitude },
    });
    return response.data;
  },
};

// =============================================================================
// WEBSOCKET CONFIGURATION
// =============================================================================

export const websocketConfig = {
  // Order updates WebSocket
  ordersUrl: __DEV__
    ? Platform.OS === 'android'
      ? `ws://${DELL_IP}:8083/ws/orders`
      : `ws://${DELL_IP}:8083/ws/orders`
    : 'wss://api.masova.com/ws/orders',

  // Delivery tracking WebSocket
  deliveryUrl: __DEV__
    ? Platform.OS === 'android'
      ? `ws://${DELL_IP}:8090/ws/delivery`
      : `ws://${DELL_IP}:8090/ws/delivery`
    : 'wss://api.masova.com/ws/delivery',

  // STOMP topics
  topics: {
    storeOrders: (storeId: string) => `/topic/store/${storeId}/orders`,
    customerOrders: (customerId: string) => `/queue/customer/${customerId}/orders`,
    kitchenQueue: (storeId: string) => `/topic/store/${storeId}/kitchen`,
    deliveryTracking: (orderId: string) => `/topic/delivery/${orderId}`,
  },
};

// =============================================================================
// EXPORT DEFAULT AXIOS INSTANCE
// =============================================================================

export default api;
