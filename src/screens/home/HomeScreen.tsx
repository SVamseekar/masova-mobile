/**
 * Customer Home — platform-aligned + Swiggy-style motion
 * Store from GET /stores, menu/categories/recommended from GET /menu?storeId=
 */

import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  Animated,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useQueryClient } from '@tanstack/react-query';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';

import { useTheme } from '../../hooks/useTheme';
import { useMenuItems } from '../../hooks/useMenuQueries';
import { useStoreContext } from '../../contexts/StoreContext';
import { useCart } from '../../contexts/CartContext';
import { storeApi } from '../../services/api';
import { spacing, borderRadius, typography } from '../../styles';
import { MaSoVaLogo, FloatingChatBubble } from '../../components/ui';
import { FadeInUp } from '../../components/ui/FadeInUp';
import { AnimatedPressable } from '../../components/ui/AnimatedPressable';
import { StoreSelector } from '../../components/StoreSelector';
import { RootStackParamList, Store, MenuItem } from '../../types';
import {
  categoriesFromMenu,
  formatMenuPrice,
  formatCuisineLabel,
  recommendedFromMenu,
} from '../../utils/menuDisplay';
import { branchImageFor } from '../../constants/branchImages';
import {
  buildStorePromotions,
  CustomerPromotion,
} from '../../services/promotionsService';
import { MenuDishImage } from '../../components/menu/MenuDishImage';
import { DealsCarousel } from '../../components/home/DealsCarousel';
import { iconForCategory } from '../../constants/categoryIcons';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DISH_CARD_WIDTH = SCREEN_WIDTH * 0.42;

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const HomeScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const queryClient = useQueryClient();
  const { selectedStore, selectedStoreId, setSelectedStore, isLoading: storeLoading } =
    useStoreContext();
  const { itemCount, total } = useCart();

  const [apiStores, setApiStores] = useState<Store[]>([]);
  const [storesLoading, setStoresLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [promotions, setPromotions] = useState<CustomerPromotion[]>([]);
  const [promosLoading, setPromosLoading] = useState(false);

  // Floating cart bar — slide + spring when cart gains items
  const cartBarY = useRef(new Animated.Value(100)).current;
  const cartBarOpacity = useRef(new Animated.Value(0)).current;
  const cartBadgeScale = useRef(new Animated.Value(1)).current;
  const prevCount = useRef(0);

  useEffect(() => {
    if (itemCount > 0) {
      Animated.parallel([
        Animated.spring(cartBarY, {
          toValue: 0,
          useNativeDriver: true,
          friction: 8,
          tension: 90,
        }),
        Animated.timing(cartBarOpacity, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
      if (itemCount !== prevCount.current) {
        cartBadgeScale.setValue(0.7);
        Animated.spring(cartBadgeScale, {
          toValue: 1,
          friction: 4,
          tension: 200,
          useNativeDriver: true,
        }).start();
      }
    } else {
      Animated.parallel([
        Animated.timing(cartBarY, {
          toValue: 100,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(cartBarOpacity, {
          toValue: 0,
          duration: 180,
          useNativeDriver: true,
        }),
      ]).start();
    }
    prevCount.current = itemCount;
  }, [itemCount, cartBarY, cartBarOpacity, cartBadgeScale]);

  const {
    data: menuItems,
    isLoading: menuLoading,
    isError: menuError,
    refetch: refetchMenu,
  } = useMenuItems();

  const loadStores = useCallback(async () => {
    try {
      const list = await storeApi.getAll();
      setApiStores(Array.isArray(list) ? list : []);
    } catch {
      setApiStores([]);
    } finally {
      setStoresLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStores();
  }, [loadStores]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([
      loadStores(),
      refetchMenu(),
      queryClient.invalidateQueries({ queryKey: ['menu'] }),
    ]);
    setRefreshing(false);
  };

  const items = useMemo(() => (Array.isArray(menuItems) ? menuItems : []), [menuItems]);
  const categories = useMemo(() => categoriesFromMenu(items).slice(0, 12), [items]);
  const recommended = useMemo(() => recommendedFromMenu(items, 16), [items]);
  const currency = selectedStore?.currency;
  const locale = selectedStore?.locale;

  // Live promotions from campaigns + menu + store policy
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedStoreId) {
        setPromotions([]);
        return;
      }
      setPromosLoading(true);
      try {
        const list = await buildStorePromotions({
          store: selectedStore,
          storeId: selectedStoreId,
          menuItems: items,
        });
        if (!cancelled) setPromotions(list);
      } catch {
        if (!cancelled) setPromotions([]);
      } finally {
        if (!cancelled) setPromosLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [selectedStoreId, selectedStore, items]);

  // Re-run entrance when store or menu payload changes
  const motionKey = `${selectedStoreId || 'none'}-${items.length}-${categories.length}-${promotions.length}`;

  const openSearch = (params?: { category?: string; query?: string }) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('Main', { screen: 'Search', params: params || {} });
  };

  const openItem = (item: MenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('ItemDetail', { itemId: item.id });
  };

  const openCart = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.navigate('Cart');
  };

  const openPromo = (promo: CustomerPromotion) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    // Deals always open a menu browse — never a single SKU
    if (promo.category) {
      openSearch({ category: promo.category });
      return;
    }
    if (promo.cuisine) {
      openSearch({ query: promo.cuisine.replace(/_/g, ' ') });
      return;
    }
    openSearch();
  };

  const renderDishCard = ({ item, index }: { item: MenuItem; index: number }) => (
    <FadeInUp delayMs={40 + index * 45} trigger={motionKey} distance={22}>
      <AnimatedPressable
        style={[
          styles.dishCard,
          { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border },
        ]}
        onPress={() => openItem(item)}
        accessibilityRole="button"
        accessibilityLabel={item.name}
      >
        <MenuDishImage
          name={item.name}
          imageUrl={item.imageUrl}
          style={styles.dishImage}
          placeholderColor={theme.colors.surface2}
          iconColor={theme.colors.text3}
        />
        <View style={styles.dishBody}>
          <Text style={[styles.dishName, { color: theme.colors.text1 }]} numberOfLines={2}>
            {item.name}
          </Text>
          <Text style={[styles.dishMeta, { color: theme.colors.text3 }]} numberOfLines={1}>
            {formatCuisineLabel(item.cuisine || '')}
          </Text>
          <Text style={[styles.dishPrice, { color: theme.colors.text1 }]}>
            {formatMenuPrice(item.discountedPrice ?? item.basePrice, currency, locale)}
          </Text>
        </View>
      </AnimatedPressable>
    </FadeInUp>
  );

  const storeLabel = selectedStore
    ? `${selectedStore.name}${selectedStore.storeCode ? ` · ${selectedStore.storeCode}` : ''}`
    : 'Select a branch';

  const cartTotalLabel = formatMenuPrice(total, currency, locale);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <FadeInUp delayMs={0} distance={10} trigger={motionKey}>
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <MaSoVaLogo size="md" textColor={isDark ? '#FFFFFF' : '#0F0F0F'} />
          <View style={styles.headerRight}>
            <AnimatedPressable
              style={[styles.headerButton, { backgroundColor: theme.colors.surface2 }]}
              onPress={() => openSearch()}
              accessibilityLabel="Search menu"
              scaleTo={0.9}
            >
              <Ionicons name="search-outline" size={20} color={theme.colors.text1} />
            </AnimatedPressable>
            <AnimatedPressable
              style={[styles.headerButton, { backgroundColor: theme.colors.surface2 }]}
              onPress={openCart}
              accessibilityLabel="Cart"
              scaleTo={0.9}
            >
              <Ionicons name="cart-outline" size={20} color={theme.colors.text1} />
              {itemCount > 0 ? (
                <Animated.View
                  style={[styles.cartBadge, { transform: [{ scale: cartBadgeScale }] }]}
                >
                  <Text style={styles.cartBadgeText}>{itemCount > 9 ? '9+' : itemCount}</Text>
                </Animated.View>
              ) : null}
            </AnimatedPressable>
          </View>
        </View>
      </FadeInUp>

      {/* Branch picker */}
      <FadeInUp delayMs={40} distance={12} trigger={motionKey}>
        <View style={styles.storePickerWrap}>
          <StoreSelector />
          {selectedStore ? (
            <Text style={[styles.storeHint, { color: theme.colors.text3 }]}>
              Ordering from {storeLabel}
              {selectedStore.currency ? ` · ${selectedStore.currency}` : ''}
            </Text>
          ) : (
            <Text style={[styles.storeHint, { color: theme.colors.semantic.warning }]}>
              Choose a branch to load the live menu
            </Text>
          )}
        </View>
      </FadeInUp>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: itemCount > 0 ? 120 : 100 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#FFD000" />
        }
      >
        {/* Quick search CTA */}
        <FadeInUp delayMs={80} trigger={motionKey}>
          <AnimatedPressable
            style={[styles.searchCta, { backgroundColor: theme.colors.surface2 }]}
            onPress={() => openSearch()}
            scaleTo={0.98}
          >
            <Ionicons name="search-outline" size={18} color={theme.colors.text2} />
            <Text style={[styles.searchCtaText, { color: theme.colors.text2 }]}>
              Search dishes at this branch…
            </Text>
          </AnimatedPressable>
        </FadeInUp>

        {/* Promotions — basket / category / campaign deals (never single-item) */}
        {(promosLoading || promotions.length > 0) && (
          <FadeInUp delayMs={100} trigger={motionKey} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
                Deals for you
              </Text>
              <Text style={[styles.sectionMeta, { color: theme.colors.text3 }]}>
                This branch
              </Text>
            </View>
            {promosLoading && promotions.length === 0 ? (
              <ActivityIndicator color="#FFD000" style={{ marginVertical: spacing[3] }} />
            ) : (
              <DealsCarousel
                promotions={promotions.slice(0, 5)}
                onPress={openPromo}
              />
            )}
          </FadeInUp>
        )}

        {/* Categories */}
        <FadeInUp delayMs={120} trigger={motionKey} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Categories</Text>
            <TouchableOpacity onPress={() => openSearch()}>
              <Text style={styles.link}>See all</Text>
            </TouchableOpacity>
          </View>
          {!selectedStoreId || menuLoading ? (
            <ActivityIndicator color="#FFD000" style={{ marginVertical: spacing[4] }} />
          ) : menuError ? (
            <Text style={[styles.emptyText, { color: theme.colors.text2 }]}>
              Could not load menu. Pull to refresh.
            </Text>
          ) : categories.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.text2 }]}>
              No categories for this store yet.
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesScroll}
            >
              {categories.map((cat, index) => (
                <FadeInUp
                  key={cat.id}
                  delayMs={130 + index * 35}
                  trigger={motionKey}
                  distance={14}
                >
                  <AnimatedPressable
                    style={styles.categoryItem}
                    onPress={() => openSearch({ category: cat.id })}
                    scaleTo={0.92}
                  >
                    <View
                      style={[styles.categoryIcon, { backgroundColor: theme.colors.surface2 }]}
                    >
                      <Ionicons
                        name={iconForCategory(cat.id, cat.name)}
                        size={24}
                        color={theme.colors.text1}
                      />
                    </View>
                    <Text
                      style={[styles.categoryName, { color: theme.colors.text1 }]}
                      numberOfLines={2}
                    >
                      {cat.name}
                    </Text>
                    <Text style={[styles.categoryCount, { color: theme.colors.text3 }]}>
                      {cat.count}
                    </Text>
                  </AnimatedPressable>
                </FadeInUp>
              ))}
            </ScrollView>
          )}
        </FadeInUp>

        {/* Recommended */}
        <FadeInUp delayMs={200} trigger={motionKey} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
              Recommended for you
            </Text>
            <Text style={[styles.sectionMeta, { color: theme.colors.text3 }]}>
              {selectedStore?.storeCode || '—'}
            </Text>
          </View>
          {!selectedStoreId || menuLoading ? (
            <ActivityIndicator color="#FFD000" style={{ marginVertical: spacing[4] }} />
          ) : recommended.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.text2 }]}>
              No recommended dishes for this branch.
            </Text>
          ) : (
            <FlatList
              data={recommended}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.dishesScroll}
              renderItem={renderDishCard}
            />
          )}
        </FadeInUp>

        {/* Branches */}
        <FadeInUp delayMs={280} trigger={motionKey} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>All branches</Text>
            <Text style={[styles.sectionMeta, { color: theme.colors.text3 }]}>
              Live from platform
            </Text>
          </View>
          {storesLoading || storeLoading ? (
            <ActivityIndicator color="#FFD000" style={{ marginVertical: spacing[3] }} />
          ) : apiStores.length === 0 ? (
            <Text style={[styles.emptyText, { color: theme.colors.text2 }]}>
              No stores returned by the gateway.
            </Text>
          ) : (
            apiStores.map((store, index) => {
              const code = store.storeCode || store.id;
              const selectedKey = selectedStore?.storeCode || selectedStore?.id;
              const isSelected = !!code && code === selectedKey;
              const city =
                typeof store.address === 'object' && store.address ? store.address.city : '';
              const hero = branchImageFor(code, index);
              return (
                <FadeInUp
                  key={store.id || code}
                  delayMs={300 + index * 50}
                  trigger={motionKey}
                  distance={16}
                >
                  <AnimatedPressable
                    onPress={async () => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      await setSelectedStore(store);
                    }}
                    style={{
                      marginHorizontal: spacing.screenPadding,
                      marginBottom: spacing[3],
                    }}
                    scaleTo={0.98}
                  >
                    <View
                      style={[
                        styles.branchHeroCard,
                        isSelected && styles.branchHeroSelected,
                        { borderColor: isSelected ? '#FFD000' : theme.colors.border },
                      ]}
                    >
                      <Image source={hero} style={styles.branchHeroImage} resizeMode="cover" />
                      <LinearGradient
                        colors={['transparent', 'rgba(0,0,0,0.75)']}
                        style={styles.branchHeroGradient}
                      />
                      <View style={styles.branchHeroBody}>
                        <View style={styles.branchHeroTop}>
                          {isSelected ? (
                            <View style={styles.selectedPill}>
                              <Text style={styles.selectedPillText}>Selected</Text>
                            </View>
                          ) : (
                            <View style={styles.orderHerePill}>
                              <Text style={styles.orderHereText}>Order here</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.branchHeroName} numberOfLines={1}>
                          {store.name}
                        </Text>
                        <Text style={styles.branchHeroMeta} numberOfLines={1}>
                          {[code, city, store.currency || store.countryCode]
                            .filter(Boolean)
                            .join(' · ')}
                        </Text>
                      </View>
                    </View>
                  </AnimatedPressable>
                </FadeInUp>
              );
            })
          )}
        </FadeInUp>
      </ScrollView>

      {/* Sticky cart bar — food-app style */}
      <Animated.View
        pointerEvents={itemCount > 0 ? 'auto' : 'none'}
        style={[
          styles.floatingCartWrap,
          {
            paddingBottom: Math.max(insets.bottom, 10),
            opacity: cartBarOpacity,
            transform: [{ translateY: cartBarY }],
          },
        ]}
      >
        <AnimatedPressable
          style={styles.floatingCart}
          onPress={openCart}
          scaleTo={0.98}
          accessibilityRole="button"
          accessibilityLabel={`View cart, ${itemCount} items, ${cartTotalLabel}`}
        >
          <View style={styles.floatingCartLeft}>
            <Animated.View style={{ transform: [{ scale: cartBadgeScale }] }}>
              <View style={styles.floatingCartCount}>
                <Text style={styles.floatingCartCountText}>{itemCount}</Text>
              </View>
            </Animated.View>
            <View>
              <Text style={styles.floatingCartTitle}>View cart</Text>
              <Text style={styles.floatingCartSub}>{cartTotalLabel}</Text>
            </View>
          </View>
          <View style={styles.floatingCartCta}>
            <Text style={styles.floatingCartCtaText}>Checkout</Text>
            <Ionicons name="arrow-forward" size={16} color="#0F0F0F" />
          </View>
        </AnimatedPressable>
      </Animated.View>

      <FloatingChatBubble bottomOffset={itemCount > 0 ? 120 : 72} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  headerRight: { flexDirection: 'row', gap: spacing[2] },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cartBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  cartBadgeText: {
    color: '#fff',
    fontSize: 10,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  storePickerWrap: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[2],
  },
  storeHint: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
  },
  searchCta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing[3],
    paddingHorizontal: spacing[3],
    height: 44,
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  searchCtaText: {
    fontSize: typography.fontSize.bodySm,
    fontFamily: 'PlusJakartaSans-Regular',
  },
  section: { marginBottom: spacing[5] },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    marginBottom: spacing[3],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  sectionMeta: {
    fontSize: typography.fontSize.caption,
  },
  link: {
    color: '#FFD000',
    fontFamily: 'PlusJakartaSans-SemiBold',
    fontSize: typography.fontSize.bodySm,
  },
  emptyText: {
    paddingHorizontal: spacing.screenPadding,
    fontSize: typography.fontSize.bodySm,
    lineHeight: 20,
  },
  categoriesScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[3],
  },
  categoryItem: {
    width: 76,
    alignItems: 'center',
  },
  categoryIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[1],
  },
  categoryName: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Medium',
    textAlign: 'center',
  },
  categoryCount: {
    fontSize: 10,
    marginTop: 2,
  },
  dishesScroll: {
    paddingHorizontal: spacing.screenPadding,
    gap: spacing[3],
  },
  dishCard: {
    width: DISH_CARD_WIDTH,
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    marginRight: spacing[3],
  },
  dishImage: {
    width: '100%',
    height: DISH_CARD_WIDTH * 0.75,
  },
  dishImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  dishBody: {
    padding: spacing[2],
  },
  dishName: {
    fontSize: typography.fontSize.bodySm,
    fontFamily: 'PlusJakartaSans-SemiBold',
    minHeight: 36,
  },
  dishMeta: {
    fontSize: 11,
    marginTop: 2,
  },
  dishPrice: {
    marginTop: spacing[1],
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: typography.fontSize.bodySm,
  },
  branchHeroCard: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    height: 148,
    borderWidth: 1,
    backgroundColor: '#1A1A1A',
  },
  branchHeroSelected: {
    borderWidth: 2,
  },
  branchHeroImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  branchHeroGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  branchHeroBody: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: spacing[3],
  },
  branchHeroTop: {
    position: 'absolute',
    top: spacing[3],
    right: spacing[3],
  },
  branchHeroName: {
    fontSize: typography.fontSize.titleSm,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#FFFFFF',
  },
  branchHeroMeta: {
    fontSize: typography.fontSize.caption,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
  },
  selectedPill: {
    backgroundColor: '#FFD000',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  selectedPillText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F0F0F',
  },
  orderHerePill: {
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  orderHereText: {
    fontSize: 11,
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#FFFFFF',
  },
  floatingCartWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing[2],
  },
  floatingCart: {
    backgroundColor: '#1A1A1A',
    borderRadius: borderRadius.xl ?? 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  floatingCartLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  floatingCartCount: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: '#FFD000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  floatingCartCountText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F0F0F',
    fontSize: 14,
  },
  floatingCartTitle: {
    fontFamily: 'PlusJakartaSans-SemiBold',
    color: '#FFFFFF',
    fontSize: 15,
  },
  floatingCartSub: {
    fontFamily: 'PlusJakartaSans-Medium',
    color: 'rgba(255,255,255,0.7)',
    fontSize: 12,
    marginTop: 1,
  },
  floatingCartCta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#FFD000',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  floatingCartCtaText: {
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#0F0F0F',
    fontSize: 13,
  },
});

export default HomeScreen;
