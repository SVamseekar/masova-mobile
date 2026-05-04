/**
 * Notifications Screen
 * List of user notifications from backend API
 */

import React, { useState, useCallback } from 'react';
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
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, typography } from '../../styles';
import { RootStackParamList } from '../../types';
import { Card } from '../../components/ui';
import { Notification } from '../../types';
import { notificationApi } from '../../services/api';
import GuestPromptView from '../../components/GuestPromptView';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NotificationsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  // Fetch notifications from API
  const {
    data: notifications = [],
    isLoading,
    error,
    refetch,
  } = useQuery<Notification[]>({
    queryKey: ['notifications', user?.id],
    queryFn: () => (user?.id ? notificationApi.getAll(user.id) : Promise.resolve([])),
    enabled: !!user?.id && isAuthenticated,
    staleTime: 1000 * 60 * 2, // 2 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });

  // Mark notification as read mutation
  const markAsReadMutation = useMutation({
    mutationFn: (notificationId: string) => notificationApi.markAsRead(notificationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Mark all as read mutation
  const markAllReadMutation = useMutation({
    mutationFn: () => (user?.id ? notificationApi.markAllRead(user.id) : Promise.resolve()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications', user?.id] });
    },
  });

  // Handle refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Handle notification tap
  const handleNotificationTap = (notification: Notification) => {
    // Mark as read if not already
    if (!notification.isRead) {
      markAsReadMutation.mutate(notification.id);
    }

    // Navigate based on notification type
    if (notification.type === 'ORDER_UPDATE' && notification.data?.orderId) {
      navigation.navigate('OrderTracking', { orderId: notification.data.orderId });
    } else if (notification.type === 'DELIVERY' && notification.data?.orderId) {
      navigation.navigate('OrderTracking', { orderId: notification.data.orderId });
    } else if (notification.type === 'PROMOTION') {
      navigation.navigate('Main');
    }
  };

  // Handle mark all read
  const handleMarkAllRead = () => {
    markAllReadMutation.mutate();
  };

  // Show guest prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <GuestPromptView
        screenName="Notifications"
        icon="notifications-outline"
        description="Sign in to receive personalized notifications about your orders and exclusive offers."
      />
    );
  }

  const getNotificationIcon = (type: Notification['type']): keyof typeof Ionicons.glyphMap => {
    switch (type) {
      // Order updates
      case 'ORDER_UPDATE':
        return 'receipt-outline';
      // Delivery related
      case 'DELIVERY':
        return 'bicycle-outline';
      case 'DRIVER_ASSIGNED':
        return 'person-outline';
      case 'DRIVER_NEARBY':
        return 'navigate-outline';
      case 'DRIVER_ARRIVED':
        return 'location-outline';
      case 'DELIVERY_OTP':
        return 'key-outline';
      // Payment related
      case 'PAYMENT_SUCCESS':
        return 'checkmark-circle-outline';
      case 'PAYMENT_FAILED':
        return 'close-circle-outline';
      // Others
      case 'PROMOTION':
        return 'pricetag-outline';
      case 'SYSTEM':
        return 'information-circle-outline';
      default:
        return 'notifications-outline';
    }
  };

  const getNotificationColor = (type: Notification['type'], isRead: boolean) => {
    if (isRead) return theme.colors.text2;

    switch (type) {
      case 'PAYMENT_SUCCESS':
        return theme.colors.semantic.success;
      case 'PAYMENT_FAILED':
        return theme.colors.semantic.error;
      case 'PROMOTION':
        return theme.colors.accent || '#FFD000';
      case 'DRIVER_ARRIVED':
      case 'DELIVERY_OTP':
        return theme.colors.semantic.warning || '#FFD000';
      default:
        return '#FFD000';
    }
  };

  const getNotificationBgColor = (type: Notification['type'], isRead: boolean) => {
    if (isRead) return theme.colors.surface2;

    switch (type) {
      case 'PAYMENT_SUCCESS':
        return `${theme.colors.semantic.success}15`;
      case 'PAYMENT_FAILED':
        return `${theme.colors.semantic.error}15`;
      case 'PROMOTION':
        return `${theme.colors.accent || '#FFD000'}15`;
      default:
        return `${'#FFD000'}15`;
    }
  };

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Show loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={'#FFD000'} />
        <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
          Loading notifications...
        </Text>
      </View>
    );
  }

  // Show error state
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.bg }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.semantic.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.text1 }]}>
          Failed to load notifications
        </Text>
        <TouchableOpacity onPress={() => refetch()} style={styles.retryButton}>
          <Text style={[styles.retryText, { color: '#FFD000' }]}>
            Tap to retry
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  const renderNotification = ({ item }: { item: Notification }) => (
    <TouchableOpacity activeOpacity={0.9} onPress={() => handleNotificationTap(item)}>
      <Card
        elevation={item.isRead ? 'none' : 'sm'}
        style={{
          ...styles.notificationCard,
          ...(!item.isRead && { backgroundColor: `${'#FFD000'}08` }),
        }}
      >
        <View
          style={[
            styles.iconContainer,
            {
              backgroundColor: item.isRead
                ? theme.colors.surface2
                : `${'#FFD000'}15`,
            },
          ]}
        >
          <Ionicons
            name={getNotificationIcon(item.type)}
            size={22}
            color={item.isRead ? theme.colors.text2 : '#FFD000'}
          />
        </View>
        <View style={styles.content}>
          <View style={styles.headerRow}>
            <Text
              style={[
                styles.title,
                {
                  color: theme.colors.text1,
                  fontWeight: item.isRead
                    ? typography.fontWeight.medium
                    : typography.fontWeight.semibold,
                },
              ]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text style={[styles.time, { color: theme.colors.text3 }]}>
              {getTimeAgo(item.createdAt)}
            </Text>
          </View>
          <Text
            style={[styles.body, { color: theme.colors.text2 }]}
            numberOfLines={2}
          >
            {item.body}
          </Text>
        </View>
        {!item.isRead && (
          <View style={[styles.unreadDot, { backgroundColor: '#FFD000' }]} />
        )}
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text1 }]}>
          Notifications
        </Text>
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={handleMarkAllRead}
          disabled={markAllReadMutation.isPending || notifications.every(n => n.isRead)}
        >
          <Text
            style={[
              styles.markAllText,
              {
                color: notifications.some(n => !n.isRead)
                  ? '#FFD000'
                  : theme.colors.text3,
              },
            ]}
          >
            {markAllReadMutation.isPending ? 'Marking...' : 'Mark all read'}
          </Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={'#FFD000'}
            colors={['#FFD000']}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons
              name="notifications-off-outline"
              size={64}
              color={theme.colors.text3}
            />
            <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>
              No Notifications
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.text2 }]}>
              You're all caught up! Check back later.
            </Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    marginTop: spacing[3],
  },
  errorTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: spacing[4],
  },
  retryButton: {
    marginTop: spacing[3],
    padding: spacing[2],
  },
  retryText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[3],
  },
  backButton: {
    padding: spacing[1],
    marginRight: spacing[3],
  },
  headerTitle: {
    flex: 1,
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  markAllButton: {
    padding: spacing[1],
  },
  markAllText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
  },
  listContent: {
    padding: spacing.screenPadding,
    gap: spacing[3],
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing[4],
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  content: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[1],
  },
  title: {
    fontSize: typography.fontSize.body,
    flex: 1,
    marginRight: spacing[2],
  },
  time: {
    fontSize: typography.fontSize.caption,
  },
  body: {
    fontSize: typography.fontSize.bodySm,
    lineHeight: typography.lineHeight.bodySm,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    position: 'absolute',
    top: spacing[4],
    right: spacing[4],
  },
  emptyContainer: {
    flex: 1,
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
    textAlign: 'center',
  },
});

export default NotificationsScreen;
