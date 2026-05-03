/**
 * Saved Screen
 * Favorite items
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Card, Button } from '../../components/ui';
import { RootStackParamList, MenuItem } from '../../types';
import GuestPromptView from '../../components/GuestPromptView';

// Mock saved items
const MOCK_SAVED: Partial<MenuItem>[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh mozzarella',
    basePrice: 34900,
    discountedPrice: 29900,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    rating: 4.5,
    dietaryInfo: ['VEGETARIAN'],
  },
  {
    id: '3',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice with tender chicken',
    basePrice: 28900,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    rating: 4.8,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SavedScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  // Show guest prompt if not authenticated
  if (!isAuthenticated) {
    return (
      <GuestPromptView
        screenName="Saved Items"
        icon="heart-outline"
        description="Sign in to save your favorite items and quickly reorder them anytime."
      />
    );
  }

  const formatPrice = (price: number) => `₹${(price / 100).toFixed(0)}`;

  const handleRemove = (itemId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    // Remove from saved
  };

  const renderItem = ({ item }: { item: Partial<MenuItem> }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id! })}
    >
      <Card elevation="sm" style={styles.itemCard}>
        <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <View style={styles.itemTitleRow}>
              {item.dietaryInfo?.includes('VEGETARIAN') && (
                <View style={[styles.vegBadge, { borderColor: theme.colors.semantic.success }]}>
                  <View style={[styles.vegDot, { backgroundColor: theme.colors.semantic.success }]} />
                </View>
              )}
              <Text
                style={[styles.itemName, { color: theme.colors.text1 }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => handleRemove(item.id!)}
              style={styles.removeButton}
            >
              <Ionicons name="heart" size={22} color={'#FFD000'} />
            </TouchableOpacity>
          </View>
          <Text
            style={[styles.itemDescription, { color: theme.colors.text2 }]}
            numberOfLines={1}
          >
            {item.description}
          </Text>
          <View style={styles.itemFooter}>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: theme.colors.text1 }]}>
                {formatPrice(item.discountedPrice || item.basePrice!)}
              </Text>
              {item.discountedPrice && (
                <Text style={[styles.originalPrice, { color: theme.colors.text3 }]}>
                  {formatPrice(item.basePrice!)}
                </Text>
              )}
            </View>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.rating, { color: theme.colors.text2 }]}>
                {item.rating}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Saved</Text>
        <Text style={[styles.itemCount, { color: theme.colors.text2 }]}>
          {MOCK_SAVED.length} items
        </Text>
      </View>

      <FlatList
        data={MOCK_SAVED}
        renderItem={renderItem}
        keyExtractor={(item) => item.id!}
        contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="heart-outline" size={64} color={theme.colors.text3} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>
              No saved items
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.text2 }]}>
              Tap the heart icon on items to save them here
            </Text>
            <Button
              title="Browse Menu"
              onPress={() => navigation.navigate('Main', { screen: 'Menu' } as any)}
              style={styles.browseButton}
            />
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
  },
  itemCount: {
    fontSize: typography.fontSize.body,
  },
  listContent: {
    padding: spacing.screenPadding,
    gap: spacing[4],
  },
  itemCard: {
    padding: 0,
    overflow: 'hidden',
  },
  itemImage: {
    width: '100%',
    height: 160,
  },
  itemContent: {
    padding: spacing[4],
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing[2],
  },
  vegBadge: {
    width: 16,
    height: 16,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  itemName: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  removeButton: {
    padding: spacing[1],
  },
  itemDescription: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
    marginBottom: spacing[3],
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  price: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },
  originalPrice: {
    fontSize: typography.fontSize.bodySm,
    textDecorationLine: 'line-through',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  rating: {
    fontSize: typography.fontSize.bodySm,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: spacing[20],
  },
  emptyTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    marginTop: spacing[2],
    paddingHorizontal: spacing[8],
  },
  browseButton: {
    marginTop: spacing[6],
  },
});

export default SavedScreen;
