/**
 * Home Screen
 * Main landing page with categories, promotions, and recommendations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useRecommendedItems } from '../../hooks/useMenuQueries';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Card, SearchBar, Badge, Skeleton } from '../../components/ui';
import { StoreSelector } from '../../components/StoreSelector';
import { RootStackParamList, MenuItem, Category } from '../../types';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = SCREEN_WIDTH - spacing.screenPadding * 2;

// Mock data for categories
const CATEGORIES: { id: Category; name: string; iconName: React.ComponentProps<typeof Ionicons>['name']; image: string }[] = [
  { id: 'PIZZA', name: 'Pizza', iconName: 'pizza-outline', image: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=200' },
  { id: 'BURGER', name: 'Burger', iconName: 'fast-food-outline', image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=200' },
  { id: 'BIRYANI', name: 'Biryani', iconName: 'restaurant-outline', image: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=200' },
  { id: 'DOSA', name: 'Dosa', iconName: 'cafe-outline', image: 'https://images.unsplash.com/photo-1668236543090-82eba5ee5976?w=200' },
  { id: 'NOODLES', name: 'Noodles', iconName: 'nutrition-outline', image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=200' },
  { id: 'BEVERAGE', name: 'Drinks', iconName: 'wine-outline', image: 'https://images.unsplash.com/photo-1544145945-f90425340c7e?w=200' },
];

// Mock promotions
const PROMOTIONS = [
  {
    id: '1',
    title: '50% OFF on First Order',
    subtitle: 'Use code WELCOME50',
    image: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800',
    gradient: ['#E53E3E', '#C0392B'],
  },
  {
    id: '2',
    title: 'Free Delivery Weekend',
    subtitle: 'No minimum order',
    image: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=800',
    gradient: ['#3B82F6', '#2563EB'],
  },
];

// Mock recommended items
const RECOMMENDED_ITEMS: Partial<MenuItem>[] = [
  {
    id: '1',
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh mozzarella and basil',
    basePrice: 34900,
    discountedPrice: 29900,
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    rating: 4.5,
    reviewCount: 230,
    preparationTime: 25,
    isRecommended: true,
    dietaryInfo: ['VEGETARIAN'],
  },
  {
    id: '2',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice with tender chicken pieces',
    basePrice: 28900,
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    rating: 4.7,
    reviewCount: 450,
    preparationTime: 30,
    isRecommended: true,
  },
  {
    id: '3',
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with melted cheese and special sauce',
    basePrice: 19900,
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    rating: 4.3,
    reviewCount: 180,
    preparationTime: 15,
    isRecommended: true,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);

  // Fetch recommended items from API
  const { data: recommendedItems, isLoading: loadingRecommended } = useRecommendedItems();

  const formatPrice = (price: number) => {
    return `₹${(price / 100).toFixed(0)}`;
  };

  const renderHeader = () => (
    <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
      <View style={styles.headerLeft}>
        <StoreSelector onStoreChange={(store) => console.log('Selected store:', store)} />
      </View>
      <TouchableOpacity
        style={[styles.notificationButton, { backgroundColor: theme.colors.surface2 }]}
        onPress={() => navigation.navigate('Notifications')}
      >
        <Ionicons name="notifications-outline" size={22} color={theme.colors.text1} />
        <View style={[styles.notificationBadge, { backgroundColor: '#FFD000' }]} />
      </TouchableOpacity>
    </View>
  );

  const renderSearchBar = () => (
    <View style={styles.searchContainer}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => navigation.navigate('Search')}
        style={{ flex: 1 }}
      >
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search for dishes, restaurants..."
          onVoicePress={() => {}}
        />
      </TouchableOpacity>
    </View>
  );

  const renderPromotions = () => (
    <View style={styles.promotionsContainer}>
      <FlatList
        data={PROMOTIONS}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / CARD_WIDTH);
          setCurrentPromoIndex(index);
        }}
        renderItem={({ item }) => (
          <TouchableOpacity activeOpacity={0.95} style={styles.promoCard}>
            <Image source={{ uri: item.image }} style={styles.promoImage} />
            <LinearGradient
              colors={['transparent', 'rgba(0,0,0,0.8)']}
              style={styles.promoGradient}
            >
              <Text style={styles.promoTitle}>{item.title}</Text>
              <Text style={styles.promoSubtitle}>{item.subtitle}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: spacing.screenPadding }}
        ItemSeparatorComponent={() => <View style={{ width: spacing[3] }} />}
      />
      <View style={styles.promoIndicators}>
        {PROMOTIONS.map((_, index) => (
          <View
            key={index}
            style={[
              styles.promoIndicator,
              {
                backgroundColor:
                  index === currentPromoIndex
                    ? '#FFD000'
                    : theme.colors.border,
                width: index === currentPromoIndex ? 20 : 8,
              },
            ]}
          />
        ))}
      </View>
    </View>
  );

  const renderCategories = () => (
    <View style={styles.section}>
      <View style={styles.sectionHeader}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
          Categories
        </Text>
        <TouchableOpacity>
          <Text style={[styles.seeAll, { color: '#FFD000' }]}>
            See all
          </Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.categoriesScroll}
      >
        {CATEGORIES.map((category) => (
          <TouchableOpacity
            key={category.id}
            style={styles.categoryItem}
            onPress={() => navigation.navigate('Main', { screen: 'Menu', params: { category: category.id } } as any)}
          >
            <View
              style={[
                styles.categoryIcon,
                { backgroundColor: theme.colors.surface2 },
              ]}
            >
              <Ionicons name={category.iconName} size={22} color={theme.colors.text1} />
            </View>
            <Text
              style={[styles.categoryName, { color: theme.colors.text1 }]}
              numberOfLines={1}
            >
              {category.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderRecommended = () => {
    // Use API data if available, fallback to mock data
    const rawItems = recommendedItems || RECOMMENDED_ITEMS;

    // Deduplicate items by name (keep first occurrence)
    const seenNames = new Set<string>();
    const items = rawItems.filter((item) => {
      if (seenNames.has(item.name!)) {
        return false;
      }
      seenNames.add(item.name!);
      return true;
    });

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Recommended for You
          </Text>
        </View>
        {loadingRecommended ? (
          <View style={styles.loadingContainer}>
            <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
              Loading recommendations...
            </Text>
          </View>
        ) : (
          items.map((item) => (
        <TouchableOpacity
          key={item.id}
          activeOpacity={0.9}
          onPress={() => navigation.navigate('ItemDetail', { itemId: item.id! })}
        >
          <Card
            elevation="sm"
            padding={0}
            style={styles.menuCard}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.menuImage} />
            <View style={styles.menuContent}>
              <View style={styles.menuBadges}>
                {item.dietaryInfo?.includes('VEGETARIAN') && (
                  <View style={[styles.vegBadge, { borderColor: theme.colors.semantic.success }]}>
                    <View style={[styles.vegDot, { backgroundColor: theme.colors.semantic.success }]} />
                  </View>
                )}
                {item.isRecommended && (
                  <Badge label="Recommended" variant="warning" size="sm" />
                )}
              </View>
              <View style={styles.menuHeader}>
                <Text
                  style={[styles.menuName, { color: theme.colors.text1 }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
              </View>
              <Text
                style={[styles.menuDescription, { color: theme.colors.text2 }]}
                numberOfLines={2}
              >
                {item.description}
              </Text>
              <View style={styles.menuFooter}>
                <View style={styles.priceContainer}>
                  <Text style={[styles.price, { color: theme.colors.text1 }]}>
                    {formatPrice(item.discountedPrice || item.basePrice!)}
                  </Text>
                  {item.discountedPrice && (
                    <Text style={[styles.originalPrice, { color: theme.colors.text3 }]}>
                      {formatPrice(item.basePrice!)}
                    </Text>
                  )}
                </View>
                <View style={styles.menuMeta}>
                  <View style={styles.ratingContainer}>
                    <Ionicons name="star" size={14} color="#F59E0B" />
                    <Text style={[styles.rating, { color: theme.colors.text1 }]}>
                      {item.rating}
                    </Text>
                  </View>
                  <Text style={[styles.prepTime, { color: theme.colors.text2 }]}>
                    {item.preparationTime} min
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#FFD000' }]}
              >
                <Text style={styles.addButtonText}>ADD</Text>
              </TouchableOpacity>
            </View>
          </Card>
        </TouchableOpacity>
          ))
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {renderHeader()}
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 }]}
      >
        {renderSearchBar()}
        {renderPromotions()}
        {renderCategories()}
        {renderRecommended()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: spacing[20],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  headerLeft: {
    flex: 1,
    marginRight: spacing[3],
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchContainer: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing[3],
    marginBottom: spacing[4],
  },
  promotionsContainer: {
    marginBottom: spacing[6],
  },
  promoCard: {
    width: CARD_WIDTH,
    height: 160,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  promoImage: {
    width: '100%',
    height: '100%',
  },
  promoGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    padding: spacing[4],
  },
  promoTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    color: '#FFFFFF',
  },
  promoSubtitle: {
    fontSize: typography.fontSize.body,
    color: 'rgba(255,255,255,0.9)',
    marginTop: spacing[1],
  },
  promoIndicators: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing[3],
    gap: spacing[2],
  },
  promoIndicator: {
    height: 8,
    borderRadius: 4,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
  },
  seeAll: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[4],
  },
  categoryItem: {
    alignItems: 'center',
    width: 70,
  },
  categoryIcon: {
    width: 64,
    height: 64,
    borderRadius: borderRadius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[2],
  },
  categoryEmoji: {
    fontSize: 28,
  },
  categoryName: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
    textAlign: 'center',
  },
  menuCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing[4],
    overflow: 'hidden',
  },
  menuImage: {
    width: '100%',
    height: 180,
  },
  menuContent: {
    padding: spacing[4],
  },
  menuBadges: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[2],
  },
  menuHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[1],
  },
  menuName: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
  },
  vegBadge: {
    width: 18,
    height: 18,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  vegDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  menuDescription: {
    fontSize: typography.fontSize.bodySm,
    lineHeight: typography.lineHeight.bodySm,
    marginBottom: spacing[3],
  },
  menuFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  price: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
  },
  originalPrice: {
    fontSize: typography.fontSize.bodySm,
    textDecorationLine: 'line-through',
  },
  menuMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  rating: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.semibold,
  },
  prepTime: {
    fontSize: typography.fontSize.bodySm,
  },
  addButton: {
    position: 'absolute',
    right: spacing[4],
    bottom: spacing[4],
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.button,
    ...shadows.sm,
  },
  addButtonText: {
    color: '#000000',
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.bold,
  },
  loadingContainer: {
    padding: spacing[8],
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.body,
  },
});

export default HomeScreen;
