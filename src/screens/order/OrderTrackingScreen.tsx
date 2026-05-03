/**
 * Order Tracking Screen
 * Real-time order status and delivery tracking
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Linking,
} from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Button, Card, Badge } from '../../components/ui';
import { RootStackParamList, OrderStatus, DeliveryTracking } from '../../types';
import { useOrderTracking } from '../../hooks/useOrderTracking';
import { deliveryApi } from '../../services/api';

type OrderTrackingRouteProp = RouteProp<RootStackParamList, 'OrderTracking'>;

// Order stages for DELIVERY orders - matches KDS statuses exactly
const DELIVERY_ORDER_STAGES: { status: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'RECEIVED', label: 'Order Received', icon: 'checkmark-circle' },
  { status: 'PREPARING', label: 'Preparing', icon: 'restaurant' },
  { status: 'OVEN', label: 'In Oven', icon: 'flame' },
  { status: 'BAKED', label: 'Ready', icon: 'fast-food' },
  { status: 'DISPATCHED', label: 'On the Way', icon: 'bicycle' },
  { status: 'DELIVERED', label: 'Delivered', icon: 'home' },
];

// Order stages for TAKEAWAY/PICKUP orders
const TAKEAWAY_ORDER_STAGES: { status: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'RECEIVED', label: 'Order Received', icon: 'checkmark-circle' },
  { status: 'PREPARING', label: 'Preparing', icon: 'restaurant' },
  { status: 'OVEN', label: 'In Oven', icon: 'flame' },
  { status: 'BAKED', label: 'Ready for Pickup', icon: 'bag-check' },
  { status: 'COMPLETED', label: 'Picked Up', icon: 'checkmark-done-circle' },
];

// Order stages for DINE_IN orders - matches KDS statuses exactly
const DINE_IN_ORDER_STAGES: { status: OrderStatus; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { status: 'RECEIVED', label: 'Order Received', icon: 'checkmark-circle' },
  { status: 'PREPARING', label: 'Preparing', icon: 'restaurant' },
  { status: 'OVEN', label: 'In Oven', icon: 'flame' },
  { status: 'BAKED', label: 'Ready to Serve', icon: 'fast-food' },
  { status: 'SERVED', label: 'Served', icon: 'checkmark-done-circle' },
];

// Get order stages based on order type
const getOrderStages = (orderType?: string) => {
  switch (orderType) {
    case 'TAKEAWAY':
    case 'COLLECTION':
      return TAKEAWAY_ORDER_STAGES;
    case 'DINE_IN':
      return DINE_IN_ORDER_STAGES;
    case 'DELIVERY':
    default:
      return DELIVERY_ORDER_STAGES;
  }
};

const OrderTrackingScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<OrderTrackingRouteProp>();

  const { orderId } = route.params;

  // Real-time order tracking with WebSocket
  const { order, isLoading, wsConnected, wsState, error } = useOrderTracking({
    orderId,
    enableWebSocket: true,
  });

  const [deliveryInfo, setDeliveryInfo] = useState<DeliveryTracking | null>(null);
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  const currentStatus = order?.status || 'PENDING';
  const [eta, setEta] = useState(order?.preparationTime || 25);

  // Fetch delivery tracking info when order is dispatched
  useEffect(() => {
    const fetchDeliveryInfo = async () => {
      if (order?.status === 'DISPATCHED' || order?.status === 'DELIVERED') {
        setDeliveryLoading(true);
        try {
          const tracking = await deliveryApi.track(orderId);
          setDeliveryInfo(tracking);
        } catch (err) {
          console.log('Delivery info not available yet:', err);
        } finally {
          setDeliveryLoading(false);
        }
      }
    };
    fetchDeliveryInfo();
  }, [order?.status, orderId]);

  // Update ETA countdown
  useEffect(() => {
    if (deliveryInfo?.estimatedDeliveryMinutes) {
      setEta(deliveryInfo.estimatedDeliveryMinutes);
    } else if (order?.preparationTime) {
      setEta(order.preparationTime);
    }
  }, [order?.preparationTime, deliveryInfo?.estimatedDeliveryMinutes]);

  useEffect(() => {
    const interval = setInterval(() => {
      setEta((prev) => Math.max(prev - 1, 0));
    }, 60000);

    return () => clearInterval(interval);
  }, []);

  // Helper to format currency
  const formatCurrency = (amount: number) => {
    return `₹${amount.toLocaleString('en-IN')}`;
  };

  // Helper to call driver
  const handleCallDriver = () => {
    if (deliveryInfo?.driverPhone) {
      Linking.openURL(`tel:${deliveryInfo.driverPhone}`);
    }
  };

  // Get the appropriate stages for this order type
  const orderStages = getOrderStages(order?.orderType);

  const getCurrentStageIndex = () => {
    return orderStages.findIndex((stage) => stage.status === currentStatus);
  };

  const renderProgressBar = () => {
    const currentIndex = getCurrentStageIndex();

    return (
      <View style={styles.progressContainer}>
        {orderStages.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;

          return (
            <View key={stage.status} style={styles.progressItem}>
              <View style={styles.progressStep}>
                <View
                  style={[
                    styles.progressDot,
                    {
                      backgroundColor: isCompleted || isCurrent
                        ? '#FFD000'
                        : theme.colors.border,
                    },
                  ]}
                >
                  {isCompleted && (
                    <Ionicons name="checkmark" size={14} color="#FFF" />
                  )}
                  {isCurrent && (
                    <View style={styles.activeDot} />
                  )}
                </View>
                {index < orderStages.length - 1 && (
                  <View
                    style={[
                      styles.progressLine,
                      {
                        backgroundColor: isCompleted
                          ? '#FFD000'
                          : theme.colors.border,
                      },
                    ]}
                  />
                )}
              </View>
              <Text
                style={[
                  styles.progressLabel,
                  {
                    color: isCompleted || isCurrent
                      ? theme.colors.text1
                      : theme.colors.text3,
                    fontWeight: isCurrent
                      ? typography.fontWeight.semibold
                      : typography.fontWeight.regular,
                  },
                ]}
              >
                {stage.label}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={'#FFD000'} />
        <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
          Loading order details...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error || !order) {
    return (
      <View style={[styles.container, styles.loadingContainer, { backgroundColor: theme.colors.bg }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.semantic.error} />
        <Text style={[styles.errorText, { color: theme.colors.text1 }]}>
          Unable to load order
        </Text>
        <Text style={[styles.errorSubtext, { color: theme.colors.text2 }]}>
          {error?.message || 'Order not found'}
        </Text>
        <Button
          title="Go Back"
          variant="primary"
          onPress={() => navigation.goBack()}
          style={{ marginTop: spacing[4] }}
        />
      </View>
    );
  }

  // Calculate total items count
  const totalItemsCount = order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;

  // Get current stage index, handling statuses not in ORDER_STAGES
  const stageIndex = getCurrentStageIndex();
  const displayStageIndex = stageIndex >= 0 ? stageIndex : 0;

  // Pre-compute map coordinates to avoid IIFE pattern in JSX
  const driverLat = deliveryInfo?.currentLocation?.latitude ?? deliveryInfo?.driverLat;
  const driverLon = deliveryInfo?.currentLocation?.longitude ?? deliveryInfo?.driverLon;
  const restLat = deliveryInfo?.restaurantLocation?.latitude ?? deliveryInfo?.restaurantLat;
  const restLon = deliveryInfo?.restaurantLocation?.longitude ?? deliveryInfo?.restaurantLon;
  const custLat = order.deliveryAddress?.latitude;
  const custLon = order.deliveryAddress?.longitude;
  const showLiveMap =
    order.orderType === 'DELIVERY' &&
    (currentStatus === 'DISPATCHED' || currentStatus === 'DELIVERED') &&
    !!driverLat && !!driverLon;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="close" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.orderNumber, { color: theme.colors.text2 }]}>
            Order #{order.orderNumber || orderId.slice(-8).toUpperCase()}
          </Text>
        </View>
        <TouchableOpacity style={styles.helpButton}>
          <Ionicons name="help-circle-outline" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Map/Status Visual */}
        <View style={[styles.mapContainer, { backgroundColor: theme.colors.surface2 }]}>
          {showLiveMap ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={StyleSheet.absoluteFillObject}
              initialRegion={{
                latitude: driverLat!,
                longitude: driverLon!,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              {/* Driver pin — green */}
              <Marker
                coordinate={{ latitude: driverLat!, longitude: driverLon! }}
                title="Driver"
                pinColor={'#FFD000'}
              />
              {/* Restaurant pin — orange */}
              {restLat != null && restLon != null && (
                <Marker
                  coordinate={{ latitude: restLat, longitude: restLon }}
                  title="Restaurant"
                  pinColor="#FF6B35"
                />
              )}
              {/* Customer pin — blue */}
              {custLat != null && custLon != null && (
                <Marker
                  coordinate={{ latitude: custLat, longitude: custLon }}
                  title="Your Location"
                  pinColor="#2196F3"
                />
              )}
              {/* Dashed route: driver → customer */}
              {custLat != null && custLon != null && (
                <Polyline
                  coordinates={[
                    { latitude: driverLat!, longitude: driverLon! },
                    { latitude: custLat, longitude: custLon },
                  ]}
                  strokeColor={'#FFD000'}
                  strokeWidth={3}
                  lineDashPattern={[8, 4]}
                />
              )}
            </MapView>
          ) : (
            <LinearGradient
              colors={[`${'#FFD000'}20`, `${'#3B82F6'}20`]}
              style={styles.mapGradient}
            >
              <Ionicons
                name={orderStages[displayStageIndex]?.icon || 'restaurant'}
                size={64}
                color={'#FFD000'}
              />
              <Text style={[styles.mapPlaceholder, { color: theme.colors.text2 }]}>
                {currentStatus === 'COMPLETED'
                  ? 'Ready for pickup!'
                  : currentStatus === 'SERVED'
                  ? 'Order served!'
                  : currentStatus === 'DELIVERED'
                  ? 'Order delivered!'
                  : currentStatus === 'DISPATCHED'
                  ? 'Your order is on the way!'
                  : currentStatus === 'BAKED'
                  ? order.orderType === 'DELIVERY'
                    ? 'Ready! Will be dispatched shortly'
                    : (order.orderType === 'TAKEAWAY' || order.orderType === 'COLLECTION')
                    ? 'Ready for pickup!'
                    : 'Ready to serve!'
                  : currentStatus === 'OVEN'
                  ? 'Your order is in the oven!'
                  : currentStatus === 'PREPARING'
                  ? 'Your order is being prepared'
                  : currentStatus === 'RECEIVED'
                  ? 'Order received, preparing soon...'
                  : 'Loading order status...'}
              </Text>
            </LinearGradient>
          )}
        </View>

        {/* ETA Card */}
        <Card elevation="md" style={styles.etaCard}>
          <View style={styles.etaContent}>
            <View>
              <Text style={[styles.etaLabel, { color: theme.colors.text2 }]}>
                {(currentStatus === 'COMPLETED' || currentStatus === 'SERVED' || currentStatus === 'DELIVERED')
                  ? 'Order Complete'
                  : order.orderType === 'DELIVERY'
                    ? 'Estimated Arrival'
                    : 'Estimated Ready Time'}
              </Text>
              <Text style={[styles.etaTime, { color: theme.colors.text1 }]}>
                {(currentStatus === 'COMPLETED' || currentStatus === 'SERVED' || currentStatus === 'DELIVERED')
                  ? 'Done!'
                  : eta > 0
                    ? `${eta} min`
                    : 'Ready!'}
              </Text>
            </View>
            <View
              style={[styles.statusBadge, { backgroundColor: `${theme.colors.semantic.success}15` }]}
            >
              <View style={[styles.statusDot, { backgroundColor: theme.colors.semantic.success }]} />
              <Text style={[styles.statusText, { color: theme.colors.semantic.success }]}>
                {orderStages[displayStageIndex]?.label || currentStatus}
              </Text>
            </View>
          </View>
        </Card>

        {/* Progress */}
        <Card elevation="sm" style={styles.progressCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Order Status
          </Text>
          {renderProgressBar()}
        </Card>

        {/* Driver Info - Only show for delivery orders when dispatched */}
        {order.orderType === 'DELIVERY' && (currentStatus === 'DISPATCHED' || currentStatus === 'DELIVERED') && (
          <Card elevation="sm" style={styles.driverCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Delivery Partner
            </Text>
            {deliveryLoading ? (
              <View style={styles.driverLoading}>
                <ActivityIndicator size="small" color={'#FFD000'} />
                <Text style={[styles.driverLoadingText, { color: theme.colors.text2 }]}>
                  Loading driver info...
                </Text>
              </View>
            ) : deliveryInfo ? (
              <View style={styles.driverInfo}>
                <View style={[styles.driverAvatar, { backgroundColor: theme.colors.surface2 }]}>
                  <Ionicons name="person" size={28} color={theme.colors.text2} />
                </View>
                <View style={styles.driverDetails}>
                  <Text style={[styles.driverName, { color: theme.colors.text1 }]}>
                    {deliveryInfo.driverName}
                  </Text>
                  <View style={styles.driverRating}>
                    <Ionicons name="bicycle" size={14} color={'#FFD000'} />
                    <Text style={[styles.driverRatingText, { color: theme.colors.text2 }]}>
                      {deliveryInfo.distanceKm ? `${deliveryInfo.distanceKm.toFixed(1)} km away` : 'On the way'}
                    </Text>
                  </View>
                </View>
                <View style={styles.driverActions}>
                  <TouchableOpacity
                    style={[styles.actionButton, { backgroundColor: theme.colors.surface2 }]}
                    onPress={handleCallDriver}
                  >
                    <Ionicons name="call" size={20} color={'#FFD000'} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <View style={styles.driverInfo}>
                <View style={[styles.driverAvatar, { backgroundColor: theme.colors.surface2 }]}>
                  <Ionicons name="person" size={28} color={theme.colors.text2} />
                </View>
                <View style={styles.driverDetails}>
                  <Text style={[styles.driverName, { color: theme.colors.text1 }]}>
                    Driver Assigned
                  </Text>
                  <Text style={[styles.driverRatingText, { color: theme.colors.text2 }]}>
                    Picking up your order
                  </Text>
                </View>
              </View>
            )}
          </Card>
        )}

        {/* Delivery OTP — shown when order is OUT_FOR_DELIVERY so customer can share with driver */}
        {order.orderType === 'DELIVERY' && currentStatus === 'DISPATCHED' && order.deliveryOtp && (
          <Card elevation="sm" style={styles.otpCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Your Delivery OTP
            </Text>
            <Text style={[styles.otpCode, { color: '#FFD000' }]}>
              {order.deliveryOtp}
            </Text>
            <Text style={[styles.otpHint, { color: theme.colors.text2 }]}>
              Share this 4-digit code with your delivery driver to confirm receipt
            </Text>
          </Card>
        )}

        {/* Order Items */}
        <Card elevation="sm" style={styles.itemsCard}>
          <View style={styles.itemsHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Order Items
            </Text>
            <Text style={[styles.itemCount, { color: theme.colors.text2 }]}>
              {totalItemsCount} {totalItemsCount === 1 ? 'item' : 'items'}
            </Text>
          </View>
          <View style={styles.itemsList}>
            {order.items?.map((item, index) => (
              <View key={item.id || index} style={styles.itemRow}>
                <Text style={[styles.itemQty, { color: theme.colors.text2 }]}>
                  {item.quantity}x
                </Text>
                <View style={styles.itemDetails}>
                  <Text style={[styles.itemName, { color: theme.colors.text1 }]}>
                    {item.name}
                  </Text>
                  {item.variant && (
                    <Text style={[styles.itemVariant, { color: theme.colors.text3 }]}>
                      {item.variant}
                    </Text>
                  )}
                  {item.customizations && item.customizations.length > 0 && (
                    <Text style={[styles.itemCustomizations, { color: theme.colors.text3 }]}>
                      {item.customizations.join(', ')}
                    </Text>
                  )}
                </View>
                <Text style={[styles.itemPrice, { color: theme.colors.text1 }]}>
                  {formatCurrency(item.price * item.quantity)}
                </Text>
              </View>
            ))}
          </View>

          {/* Order totals */}
          <View style={[styles.totalsSection, { borderTopColor: theme.colors.border }]}>
            <View style={styles.totalLine}>
              <Text style={[styles.totalLineLabel, { color: theme.colors.text2 }]}>
                Subtotal
              </Text>
              <Text style={[styles.totalLineValue, { color: theme.colors.text2 }]}>
                {formatCurrency(order.subtotal)}
              </Text>
            </View>
            {order.deliveryFee > 0 && (
              <View style={styles.totalLine}>
                <Text style={[styles.totalLineLabel, { color: theme.colors.text2 }]}>
                  Delivery Fee
                </Text>
                <Text style={[styles.totalLineValue, { color: theme.colors.text2 }]}>
                  {formatCurrency(order.deliveryFee)}
                </Text>
              </View>
            )}
            {order.tax > 0 && (
              <View style={styles.totalLine}>
                <Text style={[styles.totalLineLabel, { color: theme.colors.text2 }]}>
                  Taxes
                </Text>
                <Text style={[styles.totalLineValue, { color: theme.colors.text2 }]}>
                  {formatCurrency(order.tax)}
                </Text>
              </View>
            )}
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: theme.colors.text1 }]}>
                Total Paid
              </Text>
              <Text style={[styles.totalValue, { color: theme.colors.text1 }]}>
                {formatCurrency(order.total)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Delivery Address - Only show for delivery orders */}
        {order.orderType === 'DELIVERY' && order.deliveryAddress && (
          <Card elevation="sm" style={styles.addressCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Delivering To
            </Text>
            <View style={styles.addressContent}>
              <Ionicons name="location" size={20} color={'#FFD000'} />
              <View style={styles.addressText}>
                <Text style={[styles.addressLabel, { color: theme.colors.text1 }]}>
                  {order.deliveryAddress.label || 'Delivery Address'}
                </Text>
                <Text style={[styles.addressStreet, { color: theme.colors.text2 }]}>
                  {order.deliveryAddress.street}
                  {order.deliveryAddress.city ? `, ${order.deliveryAddress.city}` : ''}
                  {order.deliveryAddress.state ? `, ${order.deliveryAddress.state}` : ''}
                  {order.deliveryAddress.zipCode ? ` - ${order.deliveryAddress.zipCode}` : ''}
                </Text>
                {order.deliveryAddress.instructions && (
                  <Text style={[styles.addressInstructions, { color: theme.colors.text3 }]}>
                    Note: {order.deliveryAddress.instructions}
                  </Text>
                )}
              </View>
            </View>
          </Card>
        )}

        {/* Takeaway/Dine-in info */}
        {order.orderType === 'TAKEAWAY' && (
          <Card elevation="sm" style={styles.addressCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Pickup Location
            </Text>
            <View style={styles.addressContent}>
              <Ionicons name="storefront" size={20} color={'#FFD000'} />
              <View style={styles.addressText}>
                <Text style={[styles.addressLabel, { color: theme.colors.text1 }]}>
                  Store Pickup
                </Text>
                <Text style={[styles.addressStreet, { color: theme.colors.text2 }]}>
                  Please collect your order from the store counter
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Payment Info */}
        <Card elevation="sm" style={styles.paymentCard}>
          <View style={styles.paymentInfo}>
            <View style={styles.paymentMethod}>
              <Ionicons
                name={order.paymentMethod === 'CASH' ? 'cash-outline' : 'card-outline'}
                size={20}
                color={'#FFD000'}
              />
              <Text style={[styles.paymentMethodText, { color: theme.colors.text1 }]}>
                {order.paymentMethod === 'CASH' ? 'Cash on Delivery' :
                 order.paymentMethod === 'UPI' ? 'Paid via UPI' :
                 order.paymentMethod === 'CARD' ? 'Paid via Card' : 'Paid Online'}
              </Text>
            </View>
            <View style={[
              styles.paymentStatusBadge,
              { backgroundColor: order.paymentStatus === 'SUCCESS' ? `${theme.colors.semantic.success}15` : `${theme.colors.semantic.warning}15` }
            ]}>
              <Text style={[
                styles.paymentStatusText,
                { color: order.paymentStatus === 'SUCCESS' ? theme.colors.semantic.success : theme.colors.semantic.warning }
              ]}>
                {order.paymentStatus === 'SUCCESS' ? 'Paid' : order.paymentStatus === 'PENDING' ? 'Pending' : order.paymentStatus}
              </Text>
            </View>
          </View>
        </Card>

        {/* Actions */}
        <View style={styles.actions}>
          <Button
            title="Need Help?"
            variant="secondary"
            onPress={() => {}}
            fullWidth
          />
        </View>

        {/* Spacer */}
        <View style={{ height: spacing[10] }} />
      </ScrollView>
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
  headerCenter: {
    alignItems: 'center',
  },
  orderNumber: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  helpButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
  },
  mapContainer: {
    height: 200,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginBottom: spacing[4],
  },
  mapGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapPlaceholder: {
    marginTop: spacing[2],
    fontSize: typography.fontSize.body,
  },
  etaCard: {
    marginBottom: spacing[4],
  },
  etaContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaLabel: {
    fontSize: typography.fontSize.bodySm,
  },
  etaTime: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.pill,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: spacing[2],
  },
  statusText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.semibold,
  },
  progressCard: {
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[4],
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressItem: {
    alignItems: 'center',
    flex: 1,
  },
  progressStep: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  progressDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFF',
  },
  progressLine: {
    flex: 1,
    height: 2,
  },
  progressLabel: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  driverCard: {
    marginBottom: spacing[4],
  },
  driverInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  driverAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  driverDetails: {
    flex: 1,
    marginLeft: spacing[3],
  },
  driverName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  driverRating: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[1],
    gap: spacing[1],
  },
  driverRatingText: {
    fontSize: typography.fontSize.caption,
  },
  driverActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCard: { marginBottom: 12 },
  otpCode: { fontSize: 48, fontWeight: '800', textAlign: 'center', letterSpacing: 8, marginVertical: 12 },
  otpHint: { fontSize: 13, textAlign: 'center', lineHeight: 18 },
  itemsCard: {
    marginBottom: spacing[4],
  },
  itemsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  itemCount: {
    fontSize: typography.fontSize.bodySm,
  },
  itemsList: {
    gap: spacing[3],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemQty: {
    fontSize: typography.fontSize.body,
    width: 30,
  },
  itemName: {
    flex: 1,
    fontSize: typography.fontSize.body,
  },
  itemPrice: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
  },
  totalLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  totalValue: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
  },
  addressCard: {
    marginBottom: spacing[4],
  },
  addressContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[3],
  },
  addressText: {
    flex: 1,
  },
  addressLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  addressStreet: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
  },
  addressInstructions: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
  actions: {
    marginBottom: spacing[4],
  },
  // Loading & Error states
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    marginTop: spacing[3],
  },
  errorText: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[4],
  },
  errorSubtext: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    marginTop: spacing[2],
  },
  // Driver loading
  driverLoading: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    paddingVertical: spacing[2],
  },
  driverLoadingText: {
    fontSize: typography.fontSize.body,
  },
  // Item details
  itemDetails: {
    flex: 1,
  },
  itemVariant: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  itemCustomizations: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  // Totals section
  totalsSection: {
    marginTop: spacing[4],
    paddingTop: spacing[4],
    borderTopWidth: 1,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[2],
  },
  totalLineLabel: {
    fontSize: typography.fontSize.bodySm,
  },
  totalLineValue: {
    fontSize: typography.fontSize.bodySm,
  },
  // Payment card
  paymentCard: {
    marginBottom: spacing[4],
  },
  paymentInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  paymentMethod: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  paymentMethodText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  paymentStatusBadge: {
    paddingVertical: spacing[1],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.pill,
  },
  paymentStatusText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default OrderTrackingScreen;
