/**
 * MaSoVa Mobile Type Definitions
 * Matches backend DTOs
 */

// =============================================================================
// USER & AUTH
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  phone?: string;
  role: 'CUSTOMER' | 'STAFF' | 'MANAGER' | 'DRIVER';
  profilePicture?: string;
  storeId?: string;
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

export interface LoyaltyInfo {
  totalPoints: number;
  pointsEarned: number;
  pointsRedeemed: number;
  tier: 'BRONZE' | 'SILVER' | 'GOLD' | 'PLATINUM';
  tierExpiryDate?: string;
  lastPointsUpdate?: string;
  pointHistory?: PointTransaction[];
}

export interface PointTransaction {
  id: string;
  points: number;
  type: 'EARNED' | 'REDEEMED' | 'EXPIRED' | 'BONUS';
  description: string;
  orderId?: string;
  timestamp: string;
}

export interface OrderStats {
  totalOrders: number;
  completedOrders: number;
  cancelledOrders: number;
  totalSpent: number;
  averageOrderValue: number;
  favoriteOrderType?: string;
}

export interface CustomerPreferences {
  allergenAlerts?: string[];
  dietaryRestrictions?: string[];
  cuisinePreferences?: string[];
}

export interface Customer {
  id: string;
  userId: string;
  name: string;
  email: string;
  phone?: string;
  profilePicture?: string;
  addresses: DeliveryAddress[];
  loyaltyInfo?: LoyaltyInfo;
  orderStats?: OrderStats;
  isActive: boolean;
  preferences?: CustomerPreferences;
}

export interface DeliveryAddress {
  id: string;
  label: string;
  // Backend uses addressLine1, but we also support 'street' for backwards compatibility
  addressLine1?: string;
  street?: string; // Alias for addressLine1
  addressLine2?: string;
  city: string;
  state?: string;
  postalCode?: string;
  zipCode?: string; // Alias for postalCode
  country?: string;
  latitude?: number;
  longitude?: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  landmark?: string;
  instructions?: string; // Alias for landmark
  isDefault?: boolean;
  createdAt?: string;
}

// =============================================================================
// MENU & PRODUCTS
// =============================================================================

export type Cuisine =
  | 'SOUTH_INDIAN'
  | 'NORTH_INDIAN'
  | 'INDO_CHINESE'
  | 'ITALIAN'
  | 'CONTINENTAL'
  | 'BEVERAGES'
  | 'CHINESE'
  | 'AMERICAN'
  | 'DESSERTS';

export type Category =
  // South Indian
  | 'DOSA'
  | 'IDLY_VADA'
  | 'SOUTH_INDIAN_MEALS'
  | 'RICE_VARIETIES'
  | 'BIRYANI'
  // North Indian
  | 'CURRY_GRAVY'
  | 'BREAD_ROTI'
  | 'TANDOOR'
  | 'NORTH_INDIAN_MEALS'
  | 'DAL_DISHES'
  | 'CHAPATI_ROTI'
  | 'NAAN_KULCHA'
  // Indo-Chinese
  | 'NOODLES'
  | 'FRIED_RICE'
  | 'MANCHURIAN'
  | 'MOMOS'
  // Chinese
  | 'SOUP'
  | 'STARTERS'
  | 'MAIN_COURSE'
  | 'DIMSUM'
  // Italian
  | 'PIZZA'
  | 'PASTA'
  | 'RISOTTO'
  | 'SALAD'
  // American
  | 'BURGER'
  | 'SANDWICH'
  | 'FRIES_SIDES'
  | 'HOT_DOGS'
  | 'SIDES'
  // Continental
  | 'GRILLED'
  | 'BAKED'
  | 'SIZZLERS'
  // Beverages
  | 'HOT_BEVERAGES'
  | 'COLD_BEVERAGES'
  | 'HOT_DRINKS'
  | 'COLD_DRINKS'
  | 'TEA_CHAI'
  | 'JUICES'
  | 'SHAKES'
  // Desserts
  | 'ICE_CREAM'
  | 'CAKES'
  | 'INDIAN_SWEETS'
  | 'PASTRIES'
  | 'COOKIES_BROWNIES'
  | 'DESSERT_SPECIALS'
  // Legacy categories for backwards compatibility
  | 'CURRY'
  | 'RICE'
  | 'BEVERAGE'
  | 'DESSERT'
  | 'APPETIZER';

