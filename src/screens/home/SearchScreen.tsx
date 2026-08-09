/**
 * Search — food-app style: category chips + dish list always visible
 */

import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  TextInput,
  Keyboard,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useMenuSearch, useMenuItems } from '../../hooks/useMenuQueries';
import { useSelectedStore } from '../../hooks/useSelectedStore';
import { spacing, borderRadius, typography } from '../../styles';
import { Chip } from '../../components/ui';
import { StoreSelector } from '../../components/StoreSelector';
import { MainTabParamList, MenuItem, RootStackParamList } from '../../types';
import {
  categoriesFromMenu,
  formatCategoryLabel,
  formatCuisineLabel,
  formatMenuPrice,
  recommendedFromMenu,
} from '../../utils/menuDisplay';
import { MenuDishImage } from '../../components/menu/MenuDishImage';

type NavProp = NativeStackNavigationProp<RootStackParamList>;
type SearchRoute = RouteProp<MainTabParamList, 'Search'>;

const SearchScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const route = useRoute<SearchRoute>();
  const inputRef = useRef<TextInput>(null);
  const { selectedStore, selectedStoreId } = useSelectedStore();
  const currency = selectedStore?.currency;
  const locale = selectedStore?.locale;

  const initialCategory = route.params?.category || '';
  const initialQuery = route.params?.query || '';

  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [activeCategory, setActiveCategory] = useState<string | undefined>(
    initialCategory || undefined
  );

  useEffect(() => {
    if (route.params?.category) {
      setActiveCategory(route.params.category);
      setQuery('');
      setDebouncedQuery('');
    }
    if (route.params?.query) {
      setQuery(route.params.query);
      setDebouncedQuery(route.params.query);
      setActiveCategory(undefined);
    }
  }, [route.params?.category, route.params?.query]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query.trim()), 300);
    return () => clearTimeout(t);
  }, [query]);

  const {
    data: searchResults,
    isLoading: searchLoading,
    isError: searchError,
    error: searchErr,
  } = useMenuSearch(debouncedQuery);

  const {
    data: fullMenu,
    isLoading: menuLoading,
    isError: menuError,
    error: menuErr,
  } = useMenuItems();

  const isSearchMode = debouncedQuery.length > 2;

  const dishes: MenuItem[] = useMemo(() => {
    const menu = fullMenu || [];
    if (isSearchMode) {
      const remote = searchResults || [];
      // Prefer API search; client-filter fallback if empty
      if (remote.length > 0) return remote;
      const q = debouncedQuery.toLowerCase();
      return menu.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.description?.toLowerCase().includes(q) ||
          i.category?.toLowerCase().includes(q)
      );
    }
    let list = menu.filter((i) => i.isAvailable !== false);
    if (activeCategory) {
      list = list.filter((i) => i.category === activeCategory);
    } else {
      // Idle: recommended first, then rest (food apps show dishes immediately)
      const rec = recommendedFromMenu(list, 24);
      if (rec.length > 0) {
        const ids = new Set(rec.map((r) => r.id));
        list = [...rec, ...list.filter((i) => !ids.has(i.id))];
      }
    }
    return list;
  }, [isSearchMode, searchResults, debouncedQuery, activeCategory, fullMenu]);

  const categoryChips = useMemo(
    () => categoriesFromMenu(fullMenu || []).slice(0, 14),
    [fullMenu]
  );

  const isLoading = isSearchMode ? searchLoading && dishes.length === 0 : menuLoading;
  const isError = isSearchMode ? searchError && dishes.length === 0 : menuError;
  const error = isSearchMode ? searchErr : menuErr;

  const handleSubmit = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Keyboard.dismiss();
    setDebouncedQuery(query.trim());
  };

  const handleCategoryChip = (categoryId: string | undefined) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setActiveCategory(categoryId);
    if (categoryId) {
      setQuery('');
      setDebouncedQuery('');
    }
  };

  const openItem = (item: MenuItem) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.navigate('ItemDetail', { itemId: item.id });
  };

  const listTitle = isSearchMode
    ? `Results for “${debouncedQuery}”`
    : activeCategory
      ? formatCategoryLabel(activeCategory)
      : 'Popular dishes';

  const renderItem = ({ item }: { item: MenuItem }) => {
    const priceLabel = formatMenuPrice(
      item.discountedPrice ?? item.basePrice,
      currency,
      locale
    );
    return (
      <TouchableOpacity
        style={[
          styles.dishCard,
          { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border },
        ]}
        onPress={() => openItem(item)}
        activeOpacity={0.9}
        accessibilityRole="button"
        accessibilityLabel={`${item.name}, ${priceLabel}`}
      >
        <MenuDishImage
          name={item.name}
          imageUrl={item.imageUrl}
          style={styles.dishImage}
          placeholderColor={theme.colors.surface2}
          iconColor={theme.colors.text3}
        />
        <View style={styles.dishBody}>
          <View style={styles.dishTop}>
            <Text style={[styles.dishTitle, { color: theme.colors.text1 }]} numberOfLines={2}>
              {item.name}
            </Text>
            {item.isRecommended ? (
              <View style={styles.bestPill}>
                <Text style={styles.bestPillText}>Bestseller</Text>
              </View>
            ) : null}
          </View>
          <Text style={[styles.dishMeta, { color: theme.colors.text2 }]} numberOfLines={1}>
            {formatCategoryLabel(item.category || '')}
            {item.cuisine ? ` · ${formatCuisineLabel(item.cuisine)}` : ''}
          </Text>
          {item.description ? (
            <Text style={[styles.dishDesc, { color: theme.colors.text3 }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <View style={styles.dishFooter}>
            <Text style={[styles.price, { color: theme.colors.text1 }]}>{priceLabel}</Text>
            <View style={styles.addChip}>
              <Text style={styles.addChipText}>ADD</Text>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const listHeader = (
    <View>
      <View style={styles.storePickerWrap}>
        <StoreSelector />
      </View>

      {/* Horizontal category chips — always above dishes */}
      {selectedStoreId && categoryChips.length > 0 ? (
        <View style={styles.chipsSection}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            <Chip
              label="All"
              selected={!activeCategory}
              onPress={() => handleCategoryChip(undefined)}
            />
            {categoryChips.map((cat) => (
              <Chip
                key={cat.id}
                label={cat.name}
                selected={activeCategory === cat.id}
                onPress={() =>
                  handleCategoryChip(activeCategory === cat.id ? undefined : cat.id)
                }
              />
            ))}
          </ScrollView>
        </View>
      ) : null}

      <View style={styles.listHeaderRow}>
        <Text style={[styles.listTitle, { color: theme.colors.text1 }]}>{listTitle}</Text>
        <Text style={[styles.listCount, { color: theme.colors.text3 }]}>
          {dishes.length} dishes
        </Text>
      </View>
    </View>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity
          onPress={() => navigation.navigate('Main' as any, { screen: 'Home' })}
          style={styles.backButton}
          accessibilityLabel="Back to home"
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <View style={[styles.searchInputContainer, { backgroundColor: theme.colors.surface2 }]}>
          <Ionicons name="search-outline" size={20} color={theme.colors.text2} />
          <TextInput
            ref={inputRef}
            value={query}
            onChangeText={(t) => {
              setQuery(t);
              if (t.trim().length > 0) setActiveCategory(undefined);
            }}
            placeholder="Search dosa, biryani, pizza…"
            placeholderTextColor={theme.colors.text3}
            style={[styles.searchInput, { color: theme.colors.text1 }]}
            returnKeyType="search"
            onSubmitEditing={handleSubmit}
          />
          {query.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setQuery('');
                setDebouncedQuery('');
              }}
            >
              <Ionicons name="close-circle" size={20} color={theme.colors.text2} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {!selectedStoreId ? (
        <View style={styles.centered}>
          <Ionicons name="storefront-outline" size={40} color={theme.colors.text3} />
          <Text style={[styles.hint, { color: theme.colors.semantic.warning }]}>
            Select a branch to browse dishes.
          </Text>
          <View style={{ width: '100%', paddingHorizontal: spacing[4] }}>
            <StoreSelector />
          </View>
        </View>
      ) : isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator color="#FFD000" />
          <Text style={[styles.hint, { color: theme.colors.text2 }]}>Loading dishes…</Text>
        </View>
      ) : isError ? (
        <View style={styles.centered}>
          <Ionicons name="cloud-offline-outline" size={40} color={theme.colors.text3} />
          <Text style={[styles.hint, { color: theme.colors.text2 }]}>
            {(error as Error)?.message || 'Could not load menu. Check network and store.'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={dishes}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.centered}>
              <Ionicons name="fast-food-outline" size={40} color={theme.colors.text3} />
              <Text style={[styles.hint, { color: theme.colors.text2 }]}>
                No dishes found. Try another search or category.
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
    gap: spacing[2],
  },
  backButton: { padding: spacing[1] },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing[3],
    height: 44,
    gap: spacing[2],
  },
  searchInput: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontFamily: 'PlusJakartaSans-Regular',
    paddingVertical: 0,
  },
  storePickerWrap: {
    paddingHorizontal: spacing[4],
    paddingBottom: spacing[2],
  },
  chipsSection: {
    marginBottom: spacing[2],
  },
  chipsScroll: {
    paddingHorizontal: spacing[4],
    gap: spacing[2],
    paddingBottom: spacing[1],
  },
  listHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing[4],
    marginBottom: spacing[2],
    marginTop: spacing[1],
  },
  listTitle: {
    fontSize: typography.fontSize.titleSm,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  listCount: {
    fontSize: typography.fontSize.caption,
  },
  listContent: { paddingBottom: spacing[10] },
  dishCard: {
    flexDirection: 'row',
    marginHorizontal: spacing[4],
    marginBottom: spacing[3],
    borderRadius: borderRadius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    overflow: 'hidden',
    minHeight: 112,
  },
  dishImage: {
    width: 108,
    height: '100%',
    minHeight: 112,
  },
  dishBody: {
    flex: 1,
    padding: spacing[3],
    justifyContent: 'space-between',
  },
  dishTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing[2],
  },
  dishTitle: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  bestPill: {
    backgroundColor: 'rgba(255,208,0,0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  bestPillText: {
    fontSize: 9,
    fontFamily: 'PlusJakartaSans-Bold',
    color: '#8B6914',
  },
  dishMeta: {
    fontSize: typography.fontSize.caption,
    marginTop: 2,
  },
  dishDesc: {
    fontSize: 11,
    marginTop: 4,
    lineHeight: 15,
  },
  dishFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing[2],
  },
  price: {
    fontSize: typography.fontSize.body,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  addChip: {
    backgroundColor: '#FFD000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  addChipText: {
    fontFamily: 'PlusJakartaSans-Bold',
    fontSize: 12,
    color: '#0F0F0F',
  },
  hint: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[3],
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: spacing[4],
  },
  centered: {
    padding: spacing[8],
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default SearchScreen;
