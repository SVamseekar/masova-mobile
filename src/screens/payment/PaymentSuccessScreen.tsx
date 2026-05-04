/**
 * Payment Success Screen
 * Confirmation screen after successful payment
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography } from '../../styles';
import { Button } from '../../components/ui';
import { RootStackParamList } from '../../types';
import { useCart } from '../../contexts/CartContext';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'PaymentSuccess'>;

const PaymentSuccessScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();
  const { clearCart } = useCart();

  const { orderId } = route.params;

  const scaleAnim = React.useRef(new Animated.Value(0)).current;
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const hasCleared = useRef(false);

  useEffect(() => {
    // Success haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Clear cart only once
    if (!hasCleared.current) {
      hasCleared.current = true;
      clearCart();
    }

    // Store active order ID for tracking
    AsyncStorage.setItem('activeOrderId', orderId);

    // Animate success icon
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-clear active order after 1 minute if delivered
    const timeout = setTimeout(() => {
      AsyncStorage.removeItem('activeOrderId');
    }, 60000);

    return () => clearTimeout(timeout);
  }, [orderId, scaleAnim, fadeAnim, clearCart]);

  const handleTrackOrder = () => {
    navigation.replace('OrderTracking', { orderId });
  };

  const handleContinueShopping = () => {
    navigation.navigate('Main', { screen: 'Menu' } as any);
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.content, { paddingTop: insets.top + spacing[6] }]}>
        {/* Success Animation */}
        <Animated.View
          style={[
            styles.successIcon,
            {
              backgroundColor: `${theme.colors.semantic.success}15`,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          <Ionicons
            name="checkmark-circle"
            size={80}
            color={theme.colors.semantic.success}
          />
        </Animated.View>

        <Animated.View style={[styles.textContent, { opacity: fadeAnim }]}>
          <Text style={[styles.title, { color: theme.colors.text1 }]}>
            Payment Successful!
          </Text>

          <Text style={[styles.subtitle, { color: theme.colors.text2 }]}>
            Your order has been placed successfully
          </Text>

          <View style={[styles.orderCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.orderRow}>
              <Text style={[styles.orderLabel, { color: theme.colors.text2 }]}>
                Order ID
              </Text>
              <Text
                style={[styles.orderValue, { color: '#FFD000' }]}
                selectable
              >
                {orderId}
              </Text>
            </View>
          </View>

          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle-outline"
              size={20}
              color={theme.colors.text2}
            />
            <Text style={[styles.infoText, { color: theme.colors.text2 }]}>
              You will receive order updates via email and push notifications
            </Text>
          </View>
        </Animated.View>

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <Button
            title="Track Order"
            onPress={handleTrackOrder}
            variant="primary"
            size="lg"
            style={styles.button}

          />

          <TouchableOpacity
            style={[styles.secondaryButton, { borderColor: theme.colors.border }]}
            onPress={handleContinueShopping}
            activeOpacity={0.7}
          >
            <Ionicons name="storefront-outline" size={20} color={'#FFD000'} />
            <Text style={[styles.secondaryButtonText, { color: '#FFD000' }]}>
              Continue Shopping
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[6],
  },
  successIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing[8],
  },
  textContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  title: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
    textAlign: 'center',
    marginTop: spacing[6],
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    marginBottom: spacing[6],
  },
  orderCard: {
    width: '100%',
    padding: spacing[5],
    borderRadius: borderRadius.lg,
    marginBottom: spacing[5],
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  orderLabel: {
    fontSize: typography.fontSize.body,
  },
  orderValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
    paddingHorizontal: spacing[4],
    maxWidth: 320,
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    lineHeight: 18,
  },
  buttonContainer: {
    width: '100%',
    gap: spacing[3],
  },
  button: {
    width: '100%',
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing[2],
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default PaymentSuccessScreen;
