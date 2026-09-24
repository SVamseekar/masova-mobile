/**
 * Orders — food-app style list (active + past)
 */

import React, { useState, useCallback, useMemo } from 'react';
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
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreCurrency } from '../../hooks/useStoreCurrency';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, Badge, Button } from '../../components/ui';
import { MenuDishImage } from '../../components/menu/MenuDishImage';
import { RootStackParamList, Order } from '../../types';
import GuestPromptView from '../../components/GuestPromptView';
import { orderApi } from '../../services/api';
import { getListPerfProps } from '../../utils/listPerf';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type FilterTab = 'all' | 'active' | 'past';

const isActiveOrder = (status: string) => {
  return !['DELIVERED', 'COMPLETED', 'SERVED', 'CANCELLED'].includes(status);
};

const statusLabel = (status: string) => {
  const map: Record<string, string> = {
    PENDING: 'Pending',
    RECEIVED: 'Received',
    PREPARING: 'Preparing',
    OVEN: 'In kitchen',
    BAKED: 'Ready',
    READY: 'Ready',
    DISPATCHED: 'On the way',
    OUT_FOR_DELIVERY: 'Out for delivery',
    DELIVERED: 'Delivered',
    COMPLETED: 'Completed',
    SERVED: 'Served',
    CANCELLED: 'Cancelled',
  };
  return map[status] || status;
};

const OrderHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { formatMoney, locale } = useStoreCurrency();
  const formatPrice = formatMoney;

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<FilterTab>('all');

  const fetchOrders = useCallback(async () => {
    if (!user?.id) return;

    try {
      setError(null);
      const response = await orderApi.getCustomerOrders(user.id);
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

  const filtered = useMemo(() => {
    if (filter === 'active') return orders.filter((o) => isActiveOrder(o.status));
    if (filter === 'past') return orders.filter((o) => !isActiveOrder(o.status));
    return orders;
  }, [orders, filter]);

  if (!isAuthenticated) {
    return (
      <GuestPromptView
        screenName="Orders"
        icon="receipt-outline"
        description="Sign in to view your past orders and track deliveries."
      />
    );
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today · ${date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString(locale, { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const getStatusVariant = (status: string) => {
    switch (status) {
      case 'DELIVERED':
      case 'COMPLETED':
      case 'SERVED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      case 'DISPATCHED':
      case 'OUT_FOR_DELIVERY':
        return 'warning';
      default:
        return 'primary';
    }
  };

  const itemSummary = (order: Partial<Order>) => {
    const items = order.items || [];
    if (items.length === 0) return 'Order items';
    const first = items
      .slice(0, 2)
      .map((i) => `${i.quantity}× ${i.name}`)
      .join(', ');
    if (items.length > 2) return `${first} +${items.length - 2} more`;
    return first;
  };

  const thumbName = (order: Partial<Order>) => order.items?.[0]?.name;

  const renderOrder = ({ item }: { item: Partial<Order> }) => {
    const active = isActiveOrder(item.status || '');
    return (
      <TouchableOpacity
        activeOpacity={0.92}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          navigation.navigate('OrderDetail', { orderId: item.id! });
        }}
      >
        <Card
          elevation="sm"
          style={{
            ...styles.orderCard,
            borderColor: active ? 'rgba(255,208,0,0.5)' : theme.colors.border,
            borderWidth: active ? 1.5 : StyleSheet.hairlineWidth,
          }}
        >
          <View style={styles.cardTop}>
            <MenuDishImage
              name={thumbName(item)}
              style={styles.thumb}
              placeholderColor={theme.colors.surface2}
              iconColor={theme.colors.text3}
            />
            <View style={styles.cardMain}>
              <View style={styles.rowBetween}>
                <Text style={[styles.orderNumber, { color: theme.colors.text1 }]} numberOfLines={1}>
                  {item.orderNumber || `#${item.id?.slice(-6)}`}
                </Text>
                <Badge
                  label={statusLabel(item.status || '')}
                  variant={getStatusVariant(item.status!) as any}
                  size="sm"
                />
              </View>
              <Text style={[styles.orderDate, { color: theme.colors.text2 }]}>
                {item.createdAt ? formatDate(item.createdAt) : ''}
              </Text>
              <Text style={[styles.itemText, { color: theme.colors.text2 }]} numberOfLines={2}>
                {itemSummary(item)}
              </Text>
              <View style={styles.metaRow}>
                <View style={styles.metaChip}>
                  <Ionicons
                    name={
                      item.orderType === 'TAKEAWAY' || item.orderType === 'COLLECTION'
                        ? 'bag-handle-outline'
                        : 'bicycle-outline'
                    }
                    size={12}
                    color={theme.colors.text3}
                  />
                  <Text style={[styles.metaChipText, { color: theme.colors.text3 }]}>
                    {item.orderType === 'TAKEAWAY' || item.orderType === 'COLLECTION'
                      ? 'Takeaway'
                      : 'Delivery'}
                  </Text>
                </View>
                <Text style={[styles.orderTotal, { color: theme.colors.text1 }]}>
                  {formatPrice(item.total ?? 0)}
                </Text>
              </View>
            </View>
          </View>

          <View style={[styles.actions, { borderTopColor: theme.colors.border }]}>
            {active ? (
              <TouchableOpacity
                style={styles.primaryAction}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigation.navigate('OrderTracking', { orderId: item.id! });
                }}
              >
                <Ionicons name="navigate" size={16} color="#0F0F0F" />
                <Text style={styles.primaryActionText}>Track order</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.secondaryAction, { borderColor: theme.colors.border }]}
                onPress={() => navigation.navigate('OrderDetail', { orderId: item.id! })}
              >
                <Text style={[styles.secondaryActionText, { color: theme.colors.text1 }]}>
                  View details
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.secondaryAction, { borderColor: theme.colors.border }]}
              onPress={() => navigation.navigate('OrderDetail', { orderId: item.id! })}
            >
              <Ionicons name="receipt-outline" size={16} color={theme.colors.text2} />
              <Text style={[styles.secondaryActionText, { color: theme.colors.text2 }]}>
                Bill
              </Text>
            </TouchableOpacity>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  const tabs: { id: FilterTab; label: string }[] = [
    { id: 'all', label: 'All' },
    { id: 'active', label: 'Active' },
    { id: 'past', label: 'Past' },
  ];

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Orders</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text3 }]}>
          {orders.length} total
        </Text>
      </View>

      <View style={styles.tabs}>
        {tabs.map((t) => {
          const selected = filter === t.id;
          return (
            <TouchableOpacity
              key={t.id}
              onPress={() => {
                Haptics.selectionAsync();
                setFilter(t.id);
              }}
              style={[
                styles.tab,
                {
                  backgroundColor: selected ? '#FFD000' : theme.colors.surface2,
                },
              ]}
            >
              <Text
                style={[
                  styles.tabText,
                  { color: selected ? '#0F0F0F' : theme.colors.text2 },
                ]}
              >
                {t.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#FFD000" />
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
          <Text style={[styles.errorSubtitle, { color: theme.colors.text2 }]}>{error}</Text>
          <Button title="Retry" variant="secondary" size="sm" onPress={fetchOrders} />
        </View>
      ) : (
        <FlatList
          data={filtered}
          renderItem={renderOrder}
          keyExtractor={(item) => item.id!}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          {...getListPerfProps()}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FFD000']}
              tintColor="#FFD000"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="receipt-outline" size={64} color={theme.colors.text3} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>
                {filter === 'active' ? 'No active orders' : 'No orders yet'}
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text2 }]}>
                {filter === 'active'
                  ? 'When you place an order, track it here'
                  : 'Your delicious history will show up here'}
              </Text>
              <Button
                title="Browse menu"
                variant="primary"
                size="sm"
                onPress={() => navigation.navigate('Main', { screen: 'Search' })}
                style={{ marginTop: spacing[4] }}
              />
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.headline,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[2],
    marginBottom: spacing[3],
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  tabText: {
    fontSize: 13,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  listContent: {
    padding: spacing.screenPadding,
    paddingTop: 0,
    gap: spacing[3],
    paddingBottom: spacing[10],
  },
  orderCard: {
    marginBottom: spacing[1],
    overflow: 'hidden',
  },
  cardTop: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  thumb: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.md,
  },
  cardMain: { flex: 1 },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: spacing[2],
  },
  orderNumber: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  orderDate: {
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  itemText: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
    lineHeight: 18,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  metaChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metaChipText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  orderTotal: {
    fontSize: typography.fontSize.body,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  actions: {
    flexDirection: 'row',
    gap: spacing[2],
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  primaryAction: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FFD000',
    paddingVertical: 10,
    borderRadius: borderRadius.md,
  },
  primaryActionText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F0F0F',
    fontSize: 13,
  },
  secondaryAction: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: borderRadius.md,
    borderWidth: StyleSheet.hairlineWidth,
  },
  secondaryActionText: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: 13,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[16],
    paddingHorizontal: spacing[4],
  },
  emptyTitle: {
    fontSize: typography.fontSize.titleSm,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing[2],
    textAlign: 'center',
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
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: spacing[2],
  },
  errorSubtitle: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
  },
});

export default OrderHistoryScreen;
