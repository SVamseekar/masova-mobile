/**
 * Cart Screen
 * Shopping cart with items, coupon, and checkout
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useCart } from '../../contexts/CartContext';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Button, Card, QuantitySelector, FloatingChatBubble } from '../../components/ui';
import { RootStackParamList } from '../../types';

// Mock cart data
const MOCK_CART_ITEMS: any[] = [
  {
    id: '1',
    menuItem: {
      id: '1',
      name: 'Margherita Pizza',
      description: 'Classic Italian pizza',
      cuisine: 'ITALIAN',
      category: 'PIZZA',
      basePrice: 34900,
      discountedPrice: 29900,
      variants: [],
      customizations: [],
      dietaryInfo: ['VEGETARIAN'],
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=200',
      isAvailable: true,
      preparationTime: 25,
      isRecommended: true,
    },
    quantity: 2,
    selectedVariant: { id: 'v2', name: 'Large (12")', priceModifier: 10000 },
    selectedCustomizations: [
      {
        customizationId: 'c1',
        customizationName: 'Extra Toppings',
        selectedOptions: [{ id: 'o1', name: 'Extra Cheese', priceModifier: 5000 }],
      },
    ],
    totalPrice: 89800, // (29900 + 10000 + 5000) * 2
  },
  {
    id: '2',
    menuItem: {
      id: '3',
      name: 'Garlic Bread',
      description: 'Crispy garlic bread with herbs',
      cuisine: 'ITALIAN',
      category: 'APPETIZER',
      basePrice: 14900,
      variants: [],
      customizations: [],
      dietaryInfo: ['VEGETARIAN'],
      imageUrl: 'https://images.unsplash.com/photo-1619535860434-ba1d8fa12536?w=200',
      isAvailable: true,
      preparationTime: 10,
      isRecommended: false,
    },
    quantity: 1,
    selectedCustomizations: [],
    totalPrice: 14900,
  },
];

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CartScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  // Use real cart context
  const {
    items: cartItems,
    subtotal,
    deliveryFee,
    taxes,
    total,
    updateQuantity,
    removeItem,
  } = useCart();

  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [couponDiscount, setCouponDiscount] = useState(0);

  const formatPrice = (price: number) => `₹${(price / 100).toFixed(0)}`;

  const handleQuantityChange = (itemId: string, newQuantity: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    updateQuantity(itemId, newQuantity);
  };

  const handleRemoveItem = (itemId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    removeItem(itemId);
  };

  const handleApplyCoupon = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (couponCode.toUpperCase() === 'WELCOME50') {
      const discount = Math.min(subtotal * 0.5, 20000); // 50% up to ₹200
      setCouponDiscount(discount);
      setAppliedCoupon(couponCode.toUpperCase());
    } else {
      setCouponDiscount(0);
      setAppliedCoupon(null);
      // Show error
    }
  };

  const handleRemoveCoupon = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCouponCode('');
    setCouponDiscount(0);
    setAppliedCoupon(null);
  };

  const renderCartItem = (item: any) => (
    <Card key={item.id} elevation="sm" style={styles.cartItem}>
      <View style={styles.itemRow}>
        <Image source={{ uri: item.menuItem.imageUrl }} style={styles.itemImage} />
        <View style={styles.itemDetails}>
          <View style={styles.itemHeader}>
            <Text
              style={[styles.itemName, { color: theme.colors.text1 }]}
              numberOfLines={1}
            >
              {item.menuItem.name}
            </Text>
            <TouchableOpacity onPress={() => handleRemoveItem(item.id)}>
              <Ionicons name="trash-outline" size={18} color={theme.colors.semantic.error} />
            </TouchableOpacity>
          </View>
          {item.selectedVariant && (
            <Text style={[styles.itemVariant, { color: theme.colors.text2 }]}>
              {item.selectedVariant.name}
            </Text>
          )}
          {item.selectedCustomizations && (
            Array.from((item.selectedCustomizations as Map<string, {name: string}[]>).values()).map((options, index) => (
              <Text
                key={index}
                style={[styles.itemCustomization, { color: theme.colors.text3 }]}
              >
                {options.map((o) => o.name).join(', ')}
              </Text>
            ))
          )}
          <View style={styles.itemFooter}>
            <Text style={[styles.itemPrice, { color: theme.colors.text1 }]}>
              {formatPrice((item as any).itemTotal ?? (item as any).totalPrice)}
            </Text>
            <QuantitySelector
              value={item.quantity}
              onChange={(qty) => handleQuantityChange(item.id, qty)}
              size="sm"
              min={0}
            />
          </View>
        </View>
      </View>
    </Card>
  );

  const renderEmptyCart = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="cart-outline" size={80} color={theme.colors.text3} />
      <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>
        Your cart is empty
      </Text>
      <Text style={[styles.emptySubtitle, { color: theme.colors.text2 }]}>
        Add some delicious items to get started
      </Text>
      <Button
        title="Browse Menu"
        onPress={() => navigation.navigate('Main', { screen: 'Search' } as any)}
        variant="primary"
        style={styles.browseButton}
      />
    </View>
  );

  if (cartItems.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <Text style={[styles.title, { color: theme.colors.text1 }]}>Cart</Text>
        </View>
        {renderEmptyCart()}
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Cart</Text>
        <Text style={[styles.itemCount, { color: theme.colors.text2 }]}>
          {cartItems.length} {cartItems.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Cart Items */}
        <View style={styles.itemsSection}>
          {cartItems.map(renderCartItem)}
        </View>

        {/* Coupon Section */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Apply Coupon
          </Text>
          <Card elevation="none" style={{...styles.couponCard, borderColor: theme.colors.border}}>
            {appliedCoupon ? (
              <View style={styles.appliedCoupon}>
                <View style={styles.couponInfo}>
                  <Ionicons
                    name="pricetag"
                    size={20}
                    color={theme.colors.semantic.success}
                  />
                  <View>
                    <Text style={[styles.couponAppliedText, { color: theme.colors.semantic.success }]}>
                      {appliedCoupon} applied
                    </Text>
                    <Text style={[styles.couponSavings, { color: theme.colors.text2 }]}>
                      You save {formatPrice(couponDiscount)}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity onPress={handleRemoveCoupon}>
                  <Ionicons name="close-circle" size={24} color={theme.colors.text3} />
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.couponInput}>
                <TextInput
                  value={couponCode}
                  onChangeText={setCouponCode}
                  placeholder="Enter coupon code"
                  placeholderTextColor={theme.colors.text3}
                  style={[styles.couponTextInput, { color: theme.colors.text1 }]}
                  autoCapitalize="characters"
                />
                <TouchableOpacity
                  style={[
                    styles.applyButton,
                    { backgroundColor: '#FFD000' },
                  ]}
                  onPress={handleApplyCoupon}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            )}
          </Card>
        </View>

        {/* Bill Details */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Bill Details
          </Text>
          <Card elevation="none" style={{...styles.billCard, borderColor: theme.colors.border}}>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.colors.text2 }]}>
                Item Total
              </Text>
              <Text style={[styles.billValue, { color: theme.colors.text1 }]}>
                {formatPrice(subtotal)}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Regular' }]}>
                Delivery fee
              </Text>
              <Text style={[styles.billValue, { color: theme.colors.text2, fontFamily: 'PlusJakartaSans-Medium' }]}>
                {deliveryFee === 0 ? 'FREE' : formatPrice(deliveryFee)}
              </Text>
            </View>
            <View style={styles.billRow}>
              <Text style={[styles.billLabel, { color: theme.colors.text2 }]}>
                Taxes & Charges
              </Text>
              <Text style={[styles.billValue, { color: theme.colors.text1 }]}>
                {formatPrice(taxes)}
              </Text>
            </View>
            {couponDiscount > 0 && (
              <View style={styles.billRow}>
                <Text style={[styles.billLabel, { color: theme.colors.semantic.success }]}>
                  Coupon Discount
                </Text>
                <Text style={[styles.billValue, { color: theme.colors.semantic.success }]}>
                  -{formatPrice(couponDiscount)}
                </Text>
              </View>
            )}
            <View style={[styles.billDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.billRow}>
              <Text style={[styles.billTotal, { color: theme.colors.text1 }]}>
                To Pay
              </Text>
              <Text style={[styles.billTotalValue, { color: theme.colors.text1 }]}>
                {formatPrice(total)}
              </Text>
            </View>
          </Card>
        </View>

        {/* Spacer - account for checkout bar + tab bar */}
        <View style={{ height: 180 }} />
      </ScrollView>

      <FloatingChatBubble bottomOffset={130} />

      {/* Checkout Bar - positioned above tab bar */}
      <View
        style={[
          styles.checkoutBar,
          {
            backgroundColor: theme.colors.surface1,
            bottom: 60 + insets.bottom, // Account for tab bar height (60) + safe area
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <View style={styles.checkoutInfo}>
          <Text style={[styles.checkoutTotal, { color: theme.colors.text1 }]}>
            {formatPrice(total)}
          </Text>
          <Text style={[styles.checkoutItems, { color: theme.colors.text2 }]}>
            Total ({cartItems.reduce((sum, item) => sum + item.quantity, 0)} items)
          </Text>
        </View>
        <Button
          title="Proceed to Checkout"
          onPress={() => navigation.navigate('CheckoutOptions')}
          size="lg"
          style={styles.checkoutButton}
        />
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  title: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  itemCount: {
    fontSize: typography.fontSize.body,
  },
  scrollContent: {
    paddingTop: spacing[2],
  },
  itemsSection: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[3],
  },
  cartItem: {
    marginBottom: spacing[2],
  },
  itemRow: {
    flexDirection: 'row',
  },
  itemImage: {
    width: 80,
    height: 80,
    borderRadius: borderRadius.md,
    marginRight: spacing[3],
  },
  itemDetails: {
    flex: 1,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemName: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    flex: 1,
    marginRight: spacing[2],
  },
  itemVariant: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
  },
  itemCustomization: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing[3],
  },
  itemPrice: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.bold,
  },
  section: {
    paddingHorizontal: spacing.screenPadding,
    marginTop: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    marginBottom: spacing[3],
  },
  couponCard: {
    borderWidth: 1,
  },
  couponInput: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  couponTextInput: {
    flex: 1,
    fontSize: typography.fontSize.body,
    paddingVertical: 0,
  },
  applyButton: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.button,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.label,
    fontWeight: typography.fontWeight.semibold,
  },
  appliedCoupon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  couponInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  couponAppliedText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  couponSavings: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  billCard: {
    borderWidth: 1,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing[3],
  },
  billLabel: {
    fontSize: typography.fontSize.body,
  },
  billValue: {
    fontSize: typography.fontSize.body,
  },
  billDivider: {
    height: 1,
    marginVertical: spacing[2],
  },
  billTotal: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
  },
  billTotalValue: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
  },
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    ...shadows.lg,
  },
  checkoutInfo: {},
  checkoutTotal: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
  },
  checkoutItems: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  checkoutButton: {
    minWidth: 180,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[8],
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
  },
  browseButton: {
    marginTop: spacing[6],
  },
});

export default CartScreen;
