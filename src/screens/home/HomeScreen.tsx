import { AnimatedPressable as Pressable } from "../../components/ui/AnimatedPressable";
/**
 * Customer Home — platform-aligned discovery.
 * Store from GET /stores, categories and dishes from GET /menu?storeId=.
 */
import React, { useMemo } from 'react';
import {
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../hooks/useTheme';
import { useMenuItems } from '../../hooks/useMenuQueries';
import { useSelectedStore } from '../../hooks/useSelectedStore';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { MaSoVaLogo } from '../../components/ui';
import { StoreSelector } from '../../components/StoreSelector';
import { MenuDishImage } from '../../components/menu/MenuDishImage';
import {
  CachedMenuNotice,
  CartStrip,
  DishRow,
  MenuNotice,
} from '../../components/menu/DiscoveryUI';
import { categoriesFromMenu, formatMenuPrice, recommendedFromMenu } from '../../utils/menuDisplay';
import { MenuItem, RootStackParamList } from '../../types';

const HomeScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { selectedStore, selectedStoreId } = useSelectedStore();
  const { isOffline } = useNetworkStatus();
  const menu = useMenuItems();
  const items = useMemo(() => menu.data ?? [], [menu.data]);
  const categories = useMemo(() => categoriesFromMenu(items), [items]);
  const recommendations = useMemo(() => recommendedFromMenu(items, 8), [items]);
  // Actual discounted prices only. Recommended/category groupings do not establish an offer.
  const deals = useMemo(
    () =>
      items.filter(
        (item) =>
          item.isAvailable && item.discountedPrice != null && item.discountedPrice < item.basePrice,
      ),
    [items],
  );
  const openMenu = (category?: string) =>
    navigation.navigate('Main', { screen: 'Search', params: { category } });
  const openItem = (item: MenuItem) => navigation.navigate('ItemDetail', { itemId: item.id });
  const money = (amount: number) =>
    formatMenuPrice(amount, selectedStore?.currency, selectedStore?.locale);
  const section = (title: string, onPress: () => void) => (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>{title}</Text>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`See all ${title.toLowerCase()}`}
        onPress={onPress}
        style={styles.link}
      >
        <Text style={{ color: theme.colors.focus }}>See all</Text>
      </Pressable>
    </View>
  );
  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <MaSoVaLogo textColor={theme.colors.text1} />
        <View style={styles.headerActions}>
          <Pressable
            style={styles.icon}
            accessibilityRole="button"
            accessibilityLabel="Search menu"
            onPress={() => navigation.navigate('Search')}
          >
            <Ionicons name="search-outline" size={24} color={theme.colors.text1} />
          </Pressable>
          <Pressable
            style={styles.icon}
            accessibilityRole="button"
            accessibilityLabel="Notifications"
            onPress={() => navigation.navigate('Notifications')}
          >
            <Ionicons name="notifications-outline" size={24} color={theme.colors.text1} />
          </Pressable>
        </View>
      </View>
      <ScrollView
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl
            refreshing={!!menu.isFetching && !menu.isLoading}
            onRefresh={() => {
              if (selectedStoreId) void menu.refetch();
            }}
            enabled={!isOffline}
            tintColor={theme.colors.accent}
          />
        }
        contentContainerStyle={styles.scroll}
      >
        <View style={[styles.delivery, { backgroundColor: theme.colors.surface1 }]}>
          <Text style={[styles.meta, { color: theme.colors.text2 }]}>Deliver from</Text>
          <StoreSelector />
          <Text style={[styles.meta, { color: theme.colors.text2 }]}>
            Delivery address confirmed at checkout.
          </Text>
        </View>
        <CachedMenuNotice
          offline={isOffline}
          failed={menu.isError && !!items.length}
          updatedAt={menu.dataUpdatedAt}
          pending={menu.isFetching}
          onRetry={() => {
            void menu.refetch();
          }}
        />
        {!!recommendations.length && (
          <Pressable
            style={[styles.hero, { backgroundColor: theme.colors.surface1 }]}
            accessibilityRole="button"
            accessibilityLabel="Browse the menu"
            onPress={() => openMenu()}
          >
            <MenuDishImage
              name={recommendations[0].name}
              imageUrl={recommendations[0].imageUrl}
              style={styles.heroPhoto}
            />
            <View style={[styles.heroCopy, { backgroundColor: '#203D32' }]}>
              <Text style={styles.heroTitle}>Authentic flavours.\nNear you.</Text>
              <Text style={styles.heroSubtitle}>
                {selectedStore?.name} · Freshly prepared dishes
              </Text>
              <View style={[styles.heroAction, { backgroundColor: theme.colors.accent }]}>
                <Text style={{ color: theme.colors.onAccent, fontWeight: '600' }}>Order now</Text>
                <Ionicons name="arrow-forward" size={20} color={theme.colors.onAccent} />
              </View>
            </View>
          </Pressable>
        )}
        {!selectedStoreId ? (
          <MenuNotice title="Choose your store" detail="Pick a store above to discover its menu." />
        ) : menu.isLoading ? (
          <MenuNotice title="Loading menu…" loading />
        ) : menu.isError && !items.length ? (
          <MenuNotice
            title="Failed to load menu"
            detail={menu.error?.message}
            onRetry={() => {
              void menu.refetch();
            }}
            pending={menu.isFetching}
          />
        ) : !items.length ? (
          <MenuNotice
            title="Menu coming soon"
            detail="This store has no dishes published yet."
            onRetry={() => {
              void menu.refetch();
            }}
            pending={menu.isFetching}
          />
        ) : (
          <>
            {section('Categories', () => openMenu())}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.horizontal}
            >
              {categories.map((category) => (
                <Pressable
                  key={category.id}
                  accessibilityRole="button"
                  accessibilityLabel={`${category.name}, ${category.count} dishes`}
                  onPress={() => openMenu(category.id)}
                  style={[styles.category, { backgroundColor: theme.colors.surface1 }]}
                >
                  <MenuDishImage
                    name={category.sampleName}
                    imageUrl={category.sampleImageUrl}
                    style={styles.categoryPhoto}
                  />
                  <View style={styles.categoryText}>
                    <Text style={[styles.categoryLabel, { color: theme.colors.text1 }]}>
                      {category.name}
                    </Text>
                    <Text style={[styles.meta, { color: theme.colors.text2 }]}>
                      {category.count} dishes
                    </Text>
                  </View>
                </Pressable>
              ))}
            </ScrollView>
            {!!deals.length && (
              <>
                {section('Today’s deals', () => openMenu())}
                <FlatList
                  data={deals}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.horizontal}
                  renderItem={({ item }) => (
                    <Pressable
                      style={[styles.deal, { backgroundColor: theme.colors.surface1 }]}
                      onPress={() => openItem(item)}
                      accessibilityRole="button"
                      accessibilityLabel={`${item.name}, ${money(item.discountedPrice!)}. View options`}
                    >
                      <MenuDishImage
                        name={item.name}
                        imageUrl={item.imageUrl}
                        style={styles.dealPhoto}
                      />
                      <View style={styles.categoryText}>
                        <Text style={[styles.categoryLabel, { color: theme.colors.text1 }]}>
                          {item.name}
                        </Text>
                        <Text style={[styles.dealPrice, { color: theme.colors.success }]}>
                          {money(item.discountedPrice!)}{' '}
                          <Text style={[styles.oldPrice, { color: theme.colors.text2 }]}>
                            {money(item.basePrice)}
                          </Text>
                        </Text>
                      </View>
                    </Pressable>
                  )}
                />
              </>
            )}
            {section('Recommended for you', () => openMenu())}
            <View style={styles.dishes}>
              {recommendations.map((item) => (
                <DishRow key={item.id} item={item} onPress={() => openItem(item)} />
              ))}
            </View>
          </>
        )}
        <Pressable
          style={[styles.support, { borderColor: theme.colors.border }]}
          onPress={() => navigation.navigate('Chat')}
          accessibilityRole="button"
          accessibilityLabel="Get menu and order help"
        >
          <Ionicons name="chatbubble-outline" size={20} color={theme.colors.text1} />
          <Text style={{ color: theme.colors.text1, fontSize: 16 }}>Need help? Talk to MaSoVa</Text>
          <Ionicons name="chevron-forward" size={20} color={theme.colors.text2} />
        </Pressable>
      </ScrollView>
      <CartStrip />
    </View>
  );
};
const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerActions: { flexDirection: 'row' },
  icon: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  scroll: { paddingBottom: 16 },
  delivery: { margin: 16, padding: 12, borderRadius: 12, gap: 4 },
  meta: { fontSize: 12, lineHeight: 18 },
  hero: { marginHorizontal: 16, borderRadius: 12, overflow: 'hidden', height: 236 },
  heroPhoto: { position: 'absolute', width: '100%', height: '100%' },
  heroCopy: { width: '48%', height: '100%', padding: 16, justifyContent: 'center', gap: 12 },
  heroTitle: { color: '#FFFFFF', fontSize: 24, lineHeight: 28, fontWeight: '700' },
  heroSubtitle: { color: '#FFFFFF', fontSize: 13, lineHeight: 18 },
  heroAction: {
    flexDirection: 'row',
    minHeight: 48,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    gap: 4,
    borderRadius: 8,
  },
  sectionHeader: {
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  sectionTitle: { fontSize: 18, fontWeight: '700' },
  link: { minHeight: 48, minWidth: 48, alignItems: 'center', justifyContent: 'center' },
  horizontal: { paddingHorizontal: 16, gap: 12 },
  category: { width: 98, borderRadius: 12, overflow: 'hidden' },
  categoryPhoto: { width: 98, height: 72 },
  categoryText: { padding: 8, gap: 4 },
  categoryLabel: { fontSize: 14, fontWeight: '600' },
  deal: { width: 174, borderRadius: 12, overflow: 'hidden' },
  dealPhoto: { width: 174, height: 108 },
  dealPrice: { fontSize: 15, fontWeight: '600' },
  oldPrice: { textDecorationLine: 'line-through', fontSize: 12, fontWeight: '400' },
  dishes: { paddingHorizontal: 16 },
  support: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    margin: 16,
    paddingVertical: 12,
    minHeight: 48,
    borderTopWidth: 1,
  },
});
export default HomeScreen;
