/**
 * Menu Screen
 * Browse menu with filters and categories (like Swiggy/Web version)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { CONFIG } from '../../config';
import { useTheme } from '../../hooks/useTheme';
import { useMenuItems } from '../../hooks/useMenuQueries';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Card, Chip, SearchBar, Badge } from '../../components/ui';
import { StoreSelector } from '../../components/StoreSelector';
import { RootStackParamList, MenuItem, Cuisine, Category } from '../../types';

// Category mappings based on cuisine (matching web version)
const CUISINE_CATEGORY_MAP: Partial<Record<Cuisine, { id: Category; name: string }[]>> = {
  SOUTH_INDIAN: [
    { id: 'DOSA', name: 'Dosa' },
    { id: 'IDLY_VADA', name: 'Idly & Vada' },
    { id: 'SOUTH_INDIAN_MEALS', name: 'Meals' },
    { id: 'RICE_VARIETIES', name: 'Rice' },
    { id: 'BIRYANI', name: 'Biryani' },
  ],
  NORTH_INDIAN: [
    { id: 'CURRY_GRAVY', name: 'Curry & Gravy' },
    { id: 'DAL_DISHES', name: 'Dal' },
    { id: 'NORTH_INDIAN_MEALS', name: 'Meals' },
    { id: 'RICE_VARIETIES', name: 'Rice' },
    { id: 'CHAPATI_ROTI', name: 'Chapati' },
    { id: 'NAAN_KULCHA', name: 'Naan' },
  ],
  INDO_CHINESE: [
    { id: 'FRIED_RICE', name: 'Fried Rice' },
    { id: 'NOODLES', name: 'Noodles' },
    { id: 'MANCHURIAN', name: 'Manchurian' },
  ],
  ITALIAN: [
    { id: 'PIZZA', name: 'Pizza' },
    { id: 'PASTA', name: 'Pasta' },
    { id: 'SIDES', name: 'Sides' },
  ],
  AMERICAN: [
    { id: 'BURGER', name: 'Burger' },
    { id: 'SANDWICH', name: 'Sandwich' },
    { id: 'SIDES', name: 'Sides' },
  ],
  CONTINENTAL: [
    { id: 'GRILLED', name: 'Grilled' },
    { id: 'BAKED', name: 'Baked' },
    { id: 'SIZZLERS', name: 'Sizzlers' },
  ],
  BEVERAGES: [
    { id: 'HOT_DRINKS', name: 'Hot Drinks' },
    { id: 'COLD_DRINKS', name: 'Cold Drinks' },
    { id: 'TEA_CHAI', name: 'Tea & Chai' },
    { id: 'JUICES', name: 'Juices' },
  ],
  DESSERTS: [
    { id: 'COOKIES_BROWNIES', name: 'Cookies & Brownies' },
    { id: 'ICE_CREAM', name: 'Ice Cream' },
    { id: 'DESSERT_SPECIALS', name: 'Specials' },
  ],
};

// Cuisines list (clean text labels, no emojis)
const CUISINES: { id: Cuisine; name: string }[] = [
  { id: 'SOUTH_INDIAN', name: 'South Indian' },
  { id: 'NORTH_INDIAN', name: 'North Indian' },
  { id: 'INDO_CHINESE', name: 'Indo-Chinese' },
  { id: 'ITALIAN', name: 'Italian' },
  { id: 'AMERICAN', name: 'American' },
  { id: 'BEVERAGES', name: 'Beverages' },
  { id: 'DESSERTS', name: 'Desserts' },
];

// Mock data with proper cuisine/category matching and spice levels
const MOCK_MENU_ITEMS: MenuItem[] = [
  // South Indian
  {
    id: '1',
    name: 'Masala Dosa',
    description: 'Crispy crepe filled with spiced potato masala, served with sambar and chutney',
    cuisine: 'SOUTH_INDIAN',
    category: 'DOSA',
    basePrice: 12900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    spiceLevel: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1630383249896-424e482df921?w=400',
    isAvailable: true,
    preparationTime: 15,
    isRecommended: true,
    rating: 4.6,
    reviewCount: 280,
  },
  {
    id: '2',
    name: 'Plain Dosa',
    description: 'Thin crispy crepe served with sambar and coconut chutney',
    cuisine: 'SOUTH_INDIAN',
    category: 'DOSA',
    basePrice: 8900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN', 'VEGAN'],
    spiceLevel: 'MILD',
    imageUrl: 'https://images.unsplash.com/photo-1567337710282-00832b415979?w=400',
    isAvailable: true,
    preparationTime: 12,
    isRecommended: false,
    rating: 4.4,
    reviewCount: 150,
  },
  {
    id: '3',
    name: 'Idly (2 pcs)',
    description: 'Soft steamed rice cakes served with sambar and chutney',
    cuisine: 'SOUTH_INDIAN',
    category: 'IDLY_VADA',
    basePrice: 6900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN', 'VEGAN'],
    spiceLevel: 'MILD',
    imageUrl: 'https://images.unsplash.com/photo-1589301760014-d929f3979dbc?w=400',
    isAvailable: true,
    preparationTime: 10,
    isRecommended: false,
    rating: 4.5,
    reviewCount: 200,
  },
  {
    id: '4',
    name: 'Medu Vada (2 pcs)',
    description: 'Crispy lentil donuts served with sambar and chutney',
    cuisine: 'SOUTH_INDIAN',
    category: 'IDLY_VADA',
    basePrice: 7900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    spiceLevel: 'MILD',
    imageUrl: 'https://images.unsplash.com/photo-1626132647523-66f6bf15147e?w=400',
    isAvailable: true,
    preparationTime: 12,
    isRecommended: false,
    rating: 4.3,
    reviewCount: 120,
  },
  {
    id: '5',
    name: 'Chicken Biryani',
    description: 'Aromatic basmati rice with tender chicken pieces and traditional spices',
    cuisine: 'SOUTH_INDIAN',
    category: 'BIRYANI',
    basePrice: 28900,
    variants: [],
    customizations: [],
    dietaryInfo: ['NON_VEGETARIAN'],
    spiceLevel: 'HOT',
    imageUrl: 'https://images.unsplash.com/photo-1563379091339-03b21ab4a4f8?w=400',
    isAvailable: true,
    preparationTime: 30,
    isRecommended: true,
    rating: 4.8,
    reviewCount: 450,
  },
  {
    id: '6',
    name: 'Veg Biryani',
    description: 'Fragrant basmati rice with mixed vegetables and aromatic spices',
    cuisine: 'SOUTH_INDIAN',
    category: 'BIRYANI',
    basePrice: 22900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    spiceLevel: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1642821373181-696a54913e93?w=400',
    isAvailable: true,
    preparationTime: 25,
    isRecommended: false,
    rating: 4.5,
    reviewCount: 180,
  },
  // North Indian
  {
    id: '7',
    name: 'Paneer Butter Masala',
    description: 'Cottage cheese cubes in rich tomato and butter gravy',
    cuisine: 'NORTH_INDIAN',
    category: 'CURRY_GRAVY',
    basePrice: 24900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    spiceLevel: 'MILD',
    imageUrl: 'https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=400',
    isAvailable: true,
    preparationTime: 20,
    isRecommended: true,
    rating: 4.7,
    reviewCount: 320,
  },
  {
    id: '8',
    name: 'Dal Makhani',
    description: 'Creamy black lentils slow-cooked with butter and cream',
    cuisine: 'NORTH_INDIAN',
    category: 'DAL_DISHES',
    basePrice: 19900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    spiceLevel: 'MILD',
    imageUrl: 'https://images.unsplash.com/photo-1546833999-b9f581a1996d?w=400',
    isAvailable: true,
    preparationTime: 25,
    isRecommended: true,
    rating: 4.6,
    reviewCount: 250,
  },
  {
    id: '9',
    name: 'Butter Naan',
    description: 'Soft leavened bread brushed with butter',
    cuisine: 'NORTH_INDIAN',
    category: 'NAAN_KULCHA',
    basePrice: 4900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    imageUrl: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=400',
    isAvailable: true,
    preparationTime: 8,
    isRecommended: false,
    rating: 4.4,
    reviewCount: 180,
  },
  // Indo-Chinese
  {
    id: '10',
    name: 'Veg Hakka Noodles',
    description: 'Stir-fried noodles with fresh vegetables in Indo-Chinese style',
    cuisine: 'INDO_CHINESE',
    category: 'NOODLES',
    basePrice: 16900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    spiceLevel: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=400',
    isAvailable: true,
    preparationTime: 20,
    isRecommended: true,
    rating: 4.2,
    reviewCount: 150,
  },
  {
    id: '11',
    name: 'Chicken Fried Rice',
    description: 'Wok-tossed rice with chicken, egg, and vegetables',
    cuisine: 'INDO_CHINESE',
    category: 'FRIED_RICE',
    basePrice: 18900,
    variants: [],
    customizations: [],
    dietaryInfo: ['NON_VEGETARIAN'],
    spiceLevel: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1603133872878-684f208fb84b?w=400',
    isAvailable: true,
    preparationTime: 18,
    isRecommended: false,
    rating: 4.3,
    reviewCount: 200,
  },
  {
    id: '12',
    name: 'Veg Manchurian',
    description: 'Crispy vegetable balls in spicy manchurian sauce',
    cuisine: 'INDO_CHINESE',
    category: 'MANCHURIAN',
    basePrice: 17900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    spiceLevel: 'HOT',
    imageUrl: 'https://images.unsplash.com/photo-1645177628172-a94c1f96e6db?w=400',
    isAvailable: true,
    preparationTime: 20,
    isRecommended: false,
    rating: 4.1,
    reviewCount: 120,
  },
  // Italian
  {
    id: '13',
    name: 'Margherita Pizza',
    description: 'Classic Italian pizza with fresh mozzarella, basil, and tomato sauce',
    cuisine: 'ITALIAN',
    category: 'PIZZA',
    basePrice: 34900,
    discountedPrice: 29900,
    variants: [
      { id: 'v1', name: 'Regular (8")', priceModifier: 0 },
      { id: 'v2', name: 'Large (12")', priceModifier: 10000 },
    ],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
    isAvailable: true,
    preparationTime: 25,
    isRecommended: true,
    rating: 4.5,
    reviewCount: 230,
  },
  {
    id: '14',
    name: 'Pepperoni Pizza',
    description: 'Loaded with spicy pepperoni slices and melted mozzarella cheese',
    cuisine: 'ITALIAN',
    category: 'PIZZA',
    basePrice: 44900,
    variants: [],
    customizations: [],
    dietaryInfo: ['NON_VEGETARIAN'],
    spiceLevel: 'MEDIUM',
    imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400',
    isAvailable: true,
    preparationTime: 25,
    isRecommended: false,
    rating: 4.7,
    reviewCount: 180,
  },
  // American
  {
    id: '15',
    name: 'Classic Cheeseburger',
    description: 'Juicy beef patty with melted cheddar, lettuce, tomato, and special sauce',
    cuisine: 'AMERICAN',
    category: 'BURGER',
    basePrice: 19900,
    variants: [],
    customizations: [],
    dietaryInfo: ['NON_VEGETARIAN'],
    imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400',
    isAvailable: true,
    preparationTime: 15,
    isRecommended: true,
    rating: 4.3,
    reviewCount: 320,
  },
  {
    id: '16',
    name: 'Veggie Burger',
    description: 'Crispy veggie patty with fresh vegetables and tangy mayo',
    cuisine: 'AMERICAN',
    category: 'BURGER',
    basePrice: 17900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400',
    isAvailable: true,
    preparationTime: 15,
    isRecommended: false,
    rating: 4.1,
    reviewCount: 150,
  },
  // Beverages
  {
    id: '17',
    name: 'Masala Chai',
    description: 'Traditional Indian spiced tea with milk',
    cuisine: 'BEVERAGES',
    category: 'TEA_CHAI',
    basePrice: 4900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    imageUrl: 'https://images.unsplash.com/photo-1597318181409-cf64d0b5d8a2?w=400',
    isAvailable: true,
    preparationTime: 5,
    isRecommended: true,
    rating: 4.4,
    reviewCount: 100,
  },
  {
    id: '18',
    name: 'Cold Coffee',
    description: 'Chilled coffee blended with ice cream',
    cuisine: 'BEVERAGES',
    category: 'COLD_DRINKS',
    basePrice: 12900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    imageUrl: 'https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=400',
    isAvailable: true,
    preparationTime: 8,
    isRecommended: false,
    rating: 4.2,
    reviewCount: 80,
  },
  // Desserts
  {
    id: '19',
    name: 'Gulab Jamun (2 pcs)',
    description: 'Deep-fried milk solids soaked in rose-flavored sugar syrup',
    cuisine: 'DESSERTS',
    category: 'DESSERT_SPECIALS',
    basePrice: 8900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    imageUrl: 'https://images.unsplash.com/photo-1666190094762-2779ed46a260?w=400',
    isAvailable: true,
    preparationTime: 5,
    isRecommended: true,
    rating: 4.6,
    reviewCount: 200,
  },
  {
    id: '20',
    name: 'Chocolate Brownie',
    description: 'Rich chocolate brownie with walnut chunks',
    cuisine: 'DESSERTS',
    category: 'COOKIES_BROWNIES',
    basePrice: 14900,
    variants: [],
    customizations: [],
    dietaryInfo: ['VEGETARIAN'],
    imageUrl: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=400',
    isAvailable: true,
    preparationTime: 5,
    isRecommended: false,
    rating: 4.5,
    reviewCount: 150,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const MenuScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCuisine, setSelectedCuisine] = useState<Cuisine>('SOUTH_INDIAN');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [vegOnly, setVegOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high'>('popular');

  // Fetch menu items from API
  const { data: menuItems, isLoading, isError, error, refetch } = useMenuItems({
    cuisine: selectedCuisine,
    category: selectedCategory || undefined,
  });

  // Get categories for selected cuisine
  const availableCategories = useMemo(() => {
    return CUISINE_CATEGORY_MAP[selectedCuisine] || [];
  }, [selectedCuisine]);

  // Filter and sort items
  const filteredItems = useMemo(() => {
    // Only fallback to mock data if ENABLE_MOCK_FALLBACK is explicitly enabled in dev mode
    const hasApiData = Array.isArray(menuItems) && menuItems.length > 0;
    const allowMock = CONFIG.ENABLE_MOCK_FALLBACK;
    let items = [...(hasApiData ? menuItems : allowMock ? MOCK_MENU_ITEMS : (menuItems || []))];

    // Deduplicate items by name (keep first occurrence)
    // This handles cases where duplicate items exist in the database
    const seenNames = new Set<string>();
    items = items.filter((item) => {
      const key = `${item.name}-${item.cuisine}-${item.category}`;
      if (seenNames.has(key)) {
        return false;
      }
      seenNames.add(key);
      return true;
    });

    // Filter by cuisine
    items = items.filter((item) => item.cuisine === selectedCuisine);

    // Filter by category if selected
    if (selectedCategory) {
      items = items.filter((item) => item.category === selectedCategory);
    }

    // Filter by veg only
    if (vegOnly) {
      items = items.filter((item) =>
        item.dietaryInfo?.includes('VEGETARIAN') || item.dietaryInfo?.includes('VEGAN')
      );
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      items = items.filter(
        (item) =>
          item.name.toLowerCase().includes(query) ||
          item.description.toLowerCase().includes(query)
      );
    }

    // Sort
    switch (sortBy) {
      case 'price_low':
        items.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price_high':
        items.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'popular':
      default:
        items.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    return items;
  }, [menuItems, selectedCuisine, selectedCategory, vegOnly, searchQuery, sortBy]);

  const formatPrice = (price: number) => `₹${(price / 100).toFixed(0)}`;

  const renderSpiceDots = (spiceLevel: string) => {
    const count = spiceLevel === 'MILD' ? 1 : spiceLevel === 'MEDIUM' ? 2 : spiceLevel === 'HOT' ? 3 : 4;
    return (
      <View style={[styles.metaItem, { flexDirection: 'row', gap: 3 }]}>
        {Array.from({ length: Math.min(count, 4) }).map((_, i) => (
          <View key={i} style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ef4444' }} />
        ))}
      </View>
    );
  };

  const handleCuisinePress = (cuisine: Cuisine) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCuisine(cuisine);
    setSelectedCategory(null); // Reset category when cuisine changes
  };

  const handleCategoryPress = (category: Category | null) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedCategory(category);
  };

  const renderMenuItem = ({ item }: { item: MenuItem }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
      style={styles.menuItemContainer}
    >
      <Card elevation="sm" padding={0} style={styles.menuCard}>
        <View style={styles.cardContent}>
          <View style={styles.cardInfo}>
            <View style={styles.cardHeader}>
              {item.dietaryInfo?.includes('VEGETARIAN') ? (
                <View style={[styles.vegBadge, { borderColor: theme.colors.semantic.success }]}>
                  <View style={[styles.vegDot, { backgroundColor: theme.colors.semantic.success }]} />
                </View>
              ) : item.dietaryInfo?.includes('NON_VEGETARIAN') ? (
                <View style={[styles.vegBadge, { borderColor: theme.colors.semantic.error }]}>
                  <View style={[styles.vegDot, { backgroundColor: theme.colors.semantic.error }]} />
                </View>
              ) : null}
              {item.isRecommended && (
                <Badge label="Bestseller" variant="warning" size="sm" />
              )}
            </View>
            <Text
              style={[styles.itemName, { color: theme.colors.text1 }]}
              numberOfLines={1}
            >
              {item.name}
            </Text>
            <View style={styles.ratingRow}>
              <Ionicons name="star" size={14} color="#F59E0B" />
              <Text style={[styles.rating, { color: theme.colors.text1 }]}>
                {item.rating}
              </Text>
              <Text style={[styles.reviewCount, { color: theme.colors.text2 }]}>
                ({item.reviewCount})
              </Text>
            </View>
            <Text
              style={[styles.description, { color: theme.colors.text2 }]}
              numberOfLines={2}
            >
              {item.description}
            </Text>
            <View style={styles.metaRow}>
              <View style={styles.metaItem}>
                <Ionicons name="time-outline" size={14} color={theme.colors.text3} />
                <Text style={[styles.metaText, { color: theme.colors.text3 }]}>
                  {item.preparationTime} min
                </Text>
              </View>
              {item.spiceLevel && item.cuisine !== 'BEVERAGES' && item.cuisine !== 'DESSERTS' && renderSpiceDots(item.spiceLevel)}
            </View>
            <View style={styles.priceRow}>
              <Text style={[styles.price, { color: theme.colors.text1 }]}>
                {formatPrice(item.discountedPrice || item.basePrice)}
              </Text>
              {item.discountedPrice && (
                <Text style={[styles.originalPrice, { color: theme.colors.text3 }]}>
                  {formatPrice(item.basePrice)}
                </Text>
              )}
            </View>
          </View>
          <View style={styles.imageContainer}>
            {item.imageUrl ? (
              <Image source={{ uri: item.imageUrl }} style={styles.itemImage} />
            ) : (
              <View style={[styles.itemImage, styles.placeholderImage, { backgroundColor: theme.colors.surface2 }]}>
                <Ionicons name="image-outline" size={48} color={theme.colors.text3} />
              </View>
            )}
            {item.dietaryInfo && item.dietaryInfo.length > 0 && (
              <View style={styles.dietaryDotOverlay}>
                <View
                  style={[
                    styles.dietaryDot,
                    {
                      backgroundColor: item.dietaryInfo.includes('VEGAN')
                        ? '#7B1FA2'
                        : item.dietaryInfo.includes('VEGETARIAN')
                        ? '#22C55E'
                        : '#FF4444',
                    },
                  ]}
                />
              </View>
            )}
            <TouchableOpacity
              style={[styles.addButton, { backgroundColor: '#FFD000' }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                navigation.navigate('ItemDetail', { itemId: item.id });
              }}
            >
              <Text style={styles.addButtonText}>ADD</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Menu</Text>
      </View>

      {/* Store Selector */}
      <View style={styles.storeSelectorContainer}>
        <StoreSelector onStoreChange={(store) => console.log('Selected store:', store)} />
      </View>

      {/* Search & Filters */}
      <View style={styles.searchSection}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Search menu..."
        />
        <View style={styles.filterRow}>
          <Chip
            label="Veg Only"
            selected={vegOnly}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setVegOnly(!vegOnly);
            }}
            icon={
              <View style={[styles.vegIcon, { borderColor: theme.colors.semantic.success }]}>
                <View style={[styles.vegIconDot, { backgroundColor: theme.colors.semantic.success }]} />
              </View>
            }
          />
          <TouchableOpacity
            style={[styles.sortButton, { backgroundColor: theme.colors.surface2 }]}
            onPress={() => {
              const options: typeof sortBy[] = ['popular', 'price_low', 'price_high'];
              const currentIndex = options.indexOf(sortBy);
              setSortBy(options[(currentIndex + 1) % options.length]);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            }}
          >
            <Ionicons name="swap-vertical" size={18} color={theme.colors.text2} />
            <Text style={[styles.sortText, { color: theme.colors.text2 }]}>
              {sortBy === 'popular' ? 'Popular' : sortBy === 'price_low' ? 'Price ↑' : 'Price ↓'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Cuisines */}
      <View style={styles.cuisineSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Cuisine</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.cuisinesContainer}
        >
          {CUISINES.map((cuisine) => (
            <TouchableOpacity
              key={cuisine.id}
              onPress={() => handleCuisinePress(cuisine.id)}
              style={[
                styles.cuisineCard,
                {
                  backgroundColor: selectedCuisine === cuisine.id
                    ? '#FFD000'
                    : theme.colors.surface2,
                },
              ]}
            >
              {/* icon removed — clean text-only cuisine chips */}
              <Text
                style={[
                  styles.cuisineName,
                  {
                    color: selectedCuisine === cuisine.id
                      ? '#000000'
                      : theme.colors.text1,
                  },
                ]}
                numberOfLines={1}
              >
                {cuisine.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Categories (changes based on selected cuisine) */}
      {availableCategories.length > 0 && (
        <View style={styles.categorySection}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            {selectedCuisine.replace(/_/g, ' ')} Categories
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesContainer}
          >
            <Chip
              label="All"
              selected={selectedCategory === null}
              onPress={() => handleCategoryPress(null)}
              style={styles.categoryChip}
            />
            {availableCategories.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                selected={selectedCategory === cat.id}
                onPress={() => handleCategoryPress(cat.id)}
                style={styles.categoryChip}
              />
            ))}
          </ScrollView>
        </View>
      )}

      {/* Loading State */}
      {isLoading && (
        <View style={styles.centerContainer}>
          <View style={styles.loadingIndicator}>
            <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
              Loading menu...
            </Text>
          </View>
        </View>
      )}

      {/* Error State */}
      {isError && (
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={theme.colors.semantic.error} />
          <Text style={[styles.errorTitle, { color: theme.colors.text1 }]}>
            Failed to load menu
          </Text>
          <Text style={[styles.errorSubtitle, { color: theme.colors.text2 }]}>
            {error?.message || 'Please check your connection and try again'}
          </Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: '#FFD000' }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              refetch();
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Menu List */}
      {!isLoading && !isError && (
        <FlatList
          data={filteredItems}
          renderItem={renderMenuItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[styles.listContent, { paddingBottom: 120 }]}
          showsVerticalScrollIndicator={false}
          ListHeaderComponent={
            <Text style={[styles.resultCount, { color: theme.colors.text2 }]}>
              {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''} found
            </Text>
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Ionicons name="restaurant-outline" size={64} color={theme.colors.text3} />
              <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>
                No items found
              </Text>
              <Text style={[styles.emptySubtitle, { color: theme.colors.text2 }]}>
                Try adjusting your filters or search query
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
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  storeSelectorContainer: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[3],
  },
  searchSection: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[3],
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  vegIcon: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vegIconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.chip,
    gap: spacing[1],
  },
  sortText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
  },
  cuisineSection: {
    paddingTop: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[3],
  },
  cuisinesContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[3],
  },
  cuisineCard: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[3],
    borderRadius: borderRadius.lg,
    minWidth: 80,
    ...shadows.sm,
  },
  cuisineIcon: {
    fontSize: 28,
    marginBottom: spacing[1],
  },
  cuisineName: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
  },
  categorySection: {
    paddingTop: spacing[4],
  },
  categoriesContainer: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[2],
  },
  categoryChip: {
    marginRight: spacing[2],
  },
  resultCount: {
    fontSize: typography.fontSize.bodySm,
    marginBottom: spacing[3],
  },
  listContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing[4],
  },
  menuItemContainer: {
    marginBottom: spacing[4],
  },
  menuCard: {
    overflow: 'hidden',
  },
  cardContent: {
    flexDirection: 'row',
    padding: spacing[4],
  },
  cardInfo: {
    flex: 1,
    marginRight: spacing[3],
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
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
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: spacing[1],
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
    marginBottom: spacing[2],
  },
  rating: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.semibold,
  },
  reviewCount: {
    fontSize: typography.fontSize.caption,
  },
  description: {
    fontSize: typography.fontSize.bodySm,
    lineHeight: typography.lineHeight.bodySm,
    marginBottom: spacing[2],
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
    marginBottom: spacing[2],
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  metaText: {
    fontSize: typography.fontSize.caption,
  },
  spiceIndicator: {
    fontSize: 12,
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
  imageContainer: {
    position: 'relative',
  },
  dietaryDotOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    zIndex: 2,
  },
  dietaryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.6)',
  },
  itemImage: {
    width: 120,
    height: 120,
    borderRadius: borderRadius.md,
  },
  placeholderImage: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  addButton: {
    position: 'absolute',
    bottom: -spacing[2],
    left: '50%',
    marginLeft: -35,
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
    marginTop: spacing[2],
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  loadingIndicator: {
    alignItems: 'center',
  },
  loadingText: {
    fontSize: typography.fontSize.body,
    marginTop: spacing[2],
  },
  errorTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    marginTop: spacing[4],
    textAlign: 'center',
  },
  errorSubtitle: {
    fontSize: typography.fontSize.body,
    marginTop: spacing[2],
    textAlign: 'center',
  },
  retryButton: {
    marginTop: spacing[6],
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[8],
    borderRadius: borderRadius.button,
    ...shadows.md,
  },
  retryButtonText: {
    color: '#000000',
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default MenuScreen;