export type DietaryType = 'VEGETARIAN' | 'VEGAN' | 'NON_VEGETARIAN' | 'JAIN' | 'HALAL' | 'GLUTEN_FREE' | 'DAIRY_FREE';

export type SpiceLevel = 'MILD' | 'MEDIUM' | 'HOT' | 'EXTRA_HOT';

export interface MenuItem {
  id: string;
  name: string;
  description: string;
  cuisine: Cuisine;
  category: Category;
  basePrice: number;
  discountedPrice?: number;
  variants: MenuVariant[];
  customizations: MenuCustomization[];
  dietaryInfo: DietaryType[];
  spiceLevel?: SpiceLevel;
  nutritionalInfo?: NutritionalInfo;
  imageUrl: string;
  isAvailable: boolean;
  preparationTime: number;
  isRecommended: boolean;
  rating?: number;
  reviewCount?: number;
  allergens?: string[];
  allergensDeclared?: boolean;
}

export interface MenuVariant {
  id: string;
  name: string;
  priceModifier: number;
}

export interface MenuCustomization {
  id: string;
  name: string;
  required: boolean;
  maxSelections: number;
  options: CustomizationOption[];
}

export interface CustomizationOption {
  id: string;
  name: string;
  priceModifier: number;
}

export interface NutritionalInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

// =============================================================================
// CART
// =============================================================================

export interface CartItem {
  id: string;
  menuItem: MenuItem;
  quantity: number;
  selectedVariant?: MenuVariant;
  selectedCustomizations: SelectedCustomization[];
  specialInstructions?: string;
  totalPrice: number;
}

export interface SelectedCustomization {
  customizationId: string;
  customizationName: string;
  selectedOptions: CustomizationOption[];
}

export interface Cart {
  items: CartItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  discount: number;
  total: number;
  appliedCoupon?: Coupon;
}

export interface Coupon {
  code: string;
  discountType: 'PERCENTAGE' | 'FIXED';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
}

// =============================================================================
// ORDERS
// =============================================================================

export type OrderStatus =
  | 'PENDING'
  | 'RECEIVED'
  | 'PREPARING'
  | 'OVEN'
  | 'BAKED'
  | 'READY'
  | 'DISPATCHED'
  | 'DELIVERED'
  | 'COMPLETED'
  | 'SERVED'
  | 'CANCELLED';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED';

export type PaymentMethod = 'ONLINE' | 'CASH' | 'CARD' | 'UPI';

export type OrderType = 'DINE_IN' | 'DELIVERY' | 'TAKEAWAY' | 'COLLECTION';

export interface Order {
  id: string;
  orderNumber: string;
  customerId: string;
  storeId: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  tax: number;
  total: number;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  preparationTime: number;
  estimatedDeliveryTime?: string;
  deliveryAddress?: DeliveryAddress;
  assignedDriverId?: string;
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  deliveryOtp?: string;
}

export interface OrderItem {
  id: string;
  menuItemId: string;
  name: string;
  quantity: number;
  price: number;
  variant?: string;
  customizations: string[];
  specialInstructions?: string;
}

export interface CreateOrderRequest {
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
    state?: string;
    zipCode?: string;
    coordinates?: { latitude: number; longitude: number };
    instructions?: string;
  };
  paymentMethod: PaymentMethod;
  orderType: OrderType;
  customerId?: string;
  storeId: string;
}

