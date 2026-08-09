/**
 * Order History Screen
 * List of past orders
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, Badge, Button } from '../../components/ui';
import { RootStackParamList, Order } from '../../types';
import GuestPromptView from '../../components/GuestPromptView';
import { orderApi, customerApi } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper to check if order is active (can be tracked)
const isActiveOrder = (status: string) => {
  return !['DELIVERED', 'COMPLETED', 'SERVED', 'CANCELLED'].includes(status);
};

const OrderHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const customer = await customerApi.getByUserId(user.id);
      const customerId = customer.id;

      const response = await orderApi.getCustomerOrders(customerId);
      const rawOrders = Array.isArray(response) ? response : (response as any).content || [];
      const sortedOrders = [...rawOrders].sort(
        (a: Order, b: Order) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      setOrders(sortedOrders);
    } catch (err: any) {
      console.error('Failed to fetch orders:', err);
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  // Fetch orders on mount and when screen gains focus
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        fetchOrders();
      }
    }, [isAuthenticated, user?.id, fetchOrders])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchOrders();
  };

  // Show guest prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <GuestPromptView
        screenName="Order History"
        icon="receipt-outline"
        description="Sign in to view your past orders and track your order history."
      />
    );
  }

  // Backend stores prices in rupees (not paise), so no need to divide
  const formatPrice = (price: number) => `₹${Math.round(price)}`;

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'SERVED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'primary';
    }
  };

  const renderOrder = ({ item }: { item: Partial<Order> }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('OrderDetail', { orderId: item.id! })}
    >
      <Card elevation="sm" style={styles.orderCard}>
        <View style={styles.orderHeader}>
          <View>
            <Text style={[styles.orderNumber, { color: theme.colors.text1 }]}>
              {item.orderNumber}
            </Text>
            <Text style={[styles.orderDate, { color: theme.colors.text2 }]}>
              {formatDate(item.createdAt!)}
            </Text>
          </View>
          <Badge
            label={item.status!}
            variant={getStatusVariant(item.status!) as any}
            size="sm"
          />
        </View>

        <View style={[styles.orderDivider, { backgroundColor: theme.colors.border }]} />

        <View style={styles.orderItems}>
          {item.items?.slice(0, 2).map((orderItem, index) => (
            <Text
              key={index}
              style={[styles.itemText, { color: theme.colors.text2 }]}
              numberOfLines={1}
            >
              {orderItem.quantity}x {orderItem.name}
            </Text>
          ))}
          {(item.items?.length || 0) > 2 && (
            <Text style={[styles.moreItems, { color: theme.colors.text3 }]}>
              +{(item.items?.length || 0) - 2} more items
            </Text>
          )}
        </View>

        <View style={styles.orderFooter}>
          <Text style={[styles.orderTotal, { color: theme.colors.text1 }]}>
            {formatPrice(item.total!)}
          </Text>
          {isActiveOrder(item.status!) ? (
            <Button
              title="Track"
              variant="primary"
              size="sm"
              onPress={() => navigation.navigate('OrderTracking', { orderId: item.id! })}
            />
          ) : item.status === 'DELIVERED' || item.status === 'COMPLETED' ? (
            <Button
              title="Reorder"
              variant="secondary"
              size="sm"
              onPress={() => {}}
            />
          ) : null}
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Order History</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={'#FFD000'} />
          <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
            Loading orders...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.semantic.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text1 }]}>
            Failed to load orders
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.colors.text2 }]}>
            {error}
          </Text>
          <Button title="Retry" variant="secondary" size="sm" onPress={fetchOrders} />
        </View>
      ) : (
        <FlatList
          data={orders}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FFD000']}
              tintColor={'#FFD000'}
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={theme.colors.text3} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>
                No orders yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text2 }]}>
                Your order history will appear here
              </Text>
            </View>
          }
        />
      )}
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
  listContent: {
    padding: spacing.screenPadding,
    gap: spacing[3],
  },
  orderCard: {
    marginBottom: spacing[2],
  },
  orderHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  orderNumber: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  orderDate: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  orderDivider: {
    height: 1,
    marginVertical: spacing[3],
  },
  orderItems: {
    gap: spacing[1],
  },
  itemText: {
    fontSize: typography.fontSize.bodySm,
  },
  moreItems: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  orderFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[4],
  },
  orderTotal: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[20],
  },
  emptyTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing[2],
  },
  loadingContainer: {
    flex: 1,
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
});

export default OrderHistoryScreen;
