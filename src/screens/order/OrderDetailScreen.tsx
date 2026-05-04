/**
 * Order Detail Screen
 * Detailed view of a past order
 */

import React, { useEffect, useState } from 'react';
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
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, Badge, Button } from '../../components/ui';
import { orderApi } from '../../services/api';
import { Order, RootStackParamList } from '../../types';

type RouteProps = RouteProp<RootStackParamList, 'OrderDetail'>;
type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper to check if order is active (can be tracked)
const isActiveOrder = (status: string) => {
  return !['DELIVERED', 'COMPLETED', 'CANCELLED'].includes(status);
};

const OrderDetailScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { orderId } = route.params;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchOrder();
  }, [orderId]);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await orderApi.getById(orderId);
      setOrder(data);
    } catch (err: any) {
      console.error('Failed to fetch order:', err);
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `₹${Math.round(price)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'SERVED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'PREPARING':
      case 'OVEN':
      case 'BAKED':
        return 'warning';
      default:
        return 'primary';
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={'#FFD000'} />
        <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
          Loading order details...
        </Text>
      </View>
    );
  }

  if (error || !order) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
          </TouchableOpacity>
          <Text style={[styles.title, { color: theme.colors.text1 }]}>Order Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.semantic.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text1 }]}>
            Failed to load order
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.colors.text2 }]}>
            {error || 'Order not found'}
          </Text>
          <Button title="Retry" variant="secondary" size="sm" onPress={fetchOrder} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Order Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Order Info */}
        <Card elevation="sm" style={styles.card}>
          <View style={styles.orderHeader}>
            <View>
              <Text style={[styles.orderNumber, { color: theme.colors.text1 }]}>
                #{order.orderNumber}
              </Text>
              <Text style={[styles.orderDate, { color: theme.colors.text2 }]}>
                {formatDate(order.createdAt)}
              </Text>
            </View>
            <Badge label={order.status} variant={getStatusVariant(order.status) as any} />
          </View>
        </Card>

        {/* Items */}
        <Card elevation="sm" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Items</Text>
          {order.items?.map((item, index) => (
            <View
              key={item.id || index}
              style={[styles.itemRow, { borderBottomColor: theme.colors.border }]}
            >
              <Text style={[styles.itemQty, { color: theme.colors.text2 }]}>{item.quantity}x</Text>
              <Text style={[styles.itemName, { color: theme.colors.text1 }]}>
                {item.name}{item.variant ? ` (${item.variant})` : ''}
              </Text>
              <Text style={[styles.itemPrice, { color: theme.colors.text1 }]}>
                {formatPrice(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </Card>

        {/* Bill */}
        <Card elevation="sm" style={styles.card}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Bill Details</Text>
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: theme.colors.text2 }]}>Item Total</Text>
            <Text style={[styles.billValue, { color: theme.colors.text1 }]}>
              {formatPrice(order.subtotal)}
            </Text>
          </View>
          {order.deliveryFee > 0 && (
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.colors.text2 }]}>Delivery Fee</Text>
              <Text style={[styles.billValue, { color: theme.colors.text1 }]}>
                {formatPrice(order.deliveryFee)}
              </Text>
            </View>
          )}
          <View style={styles.billRow}>
            <Text style={[styles.billLabel, { color: theme.colors.text2 }]}>Taxes</Text>
            <Text style={[styles.billValue, { color: theme.colors.text1 }]}>
              {formatPrice(order.tax)}
            </Text>
          </View>
          <View style={[styles.billDivider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.billRow}>
            <Text style={[styles.billTotal, { color: theme.colors.text1 }]}>Total</Text>
            <Text style={[styles.billTotalValue, { color: theme.colors.text1 }]}>
              {formatPrice(order.total)}
            </Text>
          </View>
        </Card>

        {/* Address - only show for delivery orders */}
        {order.orderType === 'DELIVERY' && order.deliveryAddress && (
          <Card elevation="sm" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Delivered To</Text>
            <View style={styles.addressRow}>
              <Ionicons name="location" size={20} color={'#FFD000'} />
              <View style={styles.addressText}>
                <Text style={[styles.addressLabel, { color: theme.colors.text1 }]}>
                  {order.deliveryAddress.label || 'Address'}
                </Text>
                <Text style={[styles.addressStreet, { color: theme.colors.text2 }]}>
                  {order.deliveryAddress.street}
                  {order.deliveryAddress.city && `, ${order.deliveryAddress.city}`}
                  {order.deliveryAddress.zipCode && ` - ${order.deliveryAddress.zipCode}`}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Order Type Info for non-delivery orders */}
        {order.orderType !== 'DELIVERY' && (
          <Card elevation="sm" style={styles.card}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Order Type</Text>
            <View style={styles.addressRow}>
              <Ionicons
                name={order.orderType === 'DINE_IN' ? 'restaurant' : 'bag-handle'}
                size={20}
                color={'#FFD000'}
              />
              <View style={styles.addressText}>
                <Text style={[styles.addressLabel, { color: theme.colors.text1 }]}>
                  {order.orderType === 'DINE_IN' ? 'Dine In' : 'Takeaway'}
                </Text>
              </View>
            </View>
          </Card>
        )}

        {/* Actions */}
        <View style={styles.actions}>
          {/* Track Order button for active orders */}
          {isActiveOrder(order.status) && (
            <Button
              title="Track Order"
              onPress={() => navigation.navigate('OrderTracking', { orderId: order.id })}
              fullWidth
            />
          )}
          <Button title="Reorder" onPress={() => {}} variant={isActiveOrder(order.status) ? 'secondary' : 'primary'} fullWidth />
          <Button title="Need Help?" variant="secondary" onPress={() => {}} fullWidth />
        </View>

        <View style={{ height: spacing[10] }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    marginTop: spacing[3],
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[3],
  },
  errorTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: spacing[2],
  },
  errorSubtitle: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
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
    padding: spacing.screenPadding,
  },
  card: {
    marginBottom: spacing[4],
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  orderDate: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: spacing[4],
  },
  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
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
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  billLabel: {
    fontSize: typography.fontSize.body,
  },
  billValue: {
    fontSize: typography.fontSize.body,
  },
  billDivider: {
    height: 1,
    marginVertical: spacing[2],
  },
  billTotal: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  billTotalValue: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  addressRow: {
    flexDirection: 'row',
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
    lineHeight: typography.lineHeight.bodySm,
  },
  actions: {
    gap: spacing[3],
    marginTop: spacing[2],
  },
});

export default OrderDetailScreen;
