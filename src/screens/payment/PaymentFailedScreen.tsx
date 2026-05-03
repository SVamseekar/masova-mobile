/**
 * Payment Failed Screen
 * Error screen for failed payment attempts
 */

import React, { useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography } from '../../styles';
import { Button, Card } from '../../components/ui';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'PaymentFailed'>;

interface FailureReason {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const COMMON_REASONS: FailureReason[] = [
  {
    icon: 'card-outline',
    title: 'Insufficient Funds',
    description: 'Your card may not have sufficient balance',
  },
  {
    icon: 'ban-outline',
    title: 'Payment Declined',
    description: 'Your bank declined the transaction',
  },
  {
    icon: 'wifi-outline',
    title: 'Network Issue',
    description: 'Connection was interrupted during payment',
  },
  {
    icon: 'alert-circle-outline',
    title: 'Incorrect Details',
    description: 'Card number, CVV, or OTP may be incorrect',
  },
];

const PaymentFailedScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  const { orderId, error } = route.params;

  useEffect(() => {
    // Error haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  }, []);

  const handleTryAgain = () => {
    // Navigate back to checkout to retry payment
    navigation.goBack();
  };

  const handleBackToMenu = () => {
    navigation.navigate('Main', { screen: 'Menu' } as any);
  };

  const handleContactSupport = () => {
    // TODO: Open support chat or email
    console.log('Contact support');
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[4],
            backgroundColor: theme.colors.surface1,
          },
        ]}
      >
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleBackToMenu}
        >
          <Ionicons name="close" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Error Icon */}
        <View
          style={[
            styles.errorIcon,
            { backgroundColor: `${theme.colors.semantic.error}15` },
          ]}
        >
          <Ionicons
            name="close-circle"
            size={80}
            color={theme.colors.semantic.error}
          />
        </View>

        <Text style={[styles.title, { color: theme.colors.text1 }]}>
          Payment Failed
        </Text>

        <Text style={[styles.subtitle, { color: theme.colors.text2 }]}>
          {error || 'We could not process your payment. Please try again.'}
        </Text>

        {/* Order Info */}
        <Card elevation="sm" style={styles.orderCard}>
          <View style={styles.orderRow}>
            <Text style={[styles.orderLabel, { color: theme.colors.text2 }]}>
              Order ID
            </Text>
            <Text style={[styles.orderValue, { color: theme.colors.text1 }]}>
              {orderId}
            </Text>
          </View>
          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
          <View style={styles.infoBox}>
            <Ionicons
              name="information-circle"
              size={18}
              color={theme.colors.semantic.warning}
            />
            <Text style={[styles.infoText, { color: theme.colors.text2 }]}>
              Your order is saved but not confirmed. Cart items are preserved.
            </Text>
          </View>
        </Card>

        {/* Common Reasons */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Common Reasons for Payment Failure
          </Text>

          {COMMON_REASONS.map((reason, index) => (
            <View
              key={index}
              style={[
                styles.reasonCard,
                { backgroundColor: theme.colors.surface },
              ]}
            >
              <View
                style={[
                  styles.reasonIcon,
                  { backgroundColor: theme.colors.surface2 },
                ]}
              >
                <Ionicons
                  name={reason.icon}
                  size={20}
                  color={theme.colors.text2}
                />
              </View>
              <View style={styles.reasonContent}>
                <Text style={[styles.reasonTitle, { color: theme.colors.text1 }]}>
                  {reason.title}
                </Text>
                <Text style={[styles.reasonDescription, { color: theme.colors.text2 }]}>
                  {reason.description}
                </Text>
              </View>
            </View>
          ))}
        </View>

        {/* Help Section */}
        <TouchableOpacity
          style={[styles.helpCard, { backgroundColor: theme.colors.surface }]}
          onPress={handleContactSupport}
          activeOpacity={0.7}
        >
          <Ionicons
            name="headset-outline"
            size={24}
            color={'#FFD000'}
          />
          <View style={styles.helpContent}>
            <Text style={[styles.helpTitle, { color: theme.colors.text1 }]}>
              Need Help?
            </Text>
            <Text style={[styles.helpDescription, { color: theme.colors.text2 }]}>
              Contact our support team for assistance
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={20}
            color={theme.colors.text3}
          />
        </TouchableOpacity>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Action Buttons */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing[4],
            backgroundColor: theme.colors.surface1,
          },
        ]}
      >
        <Button
          title="Try Again"
          onPress={handleTryAgain}
          variant="primary"
          size="lg"
          style={styles.button}
          icon="refresh-outline"
        />

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={handleBackToMenu}
          activeOpacity={0.7}
        >
          <Text style={[styles.secondaryButtonText, { color: theme.colors.text2 }]}>
            Back to Menu
          </Text>
        </TouchableOpacity>
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
    justifyContent: 'flex-end',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[4],
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    alignItems: 'center',
  },
  errorIcon: {
    width: 160,
    height: 160,
    borderRadius: 80,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    marginBottom: spacing[6],
    paddingHorizontal: spacing[4],
    lineHeight: 22,
  },
  orderCard: {
    width: '100%',
    padding: spacing[4],
    marginBottom: spacing[6],
  },
  orderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  orderLabel: {
    fontSize: typography.fontSize.body,
  },
  orderValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  divider: {
    height: 1,
    marginBottom: spacing[3],
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    lineHeight: 18,
  },
  section: {
    width: '100%',
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[4],
  },
  reasonCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
    gap: spacing[3],
  },
  reasonIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  reasonContent: {
    flex: 1,
  },
  reasonTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  reasonDescription: {
    fontSize: typography.fontSize.caption,
    lineHeight: 18,
  },
  helpCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.md,
    width: '100%',
    gap: spacing[3],
  },
  helpContent: {
    flex: 1,
  },
  helpTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  helpDescription: {
    fontSize: typography.fontSize.caption,
  },
  footer: {
    paddingTop: spacing[4],
    paddingHorizontal: spacing.screenPadding,
  },
  button: {
    width: '100%',
    marginBottom: spacing[3],
  },
  secondaryButton: {
    alignItems: 'center',
    paddingVertical: spacing[2],
  },
  secondaryButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
});

export default PaymentFailedScreen;
