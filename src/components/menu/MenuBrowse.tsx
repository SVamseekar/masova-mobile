import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useMenuItems } from '../../hooks/useMenuQueries';
import { useSelectedStore } from '../../hooks/useSelectedStore';
import { useTheme } from '../../hooks/useTheme';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { RootStackParamList } from '../../types';
import { categoriesFromMenu, formatCategoryLabel } from '../../utils/menuDisplay';
import { getListPerfProps } from '../../utils/listPerf';
import { StoreSelector } from '../StoreSelector';
import { Button, Chip, SearchBar } from '../ui';
import { BottomSheet } from '../ui/BottomSheet';
import { CachedMenuNotice, CartStrip, DishRow, MenuNotice } from './DiscoveryUI';
import { emptyFilters, filterMenu, MenuFilters } from './menuDiscovery';

/** Menu and Search share store-scoped data and combined local filters. No fake search history. */
export const MenuBrowse: React.FC<{
  search?: boolean;
  initialCategory?: string;
  initialQuery?: string;
}> = ({ search = false, initialCategory, initialQuery }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedStoreId } = useSelectedStore();
  const { isOffline } = useNetworkStatus();
  const menu = useMenuItems();
  const [query, setQuery] = useState(initialQuery ?? '');
  const [filters, setFilters] = useState<MenuFilters>({
    ...emptyFilters,
    category: initialCategory,
  });
  const [draft, setDraft] = useState<MenuFilters>(emptyFilters);
  const [sheet, setSheet] = useState(false);
  const previousStore = useRef(selectedStoreId);
  useEffect(() => {
    setQuery(initialQuery ?? '');
    setFilters({ ...emptyFilters, category: initialCategory });
  }, [initialCategory, initialQuery]);
  useEffect(() => {
    if (previousStore.current !== selectedStoreId) {
      setFilters(emptyFilters);
      setDraft(emptyFilters);
      setSheet(false);
      previousStore.current = selectedStoreId;
    }
  }, [selectedStoreId]);
  const items = useMemo(() => menu.data ?? [], [menu.data]);
  const categories = useMemo(() => categoriesFromMenu(items), [items]);
  const cuisines = useMemo(
    () => [...new Set(items.map((item) => item.cuisine).filter(Boolean))],
    [items],
  );
  const diets = useMemo(
    () => [...new Set(items.flatMap((item) => item.dietaryInfo ?? []))],
    [items],
  );
  const results = useMemo(() => filterMenu(items, query, filters), [items, query, filters]);
  const draftCount = useMemo(() => filterMenu(items, query, draft).length, [items, query, draft]);
  const active = Object.entries(filters).filter(
    ([key, value]) => value && (key !== 'sort' || value !== 'recommended'),
  );
  const reset = () => {
    setFilters(emptyFilters);
    setQuery('');
  };
  const renderFilter = (key: 'category' | 'cuisine' | 'dietary', values: string[]) => (
    <View style={styles.wrap}>
      <Chip
        label="All"
        selected={!draft[key]}
        onPress={() => setDraft({ ...draft, [key]: undefined })}
      />
      {values.map((value) => (
        <Chip
          key={value}
          label={formatCategoryLabel(value)}
          selected={draft[key] === value}
          onPress={() => setDraft({ ...draft, [key]: draft[key] === value ? undefined : value })}
        />
      ))}
    </View>
  );
  const header = (
    <View style={styles.headerBody}>
      <StoreSelector />
      <CachedMenuNotice
        offline={isOffline}
        failed={menu.isError && !!items.length}
        updatedAt={menu.dataUpdatedAt}
        pending={menu.isFetching}
        onRetry={() => {
          void menu.refetch();
        }}
      />
      <SearchBar
        value={query}
        onChangeText={setQuery}
        placeholder="Search dishes, ingredients, cuisines"
      />
      {!!categories.length && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chips}
          keyboardShouldPersistTaps="handled"
        >
          <Chip
            label={`All (${items.length})`}
            selected={!filters.category}
            onPress={() => setFilters({ ...filters, category: undefined })}
          />
          {categories.map((category) => (
            <Chip
              key={category.id}
              label={`${category.name} (${category.count})`}
              selected={filters.category === category.id}
              onPress={() =>
                setFilters({
                  ...filters,
                  category: filters.category === category.id ? undefined : category.id,
                })
              }
            />
          ))}
        </ScrollView>
      )}
      <View style={styles.row}>
        <Text style={{ color: theme.colors.text1, fontSize: 16 }}>Veg only</Text>
        <Switch
          accessibilityLabel="Vegetarian only"
          value={filters.dietary === 'VEGETARIAN'}
          onValueChange={(value) =>
            setFilters({ ...filters, dietary: value ? 'VEGETARIAN' : undefined })
          }
          trackColor={{ true: theme.colors.focus, false: theme.colors.border }}
        />
        <Pressable
          style={styles.filterButton}
          onPress={() => {
            Keyboard.dismiss();
            setDraft(filters);
            setSheet(true);
          }}
          accessibilityRole="button"
          accessibilityLabel="Filter and sort menu"
        >
          <Text style={{ color: theme.colors.text1 }}>Sort & filters</Text>
          <Ionicons name="options-outline" size={20} color={theme.colors.text1} />
        </Pressable>
      </View>
      {!!active.length && (
        <View style={styles.wrap}>
          {active.map(([key, value]) => (
            <Chip
              key={key}
              label={`${formatCategoryLabel(value)} ×`}
              selected
              onPress={() =>
                setFilters({ ...filters, [key]: key === 'sort' ? 'recommended' : undefined })
              }
            />
          ))}
          <Button title="Clear all" variant="ghost" size="sm" onPress={reset} />
        </View>
      )}
      <View style={styles.row}>
        <Text
          accessibilityRole="header"
          style={[styles.sectionTitle, { color: theme.colors.text1 }]}
        >
          {query.trim() ? `Results for “${query.trim()}”` : search ? 'Explore dishes' : 'Menu'}
        </Text>
        <Text style={{ color: theme.colors.text2 }}>{results.length} dishes</Text>
      </View>
      <Text style={[styles.meta, { color: theme.colors.text2 }]}>
        Filters search this store’s loaded menu.
      </Text>
    </View>
  );
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}
    >
      <View style={styles.top}>
        <Pressable
          onPress={() => navigation.navigate('Main', { screen: 'Home' })}
          accessibilityRole="button"
          accessibilityLabel="Back to home"
          style={styles.icon}
        >
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </Pressable>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>
          {search ? 'Search' : 'Menu'}
        </Text>
      </View>
      <FlatList
        {...getListPerfProps()}
        data={selectedStoreId ? results : []}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <DishRow
            item={item}
            onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
          />
        )}
        ListHeaderComponent={header}
        contentContainerStyle={styles.list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        onRefresh={
          selectedStoreId && !isOffline
            ? () => {
                void menu.refetch();
              }
            : undefined
        }
        refreshing={!!menu.isFetching && !menu.isLoading}
        ListEmptyComponent={
          !selectedStoreId ? (
            <MenuNotice
              title="Choose a store"
              detail="Select a store to see its menu and currency."
            />
          ) : menu.isLoading ? (
            <MenuNotice title="Loading menu…" loading />
          ) : menu.isError ? (
            <MenuNotice
              title="Failed to load menu"
              detail={menu.error?.message || 'Could not load menu. Check your connection.'}
              onRetry={() => {
                void menu.refetch();
              }}
              pending={menu.isFetching}
            />
          ) : (
            <MenuNotice
              title="No items found"
              detail={
                items.length
                  ? 'Try adjusting your filters or search query'
                  : 'This store has no dishes published yet.'
              }
              onRetry={
                items.length
                  ? reset
                  : () => {
                      void menu.refetch();
                    }
              }
              action={items.length ? 'Clear search and filters' : 'Retry'}
              pending={menu.isFetching}
            />
          )
        }
      />
      <CartStrip />
      <BottomSheet
        visible={sheet}
        title="Filter menu"
        onClose={() => setSheet(false)}
        footer={
          <>
            <Text style={{ color: theme.colors.text2 }}>{draftCount} results</Text>
            <View style={styles.row}>
              <Button title="Clear all" variant="ghost" onPress={() => setDraft(emptyFilters)} />
              <Button
                title={`Apply (${draftCount})`}
                onPress={() => {
                  setFilters(draft);
                  setSheet(false);
                }}
              />
            </View>
          </>
        }
      >
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Category</Text>
        {renderFilter(
          'category',
          categories.map((category) => category.id),
        )}
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Cuisine</Text>
        {renderFilter('cuisine', cuisines)}
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
          Dietary preferences
        </Text>
        {renderFilter('dietary', diets)}
        <Text style={[styles.meta, { color: theme.colors.text2 }]}>
          Based on menu declarations. Contact the store about allergies or cross-contact.
        </Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Sort</Text>
        <View style={styles.wrap}>
          {(['recommended', 'price_low', 'price_high'] as const).map((sort) => (
            <Chip
              key={sort}
              label={
                sort === 'recommended'
                  ? 'Recommended'
                  : sort === 'price_low'
                    ? 'Price: low to high'
                    : 'Price: high to low'
              }
              selected={draft.sort === sort}
              onPress={() => setDraft({ ...draft, sort })}
            />
          ))}
        </View>
      </BottomSheet>
    </KeyboardAvoidingView>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  top: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8 },
  icon: { width: 48, height: 48, justifyContent: 'center', alignItems: 'center' },
  title: { fontSize: 26, fontWeight: '700' },
  headerBody: { gap: 12, paddingBottom: 12 },
  list: { paddingHorizontal: 16, paddingBottom: 16 },
  chips: { gap: 8 },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  filterButton: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
  },
  sectionTitle: { fontSize: 18, fontWeight: '600', flexShrink: 1 },
  meta: { fontSize: 12, lineHeight: 18 },
});
