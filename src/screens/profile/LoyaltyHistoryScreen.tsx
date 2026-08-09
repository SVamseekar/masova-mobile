/**
 * Loyalty History Screen
 * View loyalty points balance, tier status, and transaction history
 */

import React, { useState, useEffect, useCallback } from 'react';
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

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreCurrency } from '../../hooks/useStoreCurrency';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Card, Badge } from '../../components/ui';
import { RootStackParamList, Customer, PointTransaction } from '../../types';
import { customerApi } from '../../services/api';
import GuestPromptView from '../../components/GuestPromptView';
import {
  computeLoyaltyProgress,
  getTierColor,
} from '../../utils/loyaltyProgram';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const LoyaltyHistoryScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { locale } = useStoreCurrency();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchLoyaltyData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const data = await customerApi.getByUserId(user.id, user.email);
      setCustomer(data);
    } catch (err) {
      console.error('Failed to fetch loyalty history:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (isAuthenticated && user?.id) {
      fetchLoyaltyData();
    }
  }, [isAuthenticated, user?.id, fetchLoyaltyData]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchLoyaltyData();
  };

  if (!isAuthenticated) {
    return (
      <GuestPromptView
        screenName="Loyalty Rewards"
        icon="gift-outline"
        description="Sign in to view your MaSoVa points balance, earn rewards on orders, and track your points history."
      />
    );
  }

  const loyalty = customer?.loyaltyInfo;
  const history: PointTransaction[] = loyalty?.pointHistory || [];
  const progress = computeLoyaltyProgress(loyalty, locale);
  const tierColor = progress.tierColor;
  const tierProgress = {
    percent: progress.progressPercent,
    text: progress.progressLabel,
  };

  const renderTransaction = ({ item }: { item: PointTransaction }) => {
    const isEarned = item.type === 'EARNED' || item.type === 'BONUS';
    return (
      <Card elevation="sm" style={styles.transactionCard}>
        <View style={styles.transactionRow}>
          <View
            style={[
              styles.iconCircle,
              { backgroundColor: isEarned ? '#22C55E15' : '#EF444415' },
            ]}
          >
            <Ionicons
              name={isEarned ? 'arrow-down-circle' : 'arrow-up-circle'}
              size={24}
              color={isEarned ? '#22C55E' : '#EF4444'}
            />
          </View>

          <View style={styles.transactionDetails}>
            <Text style={[styles.transactionTitle, { color: theme.colors.text1 }]}>
              {item.description || (isEarned ? 'Points Earned' : 'Points Redeemed')}
            </Text>
            <Text style={[styles.transactionDate, { color: theme.colors.text2 }]}>
              {new Date(item.timestamp).toLocaleDateString('de-DE', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </Text>
          </View>

          <Text
            style={[
              styles.pointsValue,
              { color: isEarned ? '#22C55E' : '#EF4444' },
            ]}
          >
            {isEarned ? `+${item.points}` : `-${item.points}`} pts
          </Text>
        </View>
      </Card>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Loyalty & Rewards</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FFD000" />
          <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
            Loading rewards info...
          </Text>
        </View>
      ) : (
        <FlatList
          data={history}
          renderItem={renderTransaction}
          keyExtractor={(item) => item.id || `${item.timestamp}-${item.points}`}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FFD000']}
              tintColor="#FFD000"
            />
          }
          ListHeaderComponent={
            <View style={styles.headerComponent}>
              {/* Points Balance Card */}
              <Card elevation="md" style={[styles.balanceCard, { backgroundColor: '#1A1A1A' }] as any}>
                <View style={styles.balanceHeader}>
                  <Text style={styles.balanceLabel}>Available Points</Text>
                  <View style={[styles.tierBadge, { backgroundColor: `${tierColor}30`, borderColor: tierColor }]}>
                    <Ionicons name="ribbon" size={14} color={tierColor} />
                    <Text style={[styles.tierBadgeText, { color: tierColor }]}>
                      {progress.tier} · {progress.multiplier}×
                    </Text>
                  </View>
                </View>

                <Text style={styles.balanceAmount}>
                  {progress.points.toLocaleString(locale)}{' '}
                  <Text style={styles.ptsUnit}>pts</Text>
                </Text>

                {/* Next Tier Progress Bar */}
                <View style={styles.progressContainer}>
                  <View style={styles.progressBarBg}>
                    <View
                      style={[
                        styles.progressBarFill,
                        { width: `${tierProgress.percent * 100}%`, backgroundColor: tierColor },
                      ]}
                    />
                  </View>
                  <Text style={styles.progressText}>{tierProgress.text}</Text>
                </View>

                {/* Stats Summary */}
                <View style={styles.statsRow}>
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Earned</Text>
                    <Text style={styles.statValue}>
                      +{(loyalty?.pointsEarned || 0).toLocaleString(locale)}
                    </Text>
                  </View>
                  <View style={styles.statDivider} />
                  <View style={styles.statItem}>
                    <Text style={styles.statLabel}>Total Redeemed</Text>
                    <Text style={styles.statValue}>
                      -{(loyalty?.pointsRedeemed || 0).toLocaleString(locale)}
                    </Text>
                  </View>
                </View>
              </Card>

              <Text style={[styles.historyTitle, { color: theme.colors.text1 }]}>Points History</Text>
            </View>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="gift-outline" size={48} color={theme.colors.text3} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>
                No points history yet
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text2 }]}>
                Earn points on every completed order!
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
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[8],
  },
  headerComponent: {
    paddingTop: spacing[2],
    marginBottom: spacing[4],
  },
  balanceCard: {
    padding: spacing[5],
    borderRadius: borderRadius.xl,
    marginBottom: spacing[6],
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  balanceLabel: {
    color: '#A0A0A0',
    fontSize: typography.fontSize.bodySm,
  },
  tierBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 12,
    borderWidth: 1,
    gap: 4,
  },
  tierBadgeText: {
    fontSize: 11,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  balanceAmount: {
    fontSize: 38,
    fontWeight: '800',
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
    marginVertical: spacing[2],
  },
  ptsUnit: {
    fontSize: 18,
    color: '#FFD000',
    fontWeight: '600',
  },
  progressContainer: {
    marginVertical: spacing[3],
  },
  progressBarBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#333333',
    overflow: 'hidden',
    marginBottom: spacing[1],
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#A0A0A0',
    fontSize: typography.fontSize.caption,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: spacing[3],
    borderTopWidth: 1,
    borderTopColor: '#2A2A2A',
    marginTop: spacing[2],
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    color: '#888888',
    fontSize: typography.fontSize.caption,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 24,
    backgroundColor: '#2A2A2A',
    marginHorizontal: spacing[3],
  },
  historyTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: spacing[3],
  },
  transactionCard: {
    padding: spacing[4],
    marginBottom: spacing[3],
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[3],
  },
  transactionDetails: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  transactionDate: {
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  pointsValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[10],
  },
  emptyTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[3],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
  },
});

export default LoyaltyHistoryScreen;