// =============================================================================
// DELIVERY TRACKING
// =============================================================================

export type DeliveryStatus =
  | 'PENDING_ASSIGNMENT'
  | 'ASSIGNED'
  | 'ACCEPTED'
  | 'PICKED_UP'
  | 'IN_TRANSIT'
  | 'ARRIVED'
  | 'DELIVERED'
  | 'CANCELLED';

export interface DeliveryTracking {
  id: string;
  orderId: string;
  driverId: string;
  driverName: string;
  driverPhone: string;
  driverPhoto?: string;
  status: DeliveryStatus;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
  restaurantLocation?: {
    latitude: number;
    longitude: number;
  };
  estimatedDeliveryMinutes: number;
  distanceKm: number;
  assignedAt: string;
  acceptedAt?: string;
  pickedUpAt?: string;
  deliveredAt?: string;
  // Convenience flat fields (some backends return these directly)
  driverLat?: number;
  driverLon?: number;
  restaurantLat?: number;
  restaurantLon?: number;
}

// =============================================================================
// PAYMENTS
// =============================================================================

export interface PaymentInitRequest {
  orderId: string;
  amount: number;
  customerEmail: string;
  customerPhone: string;
}

export interface PaymentInitResponse {
  razorpayOrderId: string;
  razorpayKeyId: string;
  amount: number;
  currency: string;
}

export interface PaymentVerifyRequest {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

// =============================================================================
// STORE
// =============================================================================

export interface StoreAddress {
  street: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
  latitude?: number;
  longitude?: number;
}

export interface Store {
  id: string;
  storeCode?: string;  // DOM001, DOM002, etc. - used for menu filtering
  name: string;
  address: StoreAddress;
  phone: string;
  email: string;
  isOpen: boolean;
  openingTime: string;
  closingTime: string;
  deliveryRadius: number;
  minimumOrderAmount: number;
  deliveryFee: number;
  coordinates?: {
    latitude: number;
    longitude: number;
  };
}

// =============================================================================
// REVIEWS
// =============================================================================

export interface Review {
  id: string;
  orderId: string;
  customerId: string;
  customerName: string;
  rating: number;
  comment?: string;
  foodRating?: number;
  deliveryRating?: number;
  createdAt: string;
  managerResponse?: string;
  managerResponseAt?: string;
}

// =============================================================================
// NOTIFICATIONS
// =============================================================================

export type NotificationType =
  | 'ORDER_UPDATE'
  | 'PROMOTION'
  | 'SYSTEM'
  | 'DELIVERY'
  | 'PAYMENT_SUCCESS'
  | 'PAYMENT_FAILED'
  | 'DRIVER_ASSIGNED'
  | 'DRIVER_NEARBY'
  | 'DRIVER_ARRIVED'
  | 'DELIVERY_OTP';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  body: string;
  type: NotificationType;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
}

// =============================================================================
// GUEST CHECKOUT
// =============================================================================

export interface GuestInfo {
  name: string;
  email: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  deliveryInstructions?: string;
  saveAddress?: boolean;
}

// =============================================================================
// NAVIGATION TYPES
// =============================================================================

export type RootStackParamList = {
  Main: undefined;
  Auth: undefined;
  ItemDetail: { itemId: string };
  CheckoutOptions: undefined;
  GuestCheckout: { returnFromAuth?: boolean };
  Checkout: { guestInfo?: GuestInfo };
  PaymentSuccess: { orderId: string };
  PaymentFailed: { orderId: string; error?: string };
  OrderTracking: { orderId: string };
  OrderHistory: undefined;
  OrderDetail: { orderId: string };
  OrderReview: { orderId: string };
  AddressManagement: undefined;
  AddAddress: { address?: DeliveryAddress };
  Search: undefined;
  Notifications: undefined;
  Chat: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Search: undefined;
  Orders: undefined;
  Saved: undefined;
  Account: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  OTPVerification: { phone: string };
};
