/**
 * Item Detail Screen
 * Full item view with variants and customizations
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useMenuItem } from '../../hooks/useMenuQueries';
import { useCart } from '../../contexts/CartContext';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Button, Badge, QuantitySelector, Card } from '../../components/ui';
import { RootStackParamList, MenuItem, MenuVariant, CustomizationOption } from '../../types';
import { AllergenType, ALLERGEN_LABELS } from '../../constants/allergens';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = SCREEN_HEIGHT * 0.4;

// Mock item data (fallback during development)
const MOCK_ITEM: MenuItem = {
  id: '1',
  name: 'Margherita Pizza',
  description: 'Classic Italian pizza with fresh mozzarella cheese, aromatic basil leaves, and our signature tomato sauce on a perfectly baked thin crust.',
  cuisine: 'ITALIAN',
  category: 'PIZZA',
  basePrice: 34900,
  discountedPrice: 29900,
  variants: [
    { id: 'v1', name: 'Regular (8")', priceModifier: 0 },
    { id: 'v2', name: 'Large (12")', priceModifier: 10000 },
    { id: 'v3', name: 'Family (16")', priceModifier: 20000 },
  ],
  customizations: [
    {
      id: 'c1',
      name: 'Extra Toppings',
      required: false,
      maxSelections: 5,
      options: [
        { id: 'o1', name: 'Extra Cheese', priceModifier: 5000 },
        { id: 'o2', name: 'Jalapenos', priceModifier: 3000 },
        { id: 'o3', name: 'Olives', priceModifier: 3000 },
        { id: 'o4', name: 'Mushrooms', priceModifier: 4000 },
      ],
    },
    {
      id: 'c2',
      name: 'Crust Type',
      required: true,
      maxSelections: 1,
      options: [
        { id: 'o5', name: 'Classic Thin', priceModifier: 0 },
        { id: 'o6', name: 'Pan Crust', priceModifier: 2000 },
        { id: 'o7', name: 'Cheese Burst', priceModifier: 8000 },
      ],
    },
  ],
  dietaryInfo: ['VEGETARIAN'],
  spiceLevel: 'MILD',
  nutritionalInfo: {
    calories: 850,
    protein: 32,
    carbs: 98,
    fat: 38,
  },
  imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=800',
  isAvailable: true,
  preparationTime: 25,
  isRecommended: true,
  rating: 4.5,
  reviewCount: 230,
};

type ItemDetailRouteProp = RouteProp<RootStackParamList, 'ItemDetail'>;

const ItemDetailScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<ItemDetailRouteProp>();
  const { addItem } = useCart();

  // Fetch item from API
  const { data: item, isLoading, isError, error } = useMenuItem(route.params.itemId);

  // Use API data if available, fallback to mock data
  const menuItem = item || MOCK_ITEM;

  const [quantity, setQuantity] = useState(1);
  const [selectedVariant, setSelectedVariant] = useState<MenuVariant | null>(
    menuItem.variants?.[0] || null
  );
  const [selectedOptions, setSelectedOptions] = useState<Map<string, CustomizationOption[]>>(
    new Map()
  );
  const [isFavorite, setIsFavorite] = useState(false);

  const formatPrice = (price: number) => `₹${(price / 100).toFixed(0)}`;

  const calculateTotalPrice = () => {
    let total = menuItem.discountedPrice || menuItem.basePrice;

    if (selectedVariant) {
      total += selectedVariant.priceModifier;
    }

    selectedOptions.forEach((options) => {
      options.forEach((opt) => {
        total += opt.priceModifier;
      });
    });

    return total * quantity;
  };

  const handleVariantSelect = (variant: MenuVariant) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedVariant(variant);
  };

  const handleOptionToggle = (customizationId: string, option: CustomizationOption, maxSelections: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const currentOptions = selectedOptions.get(customizationId) || [];
    const isSelected = currentOptions.some((o) => o.id === option.id);

    let newOptions: CustomizationOption[];
    if (isSelected) {
      newOptions = currentOptions.filter((o) => o.id !== option.id);
    } else {
      if (maxSelections === 1) {
        newOptions = [option];
      } else if (currentOptions.length < maxSelections) {
        newOptions = [...currentOptions, option];
      } else {
        return; // Max selections reached
      }
    }

    const newMap = new Map(selectedOptions);
    newMap.set(customizationId, newOptions);
    setSelectedOptions(newMap);
  };

  const handleAddToCart = () => {
    // Add item to cart with selected options
    addItem(
      menuItem,
      quantity,
      selectedVariant || undefined,
      selectedOptions
    );

    // Haptic feedback and navigate back
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    navigation.goBack();
  };

  // Loading state
  if (isLoading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.colors.bg }]}>
        <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
          Loading item details...
        </Text>
      </View>
    );
  }

  // Error state
  if (isError) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.colors.bg }]}>
        <Ionicons name="alert-circle-outline" size={64} color={theme.colors.semantic.error} />
        <Text style={[styles.errorTitle, { color: theme.colors.text1 }]}>
          Failed to load item
        </Text>
        <Text style={[styles.errorSubtitle, { color: theme.colors.text2 }]}>
          {error?.message || 'Please try again'}
        </Text>
        <Button
          title="Go Back"
          onPress={() => navigation.goBack()}
          style={styles.errorButton}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header Image */}
      <View style={styles.imageContainer}>
        <Image source={{ uri: menuItem.imageUrl }} style={styles.image} />
        <LinearGradient
          colors={['rgba(0,0,0,0.4)', 'transparent', 'transparent']}
          style={styles.imageGradient}
        />

        {/* Header Buttons */}
        <View style={[styles.headerButtons, { top: insets.top + spacing[2] }]}>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.surface2 }]}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={24} color={theme.colors.text1} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: theme.colors.surface2 }]}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setIsFavorite(!isFavorite);
            }}
          >
            <Ionicons
              name={isFavorite ? 'heart' : 'heart-outline'}
              size={24}
              color={isFavorite ? '#FFD000' : theme.colors.text1}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Item Info */}
        <View style={styles.itemInfo}>
          <View style={styles.titleRow}>
            <Text style={[styles.itemName, { color: theme.colors.text1 }]}>
              {menuItem.name}
            </Text>
            {menuItem.dietaryInfo?.includes('VEGETARIAN') && (
              <View style={[styles.vegBadge, { borderColor: theme.colors.semantic.success }]}>
                <View style={[styles.vegDot, { backgroundColor: theme.colors.semantic.success }]} />
              </View>
            )}
          </View>

          <View style={styles.metaRow}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={[styles.rating, { color: theme.colors.text1 }]}>
                {menuItem.rating}
              </Text>
              <Text style={[styles.reviewCount, { color: theme.colors.text2 }]}>
                ({menuItem.reviewCount} reviews)
              </Text>
            </View>
            <Text style={[styles.prepTime, { color: theme.colors.text2 }]}>
              <Ionicons name="time-outline" size={14} /> {menuItem.preparationTime} min
            </Text>
          </View>

          <Text style={[styles.description, { color: theme.colors.text2 }]}>
            {menuItem.description}
          </Text>

          <View style={styles.priceRow}>
            <Text style={[styles.price, { color: isDark ? '#FFD000' : theme.colors.text1 }]}>
              {formatPrice(menuItem.discountedPrice || menuItem.basePrice)}
            </Text>
            {menuItem.discountedPrice && (
              <>
                <Text style={[styles.originalPrice, { color: theme.colors.text3 }]}>
                  {formatPrice(menuItem.basePrice)}
                </Text>
                <Badge
                  label={`${Math.round((1 - menuItem.discountedPrice / menuItem.basePrice) * 100)}% OFF`}
                  variant="success"
                  size="sm"
                />
              </>
            )}
          </View>
        </View>

        {/* Variants */}
        {menuItem.variants.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Size
            </Text>
            <View style={styles.variantsContainer}>
              {menuItem.variants.map((variant) => (
                <TouchableOpacity
                  key={variant.id}
                  style={[
                    styles.variantOption,
                    {
                      backgroundColor: selectedVariant?.id === variant.id
                        ? `${'#FFD000'}15`
                        : theme.colors.surface2,
                      borderColor: selectedVariant?.id === variant.id
                        ? '#FFD000'
                        : 'transparent',
                    },
                  ]}
                  onPress={() => handleVariantSelect(variant)}
                >
                  <Text
                    style={[
                      styles.variantName,
                      {
                        color: selectedVariant?.id === variant.id
                          ? '#FFD000'
                          : theme.colors.text1,
                      },
                    ]}
                  >
                    {variant.name}
                  </Text>
                  {variant.priceModifier > 0 && (
                    <Text style={[styles.variantPrice, { color: theme.colors.text2 }]}>
                      +{formatPrice(variant.priceModifier)}
                    </Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Customizations */}
        {menuItem.customizations.map((customization) => (
          <View key={customization.id} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
                {customization.name}
              </Text>
              {customization.required && (
                <Badge label="Required" variant="error" size="sm" />
              )}
              {!customization.required && customization.maxSelections > 1 && (
                <Text style={[styles.maxText, { color: theme.colors.text2 }]}>
                  Max {customization.maxSelections}
                </Text>
              )}
            </View>
            <View style={styles.optionsContainer}>
              {customization.options.map((option) => {
                const isSelected = selectedOptions
                  .get(customization.id)
                  ?.some((o) => o.id === option.id);
                return (
                  <TouchableOpacity
                    key={option.id}
                    style={[
                      styles.optionRow,
                      { borderBottomColor: theme.colors.border },
                    ]}
                    onPress={() =>
                      handleOptionToggle(customization.id, option, customization.maxSelections)
                    }
                  >
                    <View style={styles.optionInfo}>
                      <View
                        style={[
                          customization.maxSelections === 1 ? styles.radioOuter : styles.checkboxOuter,
                          {
                            borderColor: isSelected
                              ? '#FFD000'
                              : theme.colors.text3,
                          },
                        ]}
                      >
                        {isSelected && (
                          <View
                            style={[
                              customization.maxSelections === 1 ? styles.radioInner : styles.checkboxInner,
                              { backgroundColor: '#FFD000' },
                            ]}
                          >
                            {customization.maxSelections > 1 && (
                              <Ionicons name="checkmark" size={12} color="#FFF" />
                            )}
                          </View>
                        )}
                      </View>
                      <Text style={[styles.optionName, { color: theme.colors.text1 }]}>
                        {option.name}
                      </Text>
                    </View>
                    {option.priceModifier > 0 && (
                      <Text style={[styles.optionPrice, { color: theme.colors.text2 }]}>
                        +{formatPrice(option.priceModifier)}
                      </Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}

        {/* Allergen Information */}
        {menuItem.allergensDeclared && menuItem.allergens && menuItem.allergens.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Contains Allergens
            </Text>
            <View style={[styles.allergenWarning, { backgroundColor: '#fff8e1', borderColor: '#f9a825' }]}>
              <Ionicons name="warning" size={16} color="#f9a825" />
              <Text style={[styles.allergenWarningText, { color: '#795548' }]}>
                Contains: {(menuItem.allergens as AllergenType[]).map((a) => ALLERGEN_LABELS[a] ?? a).join(', ')}
              </Text>
            </View>
            <View style={styles.allergenChips}>
              {(menuItem.allergens as AllergenType[]).map((allergen) => (
                <View key={allergen} style={[styles.allergenChip, { backgroundColor: '#fff3e0', borderColor: '#ff9800' }]}>
                  <Text style={[styles.allergenChipText, { color: '#e65100' }]}>
                    {ALLERGEN_LABELS[allergen] ?? allergen}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}
        {menuItem.allergensDeclared && (!menuItem.allergens || menuItem.allergens.length === 0) && (
          <View style={styles.section}>
            <View style={[styles.allergenWarning, { backgroundColor: '#e8f5e9', borderColor: '#4caf50' }]}>
              <Ionicons name="checkmark-circle" size={16} color="#4caf50" />
              <Text style={[styles.allergenWarningText, { color: '#2e7d32' }]}>
                Allergen-free — no major allergens declared
              </Text>
            </View>
          </View>
        )}

        {/* Nutritional Info */}
        {menuItem.nutritionalInfo && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Nutritional Info
            </Text>
            <View style={styles.nutritionGrid}>
              {[
                { label: 'Calories', value: `${menuItem.nutritionalInfo.calories} kcal` },
                { label: 'Protein', value: `${menuItem.nutritionalInfo.protein}g` },
                { label: 'Carbs', value: `${menuItem.nutritionalInfo.carbs}g` },
                { label: 'Fat', value: `${menuItem.nutritionalInfo.fat}g` },
              ].map((item) => (
                <View
                  key={item.label}
                  style={[styles.nutritionItem, { backgroundColor: theme.colors.surface2 }]}
                >
                  <Text style={[styles.nutritionValue, { color: theme.colors.text1 }]}>
                    {item.value}
                  </Text>
                  <Text style={[styles.nutritionLabel, { color: theme.colors.text2 }]}>
                    {item.label}
                  </Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Spacer for bottom bar */}
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Bar */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface,
            paddingBottom: insets.bottom + spacing[3],
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.quantitySection}>
          <QuantitySelector value={quantity} onChange={setQuantity} size="md" />
        </View>
        <Button
          title={`Add to Cart - ${formatPrice(calculateTotalPrice())}`}
          onPress={handleAddToCart}
          size="lg"
          style={styles.addToCartButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  imageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: IMAGE_HEIGHT,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  imageGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  headerButtons: {
    position: 'absolute',
    left: spacing.screenPadding,
    right: spacing.screenPadding,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    marginTop: IMAGE_HEIGHT - 30,
    borderTopLeftRadius: borderRadius.xxl,
    borderTopRightRadius: borderRadius.xxl,
  },
  contentContainer: {
    paddingTop: spacing[6],
  },
  itemInfo: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[4],
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  itemName: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    flex: 1,
  },
  vegBadge: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderRadius: 4,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing[2],
  },
  vegDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[1],
  },
  rating: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  reviewCount: {
    fontSize: typography.fontSize.bodySm,
  },
  prepTime: {
    fontSize: typography.fontSize.bodySm,
  },
  description: {
    fontSize: typography.fontSize.body,
    lineHeight: typography.lineHeight.body,
    marginBottom: spacing[4],
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  price: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
  },
  originalPrice: {
    fontSize: typography.fontSize.body,
    textDecorationLine: 'line-through',
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[6],
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[3],
  },
  maxText: {
    fontSize: typography.fontSize.bodySm,
  },
  variantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  variantOption: {
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    alignItems: 'center',
  },
  variantName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  variantPrice: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  optionsContainer: {
    marginTop: -spacing[3],
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[4],
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  checkboxOuter: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxInner: {
    width: 16,
    height: 16,
    borderRadius: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionName: {
    fontSize: typography.fontSize.body,
  },
  optionPrice: {
    fontSize: typography.fontSize.body,
  },
  nutritionGrid: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  nutritionItem: {
    flex: 1,
    padding: spacing[3],
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  nutritionValue: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  nutritionLabel: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: spacing[4],
    ...shadows.lg,
  },
  quantitySection: {
    flexShrink: 0,
  },
  addToCartButton: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[6],
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
  errorButton: {
    marginTop: spacing[6],
  },
  allergenWarning: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 12,
  },
  allergenWarningText: {
    flex: 1,
    fontSize: typography.fontSize.caption,
    lineHeight: 18,
  },
  allergenChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
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

export default ItemDetailScreen;
