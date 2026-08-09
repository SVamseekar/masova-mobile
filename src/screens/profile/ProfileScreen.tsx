/**
 * Profile Screen
 * User profile and settings
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreCurrency } from '../../hooks/useStoreCurrency';
import { isFeatureEnabled } from '../../config/featureFlags';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, Badge } from '../../components/ui';
import { RootStackParamList, Customer } from '../../types';
import { customerApi, orderApi } from '../../services/api';
import { AllergenType, ALLERGEN_LABELS } from '../../constants/allergens';
import {
  APP_LINKS,
  SUPPORTED_LANGUAGES,
  AppLanguageCode,
} from '../../constants/appLinks';
import {
  computeLoyaltyProgress,
  LOYALTY_TIERS,
} from '../../utils/loyaltyProgram';

const LANGUAGE_KEY = 'masova_app_language';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

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

const openExternalUrl = async (url: string, fallbackUrl?: string) => {
  try {
    const can = await Linking.canOpenURL(url);
    if (can) {
      await Linking.openURL(url);
      return;
    }
    if (fallbackUrl) {
      await Linking.openURL(fallbackUrl);
      return;
    }
    Alert.alert('Unable to open link', 'Please try again later.');
  } catch {
    if (fallbackUrl) {
      try {
        await Linking.openURL(fallbackUrl);
        return;
      } catch {
        // fall through
      }
    }
    Alert.alert('Unable to open link', 'Please try again later.');
  }
};

const ProfileScreen: React.FC = () => {
  const { theme, isDark, toggleTheme, themePreference } = useTheme();
  const { isAuthenticated, user, logout } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { formatMoney, locale } = useStoreCurrency();

  const [customerData, setCustomerData] = useState<Customer | null>(null);
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyError, setLoyaltyError] = useState<string | null>(null);
  const [language, setLanguage] = useState<AppLanguageCode>('en');

  useEffect(() => {
    AsyncStorage.getItem(LANGUAGE_KEY).then((raw) => {
      if (raw === 'en' || raw === 'de') setLanguage(raw);
    });
  }, []);

  const fetchCustomerData = useCallback(async () => {
    if (!user?.id) return;

    setLoyaltyLoading(true);
    setLoyaltyError(null);
    try {
      const customer = await customerApi.getByUserId(user.id, user.email);

      // If platform orderStats are empty, derive from live orders for this user
      let merged = customer;
      const stats = customer.orderStats;
      const needsStats =
        !stats ||
        ((stats.totalOrders ?? 0) === 0 &&
          (stats.totalSpent ?? 0) === 0);

      if (needsStats) {
        try {
          const ordersRes = await orderApi.getCustomerOrders(user.id);
          const orders = Array.isArray(ordersRes)
            ? ordersRes
            : (ordersRes as any)?.content || [];
          if (orders.length > 0) {
            const completed = orders.filter((o: any) =>
              ['DELIVERED', 'COMPLETED', 'SERVED'].includes(o.status)
            );
            const pool = completed.length > 0 ? completed : orders;
            const totalSpent = pool.reduce(
              (s: number, o: any) => s + (Number(o.total) || 0),
              0
            );
            merged = {
              ...customer,
              orderStats: {
                totalOrders: orders.length,
                completedOrders: completed.length,
                cancelledOrders: orders.filter((o: any) => o.status === 'CANCELLED')
                  .length,
                totalSpent,
                averageOrderValue: pool.length ? totalSpent / pool.length : 0,
                favoriteOrderType: customer.orderStats?.favoriteOrderType,
              },
            };
          }
        } catch {
          // keep customer as-is
        }
      }

      setCustomerData(merged);
    } catch (err: any) {
      console.error('Failed to fetch customer data:', err);
      setLoyaltyError(err?.message || 'Could not load loyalty data');
    } finally {
      setLoyaltyLoading(false);
    }
  }, [user?.id]);

  const loyaltyProgress = useMemo(
    () => computeLoyaltyProgress(customerData?.loyaltyInfo, locale),
    [customerData?.loyaltyInfo, locale]
  );

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
          <Text style={[styles.signInButtonText, { color: '#0F0F0F' }]}>Sign In</Text>
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
            onPress={() => {
              if (isFeatureEnabled('ENABLE_PREFERENCES_EDIT')) {
                navigation.navigate('Preferences');
              } else {
                navigation.navigate('NotificationSettings');
              }
            }}
            accessibilityLabel="Edit preferences"
          >
            <Ionicons name="pencil" size={18} color={theme.colors.text2} />
          </TouchableOpacity>
        </View>


        {/* Loyalty Card — live customer.loyaltyInfo + orderStats from platform */}
        {isFeatureEnabled('ENABLE_LOYALTY') && (
        <TouchableOpacity
          activeOpacity={0.9}
          onPress={() => navigation.navigate('LoyaltyHistory')}
          disabled={loyaltyLoading && !customerData}
        >
          <View style={[styles.loyaltyCard, { backgroundColor: '#FFD000' }]}>
            {loyaltyLoading && !customerData ? (
              <View style={styles.loyaltyLoading}>
                <ActivityIndicator color="#0F0F0F" />
                <Text style={styles.progressLabel}>Loading loyalty…</Text>
              </View>
            ) : loyaltyError && !customerData ? (
              <View style={styles.loyaltyLoading}>
                <Text style={styles.progressLabel}>{loyaltyError}</Text>
                <Text style={[styles.progressLabel, { textDecorationLine: 'underline' }]}>
                  Tap to open history · pull Account again to retry
                </Text>
              </View>
            ) : (
              <>
                <View style={styles.loyaltyHeader}>
                  <View>
                    <Text style={styles.loyaltyLabel}>Loyalty Points</Text>
                    <Text style={styles.loyaltyPoints}>
                      {loyaltyProgress.points.toLocaleString(locale)}
                    </Text>
                    <Text style={styles.loyaltyMultiplier}>
                      {loyaltyProgress.multiplier}× earn rate · {loyaltyProgress.tierLabel}
                    </Text>
                  </View>
                  <View style={styles.loyaltyTierContainer}>
                    <View
                      style={[
                        styles.tierBadge,
                        { backgroundColor: loyaltyProgress.tierColor },
                      ]}
                    >
                      <Text style={styles.tierBadgeText}>{loyaltyProgress.tier}</Text>
                    </View>
                  </View>
                </View>

                <View style={styles.progressContainer}>
                  <Text style={styles.progressLabel}>{loyaltyProgress.progressLabel}</Text>
                  {/* Overall ladder progress (Bronze → Platinum) so the bar always moves with points */}
                  <View style={styles.progressBar}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max(
                            loyaltyProgress.points > 0 ? 4 : 0,
                            Math.round(loyaltyProgress.overallPercent * 100)
                          )}%`,
                        },
                      ]}
                    />
                  </View>
                  <View style={styles.milestones}>
                    {LOYALTY_TIERS.map((m, i) => {
                      const reached = loyaltyProgress.points >= m.minPoints;
                      return (
                        <Text
                          key={m.tier}
                          style={[
                            styles.milestoneText,
                            i === 0
                              ? null
                              : i === LOYALTY_TIERS.length - 1
                                ? { textAlign: 'right' }
                                : { textAlign: 'center' },
                            reached ? { color: '#0F0F0F', fontFamily: 'PlusJakartaSans-Bold' } : null,
                          ]}
                        >
                          {m.label}
                          {'\n'}
                          {m.minPoints.toLocaleString(locale)}
                        </Text>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.loyaltyStats}>
                  <View style={styles.loyaltyStat}>
                    <Text style={styles.loyaltyStatValue}>
                      {customerData?.orderStats?.totalOrders ?? 0}
                    </Text>
                    <Text style={styles.loyaltyStatLabel}>Orders</Text>
                  </View>
                  <View style={styles.loyaltyStat}>
                    <Text style={styles.loyaltyStatValue}>
                      {formatMoney(customerData?.orderStats?.totalSpent ?? 0)}
                    </Text>
                    <Text style={styles.loyaltyStatLabel}>Spent</Text>
                  </View>
                  <View style={styles.loyaltyStat}>
                    <Text style={styles.loyaltyStatValue}>
                      {formatMoney(customerData?.orderStats?.averageOrderValue ?? 0)}
                    </Text>
                    <Text style={styles.loyaltyStatLabel}>Avg Order</Text>
                  </View>
                </View>
              </>
            )}
          </View>
        </TouchableOpacity>
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
          {isFeatureEnabled('ENABLE_PREFERENCES_EDIT') && (
            <MenuItem
              icon="nutrition-outline"
              label="Food & Dietary Preferences"
              onPress={() => navigation.navigate('Preferences')}
              theme={theme}
            />
          )}
          {isFeatureEnabled('ENABLE_LOYALTY') && (
            <MenuItem
              icon="gift-outline"
              label="Loyalty & Rewards"
              badge={
                customerData
                  ? `${loyaltyProgress.points.toLocaleString(locale)} pts`
                  : loyaltyLoading
                    ? '…'
                    : undefined
              }
              onPress={() => navigation.navigate('LoyaltyHistory')}
              theme={theme}
            />
          )}
        </Card>

        <Card elevation="sm" style={styles.menuCard}>
          <MenuItem
            icon="notifications-outline"
            label="Notifications"
            onPress={() => navigation.navigate('Notifications')}
            theme={theme}
          />
          <MenuItem
            icon="options-outline"
            label="Notification Settings"
            onPress={() => navigation.navigate('NotificationSettings')}
            theme={theme}
          />
          <MenuItem
            icon="key-outline"
            label="Change Password"
            onPress={() => navigation.navigate('ChangePassword')}
            theme={theme}
          />
          <MenuItem
            icon="chatbubble-ellipses-outline"
            label="Support & Chat"
            onPress={() => navigation.navigate('Chat')}
            theme={theme}
          />
          <TouchableOpacity
            style={styles.menuItem}
            onPress={toggleTheme}
            accessibilityRole="switch"
            accessibilityState={{ checked: !isDark }}
            accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <View
              style={[styles.menuIcon, { backgroundColor: theme.colors.surface2 }]}
            >
              <Ionicons
                name={isDark ? 'sunny-outline' : 'moon-outline'}
                size={20}
                color={theme.colors.text2}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.menuLabel, { color: theme.colors.text1, flex: 0 }]}>
                {isDark ? 'Light Mode' : 'Dark Mode'}
              </Text>
              {themePreference === 'auto' ? (
                <Text style={{ color: theme.colors.text3, fontSize: 11, marginTop: 2 }}>
                  Auto (sunrise) — tap to override
                </Text>
              ) : null}
            </View>
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
            label={`Language · ${SUPPORTED_LANGUAGES.find((l) => l.code === language)?.label || 'English'}`}
            onPress={() => {
              Alert.alert(
                'Language',
                'Choose app language. Full translations roll out per release; preference is saved on this device.',
                [
                  ...SUPPORTED_LANGUAGES.map((lang) => ({
                    text: lang.label + (lang.code === language ? ' ✓' : ''),
                    onPress: async () => {
                      setLanguage(lang.code);
                      await AsyncStorage.setItem(LANGUAGE_KEY, lang.code);
                      Alert.alert(
                        'Language saved',
                        lang.code === 'en'
                          ? 'English is active.'
                          : 'Deutsch selected. UI strings will expand in a future update; preference is stored.'
                      );
                    },
                  })),
                  { text: 'Cancel', style: 'cancel' },
                ]
              );
            }}
            theme={theme}
          />
        </Card>

        <Card elevation="sm" style={styles.menuCard}>
          <MenuItem
            icon="help-circle-outline"
            label="Help & Support"
            onPress={() => navigation.navigate('Chat')}
            theme={theme}
          />
          <MenuItem
            icon="document-text-outline"
            label="Terms & Conditions"
            onPress={() => openExternalUrl(APP_LINKS.termsOfService, APP_LINKS.website)}
            theme={theme}
          />
          <MenuItem
            icon="shield-outline"
            label="Privacy Policy"
            onPress={() => openExternalUrl(APP_LINKS.privacyPolicy, APP_LINKS.website)}
            theme={theme}
          />
          <MenuItem
            icon="star-outline"
            label="Rate the App"
            onPress={() => {
              if (Platform.OS === 'android') {
                openExternalUrl(APP_LINKS.playStoreMarket, APP_LINKS.playStore);
              } else {
                openExternalUrl(APP_LINKS.playStore);
              }
            }}
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
    color: '#0F0F0F',
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
  // Loyalty card sits on brand gold — all ink must be dark (onAccent)
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
    color: 'rgba(15, 15, 15, 0.7)',
    marginBottom: spacing[1],
    fontFamily: 'PlusJakartaSans-Medium',
  },
  loyaltyPoints: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
    color: '#0F0F0F',
    fontFamily: 'PlusJakartaSans-ExtraBold',
  },
  loyaltyMultiplier: {
    fontSize: 11,
    color: 'rgba(15, 15, 15, 0.65)',
    marginTop: 4,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  loyaltyLoading: {
    minHeight: 120,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
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
    color: 'rgba(15, 15, 15, 0.75)',
    marginBottom: spacing[2],
    fontFamily: 'PlusJakartaSans-Medium',
  },
  progressBar: {
    height: 10,
    backgroundColor: 'rgba(15, 15, 15, 0.15)',
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#0F0F0F',
    borderRadius: 5,
  },
  milestones: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  milestoneText: {
    fontSize: 10,
    color: 'rgba(15, 15, 15, 0.65)',
    lineHeight: 14,
    fontFamily: 'PlusJakartaSans-Medium',
  },
  loyaltyStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing[4],
    borderTopWidth: 1,
    borderTopColor: 'rgba(15, 15, 15, 0.12)',
  },
  loyaltyStat: {
    alignItems: 'center',
  },
  loyaltyStatValue: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    color: '#0F0F0F',
    fontFamily: 'PlusJakartaSans-Bold',
  },
  loyaltyStatLabel: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(15, 15, 15, 0.7)',
    marginTop: spacing[1],
    fontFamily: 'PlusJakartaSans-Medium',
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
