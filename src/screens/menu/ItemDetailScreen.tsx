/**
 * Item Detail Screen
 * Full item view with variants and customizations.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { RouteProp, useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { useMenuItem, useMenuItems } from '../../hooks/useMenuQueries';
import { useSelectedStore } from '../../hooks/useSelectedStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useCart } from '../../contexts/CartContext';
import { useAuth } from '../../contexts/AuthContext';
import { Button, QuantitySelector } from '../../components/ui';
import { MenuDishImage } from '../../components/menu/MenuDishImage';
import { AllergenLabels, CachedMenuNotice, MenuNotice } from '../../components/menu/DiscoveryUI';
import { toggleOption, validateSelection } from '../../components/menu/menuDiscovery';
import { CustomizationOption, RootStackParamList } from '../../types';
import { favoritesService } from '../../services/favoritesService';
import { formatCategoryLabel, formatMenuPrice } from '../../utils/menuDisplay';

const ItemDetailScreen: React.FC = () => {
  const route = useRoute<RouteProp<RootStackParamList, 'ItemDetail'>>();
  const { selectedStoreId } = useSelectedStore();
  return (
    <ItemDetail key={`${selectedStoreId}:${route.params.itemId}`} itemId={route.params.itemId} />
  );
};

const ItemDetail: React.FC<{ itemId: string }> = ({ itemId }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedStore, selectedStoreId } = useSelectedStore();
  const storeRef = useRef(selectedStoreId);
  storeRef.current = selectedStoreId;
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  const { isOffline } = useNetworkStatus();
  const { user } = useAuth();
  const { addItem } = useCart();
  const detail = useMenuItem(itemId);
  const menu = useMenuItems();
  const storeItem = menu.data?.find((item) => item.id === itemId);
  // Store payload owns price and eligibility; global item endpoint cannot establish store membership.
  const item = storeItem ? { ...detail.data, ...storeItem } : null;
  const [quantity, setQuantity] = useState(1);
  const [variantId, setVariantId] = useState<string>();
  const [options, setOptions] = useState<Map<string, CustomizationOption[]>>(new Map());
  const [favorite, setFavorite] = useState(false);
  const [savingFavorite, setSavingFavorite] = useState(false);
  const [pending, setPending] = useState(false);
  const pendingRef = useRef(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const variant = item?.variants?.find((value) => value.id === variantId);
  const eligible =
    !!selectedStoreId &&
    !!storeItem &&
    // An omitted opening status is unknown. Checkout owns operational validation;
    // local cart selection remains available unless the store is explicitly closed.
    selectedStore?.isOpen !== false &&
    selectedStore?.status !== 'INACTIVE' &&
    selectedStore?.status !== 'MAINTENANCE';
  const selectionError = item ? validateSelection(item, eligible, variant, options) : null;
  const money = (amount: number) =>
    formatMenuPrice(amount, selectedStore?.currency, selectedStore?.locale);
  const estimate = item
    ? ((item.discountedPrice ?? item.basePrice) +
        (variant?.priceModifier ?? 0) +
        [...options.values()].flat().reduce((sum, value) => sum + value.priceModifier, 0)) *
      quantity
    : 0;
  useEffect(() => {
    let mounted = true;
    void favoritesService.isFavorite(itemId).then((value) => {
      if (mounted) setFavorite(value);
    });
    return () => {
      mounted = false;
    };
  }, [itemId]);
  const retry = () => {
    void menu.refetch();
    void detail.refetch();
  };
  const add = async () => {
    if (!item || pendingRef.current || isOffline || selectionError) return;
    pendingRef.current = true;
    setPending(true);
    setSubmitError(null);
    const requestedStore = selectedStoreId;
    try {
      const fresh = await menu.refetch();
      if (!alive.current || storeRef.current !== requestedStore) return;
      if (fresh.isError || !fresh.data)
        throw new Error('Could not check current availability. Retry before adding.');
      const current = fresh.data.find((value) => value.id === itemId);
      if (!current) throw new Error('This dish is no longer available at this store.');
      const currentVariant = current.variants?.find((value) => value.id === variantId);
      const validation = validateSelection(current, eligible, currentVariant, options);
      if (validation) throw new Error(validation);
      // Rebind selected IDs to latest option prices; never add stale modifier values.
      const currentOptions = new Map<string, CustomizationOption[]>();
      for (const [groupId, chosen] of options) {
        const group = current.customizations?.find((value) => value.id === groupId);
        currentOptions.set(
          groupId,
          chosen.map((value) => group!.options.find((option) => option.id === value.id)!),
        );
      }
      addItem(current, quantity, currentVariant, currentOptions);
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.navigate('Cart');
    } catch (error) {
      if (alive.current)
        setSubmitError(error instanceof Error ? error.message : 'Could not add this dish. Retry.');
    } finally {
      pendingRef.current = false;
      if (alive.current) setPending(false);
    }
  };
  const saveFavorite = async () => {
    if (!item || savingFavorite) return;
    setSavingFavorite(true);
    try {
      const value = await favoritesService.toggle(item);
      if (alive.current) setFavorite(value);
      if (user?.id) void favoritesService.syncToCustomer(user.id);
    } catch {
      if (alive.current) setSubmitError('Could not save this dish. Try again.');
    } finally {
      if (alive.current) setSavingFavorite(false);
    }
  };
  const back = (
    <Pressable
      style={[styles.icon, { backgroundColor: theme.colors.surface1 }]}
      onPress={() => navigation.goBack()}
      accessibilityRole="button"
      accessibilityLabel="Back to menu"
    >
      <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
    </Pressable>
  );
  if (!item)
    return (
      <View
        style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}
      >
        {back}
        <MenuNotice
          title={
            !selectedStoreId
              ? 'Choose a store first'
              : menu.isLoading || detail.isLoading
                ? 'Loading item details…'
                : menu.isError || detail.isError
                  ? 'Failed to load item'
                  : 'Dish unavailable at this store'
          }
          loading={menu.isLoading || detail.isLoading}
          detail={menu.error?.message || detail.error?.message}
          onRetry={retry}
          pending={menu.isFetching || detail.isFetching}
        />
      </View>
    );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.bg }]}
    >
      <ScrollView
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingBottom: 16 }}
      >
        <View>
          <MenuDishImage
            name={item.name}
            imageUrl={item.imageUrl}
            style={{ width, height: Math.min(width * 0.78, 320) }}
          />
          <View style={[styles.heroControls, { top: insets.top + 8 }]}>
            {back}
            <Pressable
              style={[styles.icon, { backgroundColor: theme.colors.surface1 }]}
              accessibilityRole="button"
              accessibilityLabel={favorite ? 'Remove from saved' : 'Save dish'}
              accessibilityState={{
                selected: favorite,
                busy: savingFavorite,
                disabled: savingFavorite,
              }}
              disabled={savingFavorite}
              onPress={() => {
                void saveFavorite();
              }}
            >
              <Ionicons
                name={favorite ? 'heart' : 'heart-outline'}
                size={24}
                color={theme.colors.text1}
              />
            </Pressable>
          </View>
        </View>
        <View style={styles.content}>
          <View style={styles.row}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text1 }]}>
              {item.name}
            </Text>
            <Text style={[styles.price, { color: theme.colors.text1 }]}>
              {money(item.discountedPrice ?? item.basePrice)}
            </Text>
          </View>
          <Text style={[styles.body, { color: theme.colors.text2 }]}>{item.description}</Text>
          <AllergenLabels item={item} />
          {item.allergensDeclared !== true && (
            <Text style={[styles.meta, { color: theme.colors.warning }]}>
              Ask the store before ordering if you have an allergy. Cross-contact may occur.
            </Text>
          )}
          <View style={styles.wrap}>
            {(item.dietaryInfo ?? []).map((value) => (
              <Text key={value} style={[styles.meta, { color: theme.colors.success }]}>
                {formatCategoryLabel(value)}
              </Text>
            ))}
          </View>
          <CachedMenuNotice
            offline={isOffline}
            failed={menu.isError}
            updatedAt={menu.dataUpdatedAt}
            onRetry={retry}
            pending={menu.isFetching}
          />
          {!!item.variants?.length && (
            <View style={[styles.section, { borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
                Choose a size · Required
              </Text>
              <View style={styles.wrap}>
                {item.variants.map((value) => (
                  <Pressable
                    key={value.id}
                    disabled={pending || value.isAvailable === false}
                    style={[
                      styles.size,
                      {
                        backgroundColor:
                          variantId === value.id ? theme.colors.selection : theme.colors.surface1,
                        borderColor: theme.colors.border,
                      },
                    ]}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: variantId === value.id, disabled: pending || value.isAvailable === false }}
                    accessibilityLabel={`${value.name}, ${money((item.discountedPrice ?? item.basePrice) + value.priceModifier)}`}
                    onPress={() => {
                      setVariantId(value.id);
                      setSubmitError(null);
                    }}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.body, { color: theme.colors.text1 }]}>{value.name}{value.isAvailable === false ? ' · Unavailable' : ''}</Text>
                      <Text style={[styles.meta, { color: theme.colors.text2 }]}>
                        {money((item.discountedPrice ?? item.basePrice) + value.priceModifier)}
                      </Text>
                    </View>
                    <Ionicons
                      name={variantId === value.id ? 'radio-button-on' : 'radio-button-off'}
                      size={22}
                      color={theme.colors.text1}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          )}
          {(item.customizations ?? []).map((group) => (
            <View key={group.id} style={[styles.section, { borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
                {group.name} · {group.required ? 'Required' : 'Optional'}
              </Text>
              <Text style={[styles.meta, { color: theme.colors.text2 }]}>
                Choose {group.maxSelections === 1 ? 'one' : `up to ${group.maxSelections}`}
              </Text>
              {group.options.map((option) => {
                const chosen = options.get(group.id) ?? [];
                const checked = chosen.some((value) => value.id === option.id);
                const disabled =
                  pending ||
                  (option.isAvailable === false && !checked) ||
                  (!checked && group.maxSelections !== 1 && chosen.length >= group.maxSelections);
                return (
                  <Pressable
                    key={option.id}
                    accessibilityRole={group.maxSelections === 1 ? 'radio' : 'checkbox'}
                    accessibilityState={{ checked, disabled }}
                    accessibilityLabel={`${option.name}, ${money(option.priceModifier)}`}
                    disabled={disabled}
                    style={[styles.option, { opacity: disabled ? 0.5 : 1 }]}
                    onPress={() => {
                      setOptions((previous) =>
                        new Map(previous).set(
                          group.id,
                          toggleOption(previous.get(group.id) ?? [], option, group.maxSelections),
                        ),
                      );
                      setSubmitError(null);
                    }}
                  >
                    <Ionicons
                      name={checked ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={theme.colors.text1}
                    />
                    <Text style={[styles.body, { flex: 1, color: theme.colors.text1 }]}>
                      {option.name}
                    </Text>
                    <Text style={[styles.body, { color: theme.colors.text1 }]}>
                      {option.priceModifier > 0 ? '+' : ''}
                      {money(option.priceModifier)}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          ))}
          {!!item.nutritionalInfo && (
            <View style={[styles.section, { borderColor: theme.colors.border }]}>
              <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Nutrition</Text>
              <Text style={[styles.body, { color: theme.colors.text2 }]}>
                {item.nutritionalInfo.calories} kcal · Protein {item.nutritionalInfo.protein}g ·
                Carbs {item.nutritionalInfo.carbs}g · Fat {item.nutritionalInfo.fat}g
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
      <View
        style={[
          styles.footer,
          {
            paddingBottom: Math.max(insets.bottom, 12),
            backgroundColor: theme.colors.surface1,
            borderColor: theme.colors.border,
          },
        ]}
      >
        {(submitError || selectionError || isOffline) && (
          <Text
            accessibilityLiveRegion="polite"
            style={[styles.meta, { color: submitError ? theme.colors.error : theme.colors.text2 }]}
          >
            {submitError ||
              (isOffline ? 'Connect to check availability before adding.' : selectionError)}
          </Text>
        )}
        <Text style={[styles.meta, { color: theme.colors.text2 }]}>
          Item estimate {money(estimate)} · Final total at checkout.
        </Text>
        <View style={styles.row}>
          <QuantitySelector
            disabled={pending}
            value={quantity}
            onChange={(value) => {
              if (!pending) setQuantity(value);
            }}
          />
          <Button
            title="Add to cart"
            onPress={() => {
              void add();
            }}
            disabled={!!selectionError || isOffline || pending}
            loading={pending}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  heroControls: {
    position: 'absolute',
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  icon: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, gap: 12 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  title: { fontSize: 26, fontWeight: '700', flex: 1 },
  price: { fontSize: 20, fontWeight: '700', fontVariant: ['tabular-nums'] },
  body: { fontSize: 16, lineHeight: 24 },
  meta: { fontSize: 12, lineHeight: 18 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  section: { borderTopWidth: 1, paddingTop: 16, gap: 8 },
  sectionTitle: { fontSize: 16, fontWeight: '600' },
  size: {
    minWidth: '45%',
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 8,
    minHeight: 64,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  option: { minHeight: 48, flexDirection: 'row', alignItems: 'center', gap: 12 },
  footer: { padding: 12, borderTopWidth: 1, gap: 8 },
});
export default ItemDetailScreen;
