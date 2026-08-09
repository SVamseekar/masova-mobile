/**
 * Checkout Screen
 * Address selection, payment method, and order placement
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useStoreCurrency } from '../../hooks/useStoreCurrency';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Button, Card, Badge } from '../../components/ui';
import { RootStackParamList, DeliveryAddress, GuestInfo } from '../../types';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { useCreateOrder } from '../../hooks/useOrderQueries';
import { useSelectedStore } from '../../hooks/useSelectedStore';
import { toMajorUnits } from '../../utils/money';
import { calculateTaxMinor, taxLabel } from '../../utils/pricing';
import { Alert } from 'react-native';
import { PaymentService } from '../../services/paymentService';
import { useRoute, RouteProp } from '@react-navigation/native';
import { customerApi, deliveryApi } from '../../services/api';
import GuestPromptView from '../../components/GuestPromptView';
import { analytics } from '../../services/observability';
import { isFeatureEnabled } from '../../config/featureFlags';


type PaymentMethod = 'ONLINE' | 'CASH' | 'UPI';
type OrderType = 'DELIVERY' | 'TAKEAWAY';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'Checkout'>;

// Berlin Mitte demo store area (platform seed DOM001)
const BERLIN_DEMO_LAT = 52.5219;
const BERLIN_DEMO_LNG = 13.4132;

// Helper to convert backend address format to DeliveryAddress
// Backend may use snake_case (from MongoDB) or camelCase
const convertToDeliveryAddress = (addr: any): DeliveryAddress => {
  let lat = addr.latitude ?? addr.coordinates?.latitude;
  let lng = addr.longitude ?? addr.coordinates?.longitude;
  const city = (addr.city || '').toString();
  // Seeded EU customers often lack lat/lng — fill Berlin demo coords so zone checks work
  if ((lat == null || lng == null) && /berlin/i.test(city)) {
    lat = BERLIN_DEMO_LAT;
    lng = BERLIN_DEMO_LNG;
  }
  return {
    id: addr.id || addr._id,
    label: addr.label || 'Home',
    street: addr.addressLine1 || addr.address_line1 || addr.street,
    addressLine1: addr.addressLine1 || addr.address_line1,
    addressLine2: addr.addressLine2 || addr.address_line2,
    city: addr.city,
    state: addr.state,
    postalCode: addr.postalCode || addr.postal_code,
    zipCode: addr.postalCode || addr.postal_code || addr.zipCode,
    latitude: lat,
    longitude: lng,
    coordinates:
      lat != null && lng != null
        ? { latitude: Number(lat), longitude: Number(lng) }
        : undefined,
    landmark: addr.landmark,
    instructions: addr.landmark || addr.instructions,
    isDefault: addr.isDefault ?? addr.is_default ?? addr.default ?? false,
  };
};

const CheckoutScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  // Get guest info from navigation params (if guest checkout)
  const guestInfo = route.params?.guestInfo;

  // Get cart data
  const { items, subtotal, deliveryFee, taxes, total, itemCount, clearCart } = useCart();

  // Get user data
  const { user, isAuthenticated } = useAuth();

  // Get selected store
  const { selectedStoreId, selectedStore } = useSelectedStore();

  // Create order mutation
  const createOrderMutation = useCreateOrder();

  // State for saved addresses
  const [savedAddresses, setSavedAddresses] = useState<DeliveryAddress[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(true);

  // Initialize address from guest info
  const [selectedAddress, setSelectedAddress] = useState<DeliveryAddress | null>(() => {
    if (guestInfo) {
      return {
        id: 'guest-address',
        label: 'Delivery Address',
        street: guestInfo.street,
        city: guestInfo.city,
        state: guestInfo.state,
        zipCode: guestInfo.pincode,
        instructions: guestInfo.deliveryInstructions,
        isDefault: false,
      };
    }
    return null;
  });
  const paymentGatewayEnabled = isFeatureEnabled('ENABLE_PAYMENT_GATEWAY');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(
    paymentGatewayEnabled ? 'ONLINE' : 'CASH'
  );
  const [orderType, setOrderType] = useState<OrderType>('DELIVERY');

  // Keep payment method valid when gateway flag is off
  useEffect(() => {
    if (!paymentGatewayEnabled && paymentMethod !== 'CASH') {
      setPaymentMethod('CASH');
    }
  }, [paymentGatewayEnabled, paymentMethod]);

  // Fetch saved addresses when screen gains focus (to pick up newly added addresses)
  const fetchAddresses = useCallback(async () => {
    if (!isAuthenticated || !user?.id || guestInfo) {
      setLoadingAddresses(false);
      return;
    }

    try {
      const customer = await customerApi.getByUserId(user.id);
      if (customer?.addresses && customer.addresses.length > 0) {
        const addresses = customer.addresses.map(convertToDeliveryAddress);
        setSavedAddresses(addresses);

        // Auto-select default address or first address if none selected
        if (!selectedAddress || selectedAddress.id === 'guest-address') {
          const defaultAddr = addresses.find((a: DeliveryAddress) => a.isDefault) || addresses[0];
          setSelectedAddress(defaultAddr);
        }
      } else {
        setSavedAddresses([]);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoadingAddresses(false);
    }
  }, [isAuthenticated, user?.id, guestInfo]);

  // Fetch addresses on mount and when screen regains focus
  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  // Platform EU VAT (DE): 7% food for TAKEAWAY/DELIVERY — match EuVatEngine seed
  const countryCode = selectedStore?.countryCode || 'DE';
  const actualDeliveryFee = orderType === 'TAKEAWAY' ? 0 : deliveryFee;
  const actualTaxes = calculateTaxMinor(subtotal + actualDeliveryFee, countryCode, orderType);
  const actualTotal = subtotal + actualDeliveryFee + actualTaxes;
  const taxesLabel = taxLabel(countryCode, orderType);

  const { isOffline } = useNetworkStatus();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submittingRef = useRef(false);

  const { formatMoney } = useStoreCurrency();
  const formatPrice = formatMoney;

  const handlePlaceOrder = async () => {
    // Offline guard
    if (isOffline) {
      Alert.alert('Offline', 'You are currently offline. Please reconnect to the internet to place an order.');
      return;
    }

    // Double-submit hard lock
    if (submittingRef.current || createOrderMutation.isPending || isSubmitting) {
      console.log('[CheckoutScreen] Duplicate place-order tap blocked');
      return;
    }

    submittingRef.current = true;
    setIsSubmitting(true);

    // Validation
    if (items.length === 0) {
      Alert.alert('Empty Cart', 'Please add items to your cart before placing an order.');
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    // Address is only required for delivery orders
    if (orderType === 'DELIVERY' && !selectedAddress) {
      Alert.alert('No Address', 'Please select a delivery address.');
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    // Determine customer info from either authenticated user or guest info
    if (!isAuthenticated || !user) {
      Alert.alert('Sign In Required', 'Please sign in to place an order.');
      submittingRef.current = false;
      setIsSubmitting(false);
      return;
    }

    let customerData: { id: string; name: string; email: string; phone: string };

    try {
      // Profile fields from customer aggregate; order.customerId must be JWT user id
      // so GET /orders?customerId= matches X-User-Id ownership checks (else 403).
      const customer = await customerApi.getByUserId(user.id);
      customerData = {
        id: user.id,
        name: customer.name || user.name,
        email: customer.email || user.email,
        phone: customer.phone || user.phone || '',
      };
    } catch (err) {
      // Still allow order with auth user identity if customer profile missing
      customerData = {
        id: user.id,
        name: user.name,
        email: user.email,
        phone: user.phone || '',
      };
    }

    // Delivery radius check (Berlin DE demo stores).
    // Platform DeliveryZoneService returns false on store lookup failures — only hard-block
    // when distance is reported and clearly beyond a generous demo radius (15 km).
    if (orderType === 'DELIVERY' && selectedAddress && selectedStoreId) {
      let lat = selectedAddress.latitude ?? selectedAddress.coordinates?.latitude;
      let lng = selectedAddress.longitude ?? selectedAddress.coordinates?.longitude;
      // Prefer store coords when address has no geo (common after reseed)
      if ((lat == null || lng == null) && selectedStore?.address) {
        const sa = selectedStore.address as any;
        lat = sa.latitude ?? sa.coordinates?.latitude ?? BERLIN_DEMO_LAT;
        lng = sa.longitude ?? sa.coordinates?.longitude ?? BERLIN_DEMO_LNG;
      }
      if (lat == null || lng == null) {
        lat = BERLIN_DEMO_LAT;
        lng = BERLIN_DEMO_LNG;
      }
      if (!(Number(lat) === 0 && Number(lng) === 0)) {
        try {
          const zoneCheck = await deliveryApi.checkDeliveryZone(
            selectedStoreId,
            Number(lat),
            Number(lng)
          );
          const distance =
            typeof zoneCheck?.distanceKm === 'number' ? zoneCheck.distanceKm : undefined;
          const explicitOut =
            zoneCheck?.inZone === false || zoneCheck?.isWithinDeliveryZone === false;
          // Only block real far addresses; 15km covers Berlin demo store service area
          if (explicitOut && distance != null && distance > 15) {
            Alert.alert(
              'Delivery Unavailable',
              `This address is about ${distance.toFixed(1)} km from the store and outside the delivery area. Choose Takeaway or another address near the branch.`,
              [
                { text: 'Switch to Takeaway', onPress: () => setOrderType('TAKEAWAY') },
                { text: 'OK', style: 'cancel' },
              ]
            );
            submittingRef.current = false;
            setIsSubmitting(false);
            return;
          }
          if (explicitOut && (distance == null || distance <= 15)) {
            console.warn('Delivery zone soft-pass (demo/geo incomplete)', zoneCheck);
          }
        } catch (zoneErr) {
          console.warn('Delivery zone check failed, proceeding with order:', zoneErr);
        }
      }
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Transform cart items to order items format
      const orderItems = items.map((item) => ({
        menuItemId: item.menuItem.id,
        name: item.menuItem.name,
        quantity: item.quantity,
        price: toMajorUnits(item.itemTotal / item.quantity), // major units for platform
        variant: item.selectedVariant?.name,
        customizations: item.selectedCustomizations
          ? Array.from(item.selectedCustomizations.values())
              .flat()
              .map(opt => opt.name)
          : [],
        specialInstructions: item.specialInstructions,
      }));

      // Create order request with all required fields
      const orderData = {
        items: orderItems,
        deliveryAddress: orderType === 'DELIVERY' && selectedAddress ? {
          street: selectedAddress.street || selectedAddress.addressLine1 || '',
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.zipCode || selectedAddress.postalCode,
          latitude: selectedAddress.latitude || selectedAddress.coordinates?.latitude,
          longitude: selectedAddress.longitude || selectedAddress.coordinates?.longitude,
          landmark: selectedAddress.instructions || selectedAddress.landmark,
        } : undefined,
        paymentMethod,
        orderType,
        customerId: customerData.id,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        storeId: selectedStoreId || 'default-store-id', // Get from selected store
      };

      // Create order
      const order = await createOrderMutation.mutateAsync(orderData);

      analytics.track('order.create.success', {
        orderId: order.id,
        customerId: customerData.id,
        totalAmount: actualTotal / 100,
        paymentMethod,
        orderType,
      });

      // Handle payment based on payment method
      if (paymentMethod === 'ONLINE' || paymentMethod === 'UPI') {
        if (!isFeatureEnabled('ENABLE_PAYMENT_GATEWAY')) {
          // Gateway disabled: treat as deferred/COD-style confirmation (order already created)
          clearCart();
          navigation.replace('PaymentSuccess', { orderId: order.id });
        } else {
          try {
            // Process online payment — amount in major units for payment service
            const paymentResult = await PaymentService.process({
              orderId: order.id,
              amount: toMajorUnits(actualTotal),
              customerId: customerData.id,
              customerName: customerData.name,
              customerEmail: customerData.email,
              customerPhone: customerData.phone,
              storeId: selectedStoreId || 'default-store-id',
            });

            if (paymentResult.success) {
              // Payment successful - navigate to success screen
              clearCart();
              navigation.replace('PaymentSuccess', { orderId: order.id });
            }
          } catch (paymentError: any) {
            // Payment failed or cancelled - navigate to failed screen
            console.error('Payment failed:', paymentError);
            const errorMessage = paymentError.message === 'Payment cancelled'
              ? 'Payment was cancelled. Your order is saved but not confirmed.'
              : 'Payment processing failed. Please try again or choose a different payment method.';
            submittingRef.current = false;
            setIsSubmitting(false);
            navigation.replace('PaymentFailed', {
              orderId: order.id,
              error: errorMessage,
            });
          }
        }
      } else {
        // Cash on delivery - no payment needed, clear cart and go directly to success
        clearCart();
        navigation.replace('PaymentSuccess', { orderId: order.id });
      }
    } catch (error: any) {
      console.error('Order creation failed:', error);
      analytics.track('order.create.fail', {
        customerId: user?.id,
        totalAmount: actualTotal / 100,
        reason: error?.response?.data?.message || error?.message || 'Failed to place order',
      });
      submittingRef.current = false;
      setIsSubmitting(false);
      Alert.alert(
        'Order Failed',
        error.response?.data?.message || 'Failed to place order. Please try again.',
        [{ text: 'OK' }]
      );
    }

  };

  const renderAddressCard = (address: DeliveryAddress) => {
    const isSelected = selectedAddress?.id === address.id;
    const displayStreet = address.street || address.addressLine1 || '';
    const displayZip = address.zipCode || address.postalCode || '';

    return (
      <TouchableOpacity
        key={address.id}
        activeOpacity={0.8}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setSelectedAddress(address);
        }}
        style={[
          styles.addressCard,
          {
            borderColor: isSelected ? '#FFD000' : theme.colors.border,
            backgroundColor: isSelected ? `${'#FFD000'}05` : 'transparent',
          },
        ]}
      >
        <View style={styles.addressRadioContainer}>
          <View
            style={[
              styles.radioOuter,
              { borderColor: isSelected ? '#FFD000' : theme.colors.text3 },
            ]}
          >
            {isSelected && (
              <View
                style={[styles.radioInner, { backgroundColor: '#FFD000' }]}
              />
            )}
          </View>
        </View>
        <View style={styles.addressContent}>
          <View style={styles.addressHeader}>
            <View style={styles.addressLabel}>
              <Ionicons
                name={
                  address.label?.toUpperCase() === 'HOME' ? 'home' :
                  address.label?.toUpperCase() === 'WORK' ? 'briefcase' : 'location'
                }
                size={16}
                color={isSelected ? '#FFD000' : theme.colors.text2}
              />
              <Text
                style={[
                  styles.addressLabelText,
                  { color: isSelected ? '#FFD000' : theme.colors.text1 },
                ]}
              >
                {address.label}
              </Text>
              {address.isDefault && <Badge label="Default" variant="secondary" size="sm" />}
            </View>
          </View>
          <Text style={[styles.addressStreet, { color: theme.colors.text1 }]} numberOfLines={2}>
            {displayStreet}
          </Text>
          {address.addressLine2 && (
            <Text style={[styles.addressLine2, { color: theme.colors.text2 }]} numberOfLines={1}>
              {address.addressLine2}
            </Text>
          )}
          <Text style={[styles.addressCity, { color: theme.colors.text2 }]}>
            {address.city}{address.state ? `, ${address.state}` : ''}{displayZip ? ` - ${displayZip}` : ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderPaymentOption = (
    method: PaymentMethod,
    icon: keyof typeof Ionicons.glyphMap,
    label: string,
    description: string
  ) => {
    const isSelected = paymentMethod === method;
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          setPaymentMethod(method);
        }}
        style={[
          styles.paymentOption,
          {
            borderColor: isSelected ? '#FFD000' : theme.colors.border,
            backgroundColor: isSelected
              ? `${'#FFD000'}08`
              : theme.colors.surface1,
          },
        ]}
      >
        <View style={styles.paymentInfo}>
          <View
            style={[
              styles.paymentIcon,
              { backgroundColor: isSelected ? `${'#FFD000'}15` : theme.colors.surface2 },
            ]}
          >
            <Ionicons
              name={icon}
              size={22}
              color={isSelected ? '#FFD000' : theme.colors.text2}
            />
          </View>
          <View>
            <Text
              style={[
                styles.paymentLabel,
                { color: isSelected ? '#FFD000' : theme.colors.text1 },
              ]}
            >
              {label}
            </Text>
            <Text style={[styles.paymentDescription, { color: theme.colors.text2 }]}>
              {description}
            </Text>
          </View>
        </View>
        <View
          style={[
            styles.radioOuter,
            { borderColor: isSelected ? '#FFD000' : theme.colors.text3 },
          ]}
        >
          {isSelected && (
            <View
              style={[styles.radioInner, { backgroundColor: '#FFD000' }]}
            />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  if (!isAuthenticated || !user) {
    return (
      <GuestPromptView
        screenName="Checkout"
        icon="cart-outline"
        description="Sign in to your MaSoVa account to choose delivery options and place your order."
      />
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Checkout</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Order Type Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Order Type
          </Text>
          <View style={styles.orderTypeContainer}>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setOrderType('DELIVERY');
                // Cash is not available for delivery, reset to online payment if cash was selected
                if (paymentMethod === 'CASH') {
                  setPaymentMethod('ONLINE');
                }
              }}
              style={[
                styles.orderTypeOption,
                {
                  borderColor: orderType === 'DELIVERY' ? '#FFD000' : theme.colors.border,
                  backgroundColor: orderType === 'DELIVERY'
                    ? `${'#FFD000'}08`
                    : theme.colors.surface1,
                },
              ]}
            >
              <Ionicons
                name="bicycle"
                size={28}
                color={orderType === 'DELIVERY' ? '#FFD000' : theme.colors.text2}
              />
              <Text
                style={[
                  styles.orderTypeLabel,
                  { color: orderType === 'DELIVERY' ? '#FFD000' : theme.colors.text1 },
                ]}
              >
                Delivery
              </Text>
              <Text style={[styles.orderTypeDesc, { color: theme.colors.text2 }]}>
                30-40 min
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setOrderType('TAKEAWAY');
              }}
              style={[
                styles.orderTypeOption,
                {
                  borderColor: orderType === 'TAKEAWAY' ? '#FFD000' : theme.colors.border,
                  backgroundColor: orderType === 'TAKEAWAY'
                    ? `${'#FFD000'}08`
                    : theme.colors.surface1,
                },
              ]}
            >
              <Ionicons
                name="bag-handle"
                size={28}
                color={orderType === 'TAKEAWAY' ? '#FFD000' : theme.colors.text2}
              />
              <Text
                style={[
                  styles.orderTypeLabel,
                  { color: orderType === 'TAKEAWAY' ? '#FFD000' : theme.colors.text1 },
                ]}
              >
                Takeaway
              </Text>
              <Text style={[styles.orderTypeDesc, { color: theme.colors.text2 }]}>
                15-20 min
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Delivery Address - Only show for DELIVERY orders */}
        {orderType === 'DELIVERY' && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Delivery Address
            </Text>
            {isAuthenticated && (
              <TouchableOpacity onPress={() => navigation.navigate('AddressManagement')}>
                <Text style={[styles.changeLink, { color: '#FFD000' }]}>
                  + Add New
                </Text>
              </TouchableOpacity>
            )}
          </View>
          {loadingAddresses ? (
            // Loading addresses
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={'#FFD000'} />
              <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
                Loading addresses...
              </Text>
            </View>
          ) : guestInfo && selectedAddress ? (
            // Display guest address
            renderAddressCard(selectedAddress)
          ) : savedAddresses.length > 0 ? (
            // Display saved addresses for authenticated users
            savedAddresses.map(renderAddressCard)
          ) : (
            // No addresses - prompt to add one
            <TouchableOpacity
              style={[styles.addAddressCard, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('AddAddress', {})}
            >
              <Ionicons name="add-circle-outline" size={32} color={'#FFD000'} />
              <Text style={[styles.addAddressText, { color: theme.colors.text1 }]}>
                Add a delivery address
              </Text>
              <Text style={[styles.addAddressSubtext, { color: theme.colors.text2 }]}>
                You need to add an address before checkout
              </Text>
            </TouchableOpacity>
          )}
        </View>
        )}

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Payment Method
          </Text>
          {isFeatureEnabled('ENABLE_PAYMENT_GATEWAY') && (
            <>
              {renderPaymentOption('ONLINE', 'card', 'Pay Online', 'Credit/Debit Card, Net Banking')}
              {renderPaymentOption('UPI', 'phone-portrait', 'UPI', 'Google Pay, PhonePe, Paytm')}
            </>
          )}
          {/* Cash payment only available for TAKEAWAY orders (or when gateway is off) */}
          {(orderType === 'TAKEAWAY' || !isFeatureEnabled('ENABLE_PAYMENT_GATEWAY')) &&
            renderPaymentOption('CASH', 'cash', orderType === 'TAKEAWAY' ? 'Cash on Pickup' : 'Cash on Delivery', 'Pay when you receive your order')}
        </View>

        {/* Order Summary */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Order Summary
          </Text>
          <Card elevation="none" style={{...styles.summaryCard, borderColor: theme.colors.border}}>
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text2 }]}>
                Item Total ({itemCount} {itemCount === 1 ? 'item' : 'items'})
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text1 }]}>
                {formatPrice(subtotal)}
              </Text>
            </View>
            {orderType === 'DELIVERY' && (
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text2 }]}>
                Delivery Fee
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text1 }]}>
                {actualDeliveryFee === 0 ? 'FREE' : formatPrice(actualDeliveryFee)}
              </Text>
            </View>
            )}
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryLabel, { color: theme.colors.text2 }]}>
                {taxesLabel}
              </Text>
              <Text style={[styles.summaryValue, { color: theme.colors.text1 }]}>
                {formatPrice(actualTaxes)}
              </Text>
            </View>
            <View style={[styles.summaryDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.summaryRow}>
              <Text style={[styles.summaryTotal, { color: theme.colors.text1 }]}>
                Total Amount
              </Text>
              <Text style={[styles.summaryTotalValue, { color: theme.colors.text1 }]}>
                {formatPrice(actualTotal)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Spacer */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Place Order Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface1,
            paddingBottom: insets.bottom + spacing[3],
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.bottomInfo}>
          <Text style={[styles.bottomTotal, { color: theme.colors.text1 }]}>
            {formatPrice(actualTotal)}
          </Text>
          <Text style={[styles.bottomDelivery, { color: theme.colors.text2 }]}>
            {orderType === 'DELIVERY' ? 'Delivery in 30-40 min' : 'Ready in 15-20 min'}
          </Text>
        </View>
        <Button
          title={isOffline ? "You're Offline" : "Place Order"}
          onPress={handlePlaceOrder}
          size="lg"
          loading={createOrderMutation.isPending || isSubmitting}
          disabled={items.length === 0 || createOrderMutation.isPending || isSubmitting || isOffline}
          style={styles.placeOrderButton}
          accessibilityLabel={isOffline ? "You are offline. Connect to internet to place order" : "Place Order"}
          accessibilityRole="button"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  scrollContent: {
    paddingTop: spacing[2],
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: spacing[3],
  },
  changeLink: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  addressCard: {
    flexDirection: 'row',
    padding: spacing[3],
    marginBottom: spacing[2],
    borderWidth: 1,
    borderRadius: borderRadius.md,
  },
  addressRadioContainer: {
    paddingTop: spacing[1],
    paddingRight: spacing[3],
  },
  addressContent: {
    flex: 1,
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  addressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  addressLabelText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  addressStreet: {
    fontSize: typography.fontSize.body,
    lineHeight: 20,
  },
  addressLine2: {
    fontSize: typography.fontSize.bodySm,
    marginTop: 2,
  },
  addressCity: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  paymentOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    marginBottom: spacing[3],
  },
  paymentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  paymentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  paymentDescription: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  summaryCard: {
    borderWidth: 1,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  summaryLabel: {
    fontSize: typography.fontSize.body,
  },
  summaryValue: {
    fontSize: typography.fontSize.body,
  },
  summaryDivider: {
    height: 1,
    marginVertical: spacing[2],
  },
  summaryTotal: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  summaryTotalValue: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    ...shadows.lg,
  },
  bottomInfo: {},
  bottomTotal: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  bottomDelivery: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  placeOrderButton: {
    minWidth: 160,
  },
  addAddressCard: {
    padding: spacing[6],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    gap: spacing[2],
  },
  addAddressText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[2],
  },
  addAddressSubtext: {
    fontSize: typography.fontSize.bodySm,
    textAlign: 'center',
  },
  orderTypeContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  orderTypeOption: {
    flex: 1,
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    gap: spacing[1],
  },
  orderTypeLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[1],
  },
  orderTypeDesc: {
    fontSize: typography.fontSize.caption,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
    gap: spacing[3],
  },
  loadingText: {
    fontSize: typography.fontSize.body,
  },
});

export default CheckoutScreen;
