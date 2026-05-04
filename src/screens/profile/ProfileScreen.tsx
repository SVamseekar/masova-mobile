/**
 * Profile Screen
 * User profile and settings
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, Badge } from '../../components/ui';
import { RootStackParamList, Customer } from '../../types';
import { customerApi } from '../../services/api';
import { AllergenType, ALLERGEN_LABELS } from '../../constants/allergens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper function to get tier badge color
const getTierColor = (tier?: string): string => {
  switch (tier) {
    case 'PLATINUM':
      return '#1a1a2e';
    case 'GOLD':
      return '#FFD700';
    case 'SILVER':
      return '#C0C0C0';
    case 'BRONZE':
    default:
      return '#CD7F32';
  }
};

// Helper function to get next tier info text
const getNextTierInfo = (tier?: string, points: number = 0): string => {
  switch (tier) {
    case 'PLATINUM':
      return 'You have reached the highest tier!';
    case 'GOLD':
      return `${formatNumber(10000 - points)} points to Platinum`;
    case 'SILVER':
      return `${formatNumber(5000 - points)} points to Gold`;
    case 'BRONZE':
    default:
      return `${formatNumber(1000 - points)} points to Silver`;
  }
};

// Helper function to format numbers with commas (Indian numbering system)
const formatNumber = (num: number): string => {
  const rounded = Math.round(num);
  return rounded.toLocaleString('en-IN');
};

interface MenuItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
  badge?: string;
  danger?: boolean;
  theme: any;
}

// MenuItem component defined outside ProfileScreen to avoid hook issues
const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, badge, danger, theme }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress}>
    <View
      style={[
        styles.menuIcon,
        {
          backgroundColor: danger
            ? `${theme.colors.semantic.error}15`
            : theme.colors.surface2,
        },
      ]}
    >
      <Ionicons
        name={icon}
        size={20}
        color={danger ? theme.colors.semantic.error : theme.colors.text2}
      />
    </View>
    <Text
      style={[
        styles.menuLabel,
        { color: danger ? theme.colors.semantic.error : theme.colors.text1 },
      ]}
    >
      {label}
    </Text>
    {badge && <Badge label={badge} variant="primary" size="sm" />}
    <Ionicons
      name="chevron-forward"
      size={20}
      color={theme.colors.text3}
    />
  </TouchableOpacity>
);

const ProfileScreen: React.FC = () => {
  const { theme, isDark, toggleTheme } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [customerData, setCustomerData] = useState<Customer | null>(null);

  const fetchCustomerData = useCallback(async () => {
    if (!user?.id || !user?.email || !user?.name) return;

    try {
      const customer = await customerApi.getByUserId(user.id);
      setCustomerData(customer);
    } catch (err: any) {
      // If customer doesn't exist (404), try to create one
      if (err?.response?.status === 404) {
        try {
          const newCustomer = await customerApi.getOrCreate({
            userId: user.id,
            email: user.email,
            name: user.name,
            phone: user.phone || '9999999999',
          });
          setCustomerData(newCustomer);
        } catch (createErr) {
          console.error('Failed to create customer:', createErr);
        }
      } else {
        console.error('Failed to fetch customer data:', err);
      }
    }
  }, [user?.id, user?.email, user?.name, user?.phone]);

  // Fetch customer data on mount, when screen gains focus, and when user logs in
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.id) {
        fetchCustomerData();
      }
    }, [isAuthenticated, user?.id, fetchCustomerData])
  );

  // Also fetch when isAuthenticated changes (e.g., after login)
  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchCustomerData();
    }
  }, [isAuthenticated, user?.id, fetchCustomerData]);

  // Redirect to auth if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      navigation.navigate('Auth');
    }
  }, [isAuthenticated, navigation]);

  // Show placeholder if user is not logged in
  if (!isAuthenticated || !user) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg, justifyContent: 'center', alignItems: 'center', padding: spacing[6] }]}>
        <Ionicons name="person-circle-outline" size={80} color={theme.colors.text3} />
        <Text style={[styles.guestTitle, { color: theme.colors.text1, marginTop: spacing[4] }]}>
          Sign in to view your profile
        </Text>
        <Text style={[styles.guestSubtitle, { color: theme.colors.text2, marginTop: spacing[2], textAlign: 'center' }]}>
          Create an account or sign in to track orders and manage your preferences
        </Text>
        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: '#FFD000', marginTop: spacing[6] }]}
          onPress={() => navigation.navigate('Auth')}
        >
          <Text style={[styles.signInButtonText, { color: '#FFFFFF' }]}>Sign In</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing[4] }]}
      >
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: '#FFD000' }]}>
            <Text style={styles.avatarText}>
              {user.name ? user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : 'U'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={[styles.userName, { color: theme.colors.text1 }]}>{user.name}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.text2 }]}>
              {user.email}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.editButton, { backgroundColor: theme.colors.surface2 }]}
          >
            <Ionicons name="pencil" size={18} color={theme.colors.text2} />
          </TouchableOpacity>
        </View>


        {/* Loyalty Card */}
        <View style={[styles.loyaltyCard, { backgroundColor: '#FFD000' }]}>
          {/* Header */}
          <View style={styles.loyaltyHeader}>
            <View>
              <Text style={styles.loyaltyLabel}>Loyalty Points</Text>
              <Text style={styles.loyaltyPoints}>
                {formatNumber(customerData?.loyaltyInfo?.totalPoints ?? 0)}
              </Text>
            </View>
            <View style={styles.loyaltyTierContainer}>
              <View style={[styles.tierBadge, { backgroundColor: getTierColor(customerData?.loyaltyInfo?.tier) }]}>
                <Text style={styles.tierBadgeText}>
                  {customerData?.loyaltyInfo?.tier || 'BRONZE'}
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressLabel}>
              {getNextTierInfo(customerData?.loyaltyInfo?.tier, customerData?.loyaltyInfo?.totalPoints ?? 0)}
            </Text>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${Math.min(((customerData?.loyaltyInfo?.totalPoints ?? 0) / 10000) * 100, 100)}%` }
                ]}
              />
            </View>
            <View style={styles.milestones}>
              <Text style={styles.milestoneText}>Bronze{'\n'}0</Text>
              <Text style={[styles.milestoneText, { textAlign: 'center' }]}>Silver{'\n'}1,000</Text>
              <Text style={[styles.milestoneText, { textAlign: 'center' }]}>Gold{'\n'}5,000</Text>
              <Text style={[styles.milestoneText, { textAlign: 'right' }]}>Platinum{'\n'}10,000</Text>
            </View>
          </View>

          {/* Stats */}
          <View style={styles.loyaltyStats}>
            <View style={styles.loyaltyStat}>
              <Text style={styles.loyaltyStatValue}>
                {customerData?.orderStats?.totalOrders ?? 0}
              </Text>
              <Text style={styles.loyaltyStatLabel}>Orders</Text>
            </View>
            <View style={styles.loyaltyStat}>
              <Text style={styles.loyaltyStatValue}>
                {customerData?.orderStats?.totalSpent
                  ? `₹${formatNumber(customerData.orderStats.totalSpent)}`
                  : '₹0'}
              </Text>
              <Text style={styles.loyaltyStatLabel}>Spent</Text>
            </View>
            <View style={styles.loyaltyStat}>
              <Text style={styles.loyaltyStatValue}>
                {customerData?.orderStats?.averageOrderValue
                  ? `₹${formatNumber(customerData.orderStats.averageOrderValue)}`
                  : '₹0'}
              </Text>
              <Text style={styles.loyaltyStatLabel}>Avg Order</Text>
            </View>
          </View>
        </View>

        {/* Allergen Alerts */}
        {customerData?.preferences?.allergenAlerts && customerData.preferences.allergenAlerts.length > 0 && (
          <Card elevation="sm" style={styles.menuCard}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              My Allergen Alerts
            </Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text2 }]}>
              We'll warn you if any item contains these
            </Text>
            <View style={styles.allergenChips}>
              {(customerData.preferences.allergenAlerts as AllergenType[]).map((a) => (
                <View key={a} style={[styles.allergenChip, { backgroundColor: '#fff3e0', borderColor: '#ff9800' }]}>
                  <Text style={[styles.allergenChipText, { color: '#e65100' }]}>
                    {ALLERGEN_LABELS[a] ?? a}
                  </Text>
                </View>
              ))}
            </View>
          </Card>
        )}

        {/* Menu Sections */}
        <Card elevation="sm" style={styles.menuCard}>
          <MenuItem
            icon="receipt-outline"
            label="Order History"
            onPress={() => navigation.navigate('OrderHistory')}
            theme={theme}
          />
          <MenuItem
            icon="location-outline"
            label="Saved Addresses"
            onPress={() => navigation.navigate('AddressManagement')}
            theme={theme}
          />
          <MenuItem
            icon="card-outline"
            label="Payment Methods"
            onPress={() => {}}
            theme={theme}
          />
          <MenuItem
            icon="pricetag-outline"
            label="My Coupons"
            onPress={() => {}}
            theme={theme}
          />
        </Card>

        <Card elevation="sm" style={styles.menuCard}>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            theme={theme}
          />
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="Support & Chat"
            onPress={() => navigation.navigate('Chat')}
            theme={theme}
          />
          <TouchableOpacity style={styles.menuItem} onPress={toggleTheme}>
            <View
              style={[styles.menuIcon, { backgroundColor: theme.colors.surface2 }]}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={theme.colors.text2}
              />
            </View>
            <Text style={[styles.menuLabel, { color: theme.colors.text1 }]}>
              {isDark ? 'Light Mode' : 'Dark Mode'}
            </Text>
            <View
              style={[
                styles.toggle,
                {
                  backgroundColor: isDark
                    ? '#FFD000'
                    : theme.colors.surface2,
                },
              ]}
            >
              <View
                style={[
                  styles.toggleDot,
                  {
                    backgroundColor: '#FFF',
                    transform: [{ translateX: isDark ? 16 : 0 }],
                  },
                ]}
              />
            </View>
          </TouchableOpacity>
          <MenuItem
            icon="language-outline"
            label="Language"
            onPress={() => {}}
            theme={theme}
          />
        </Card>

        <Card elevation="sm" style={styles.menuCard}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => {}}
            theme={theme}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => {}}
            theme={theme}
          />
          <MenuItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => {}}
            theme={theme}
          />
          <MenuItem
            icon="star-outline"
            label="Rate the App"
            onPress={() => {}}
            theme={theme}
          />
        </Card>

        <Card elevation="sm" style={styles.menuCard}>
          <MenuItem
            icon="log-out-outline"
            label="Log Out"
            onPress={logout}
            danger
            theme={theme}
          />
        </Card>

        {/* App Version */}
        <Text style={[styles.version, { color: theme.colors.text3 }]}>
          Version 1.0.0
        </Text>

        <View style={{ height: 100 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[6],
  },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    color: '#FFF',
  },
  profileInfo: {
    flex: 1,
    marginLeft: spacing[4],
  },
  userName: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
  },
  userEmail: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[6],
  },
  statCard: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing[4],
  },
  statValue: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
  },
  statLabel: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  menuCard: {
    marginBottom: spacing[4],
    padding: 0,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    gap: spacing[3],
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  toggle: {
    width: 44,
    height: 28,
    borderRadius: 14,
    padding: 2,
  },
  toggleDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  version: {
    textAlign: 'center',
    fontSize: typography.fontSize.caption,
    marginTop: spacing[4],
  },
  guestTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
  },
  guestSubtitle: {
    fontSize: typography.fontSize.body,
  },
  signInButton: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
  },
  signInButtonText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  // Loyalty Card Styles
  loyaltyCard: {
    borderRadius: borderRadius.xl,
    padding: spacing[5],
    marginBottom: spacing[6],
  },
  loyaltyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing[4],
  },
  loyaltyLabel: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing[1],
  },
  loyaltyPoints: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  loyaltyTierContainer: {
    alignItems: 'flex-end',
  },
  tierBadge: {
    paddingHorizontal: spacing[3],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.pill,
  },
  tierBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  progressContainer: {
    marginBottom: spacing[4],
  },
  progressLabel: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing[2],
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 4,
  },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  milestoneText: {
    fontSize: 10,
    color: 'rgba(255, 255, 255, 0.7)',
    lineHeight: 14,
  },
  loyaltyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  loyaltyStat: {
    alignItems: 'center',
  },
  loyaltyStatValue: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  loyaltyStatLabel: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[1],
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.caption,
    marginBottom: spacing[3],
  },
  allergenChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: spacing[2],
  },
  allergenChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
  },
  allergenChipText: {
    fontSize: typography.fontSize.caption,
    fontWeight: '600',
  },
});

export default ProfileScreen;
