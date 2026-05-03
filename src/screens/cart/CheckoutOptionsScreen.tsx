/**
 * Checkout Options Screen
 * Shows 3 options: Login, Create Account, or Continue as Guest
 * Mirrors web app's /checkout page
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography } from '../../styles';
import { Card } from '../../components/ui';
import { RootStackParamList } from '../../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface OptionCardProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
  buttonText: string;
  onPress: () => void;
  isPrimary?: boolean;
}

const CheckoutOptionsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  // If already logged in, skip this screen and go directly to Checkout
  React.useEffect(() => {
    if (isAuthenticated) {
      navigation.replace('Checkout', {});
    }
  }, [isAuthenticated, navigation]);

  const OptionCard: React.FC<OptionCardProps> = ({
    icon,
    title,
    description,
    buttonText,
    onPress,
    isPrimary = false,
  }) => (
    <Card elevation="md" style={styles.optionCard}>
      <View
        style={[
          styles.iconContainer,
          {
            backgroundColor: isPrimary
              ? '#FFD000'
              : theme.colors.surface2,
          },
        ]}
      >
        <Ionicons
          name={icon}
          size={32}
          color={isPrimary ? '#FFFFFF' : '#FFD000'}
        />
      </View>

      <Text style={[styles.optionTitle, { color: theme.colors.text1 }]}>
        {title}
      </Text>

      <Text style={[styles.optionDescription, { color: theme.colors.text2 }]}>
        {description}
      </Text>

      <TouchableOpacity
        style={[
          styles.optionButton,
          {
            backgroundColor: isPrimary
              ? '#FFD000'
              : theme.colors.surface2,
          },
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.optionButtonText,
            {
              color: isPrimary ? '#FFFFFF' : '#FFD000',
            },
          ]}
        >
          {buttonText}
        </Text>
        <Ionicons
          name="arrow-forward"
          size={20}
          color={isPrimary ? '#FFFFFF' : '#FFD000'}
        />
      </TouchableOpacity>
    </Card>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
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
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text1 }]}>
          Checkout
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <Text style={[styles.pageTitle, { color: theme.colors.text1 }]}>
          Choose How to Continue
        </Text>
        <Text style={[styles.pageSubtitle, { color: theme.colors.text2 }]}>
          Select your preferred checkout method
        </Text>

        {/* Login Option */}
        <OptionCard
          icon="log-in-outline"
          title="Login to Your Account"
          description="Access your saved addresses, payment methods, and order history for a faster checkout experience."
          buttonText="Login"
          onPress={() => navigation.navigate('Auth')}
          isPrimary={false}
        />

        {/* Create Account Option */}
        <OptionCard
          icon="person-add-outline"
          title="Create New Account"
          description="Join MaSoVa to enjoy exclusive benefits, track orders, earn rewards, and save your preferences."
          buttonText="Create Account"
          onPress={() => navigation.navigate('Auth')}
          isPrimary={false}
        />

        {/* Guest Checkout Option */}
        <OptionCard
          icon="flash-outline"
          title="Continue as Guest"
          description="Quick checkout without creating an account. You can always create one later to track your order."
          buttonText="Continue as Guest"
          onPress={() => navigation.navigate('GuestCheckout', { returnFromAuth: false })}
          isPrimary={true}
        />

        {/* Info Section */}
        <View style={[styles.infoBox, { backgroundColor: `${'#FFD000'}10` }]}>
          <Ionicons
            name="information-circle"
            size={20}
            color={'#FFD000'}
          />
          <Text style={[styles.infoText, { color: theme.colors.text2 }]}>
            All checkout options are secure and your information is protected.
          </Text>
        </View>

        <View style={{ height: 60 }} />
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing[6],
  },
  pageTitle: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[2],
  },
  pageSubtitle: {
    fontSize: typography.fontSize.body,
    marginBottom: spacing[6],
  },
  optionCard: {
    padding: spacing[5],
    marginBottom: spacing[4],
    alignItems: 'center',
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[4],
  },
  optionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    marginBottom: spacing[2],
    textAlign: 'center',
  },
  optionDescription: {
    fontSize: typography.fontSize.bodySm,
    textAlign: 'center',
    marginBottom: spacing[5],
    lineHeight: 20,
  },
  optionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[6],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  optionButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.md,
    gap: spacing[3],
    marginTop: spacing[2],
  },
  infoText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    lineHeight: 18,
  },
});

export default CheckoutOptionsScreen;
