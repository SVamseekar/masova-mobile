/**
 * Saved Screen — favorites from device storage (+ optional backend preference sync)
 */

import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { useStoreCurrency } from '../../hooks/useStoreCurrency';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, Button } from '../../components/ui';
import { MenuDishImage } from '../../components/menu/MenuDishImage';
import { RootStackParamList } from '../../types';
import GuestPromptView from '../../components/GuestPromptView';
import { favoritesService, FavoriteSnapshot } from '../../services/favoritesService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const SavedScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const { formatMoney } = useStoreCurrency();
  const formatPrice = formatMoney;
  const [items, setItems] = useState<FavoriteSnapshot[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await favoritesService.getAll();
      setItems(list);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated) {
        load();
      }
    }, [isAuthenticated, load])
  );

  if (!isAuthenticated) {
    return (
      <GuestPromptView
        screenName="Saved Items"
        icon="heart-outline"
        description="Sign in to save your favorite items and quickly reorder them anytime."
      />
    );
  }

  const handleRemove = async (itemId: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await favoritesService.remove(itemId);
    setItems((prev) => prev.filter((i) => i.id !== itemId));
    if (user?.id) {
      void favoritesService.syncToCustomer(user.id);
    }
  };

  const renderItem = ({ item }: { item: FavoriteSnapshot }) => (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => navigation.navigate('ItemDetail', { itemId: item.id })}
    >
      <Card elevation="sm" style={styles.itemCard}>
        <MenuDishImage
          name={item.name}
          imageUrl={item.imageUrl}
          style={styles.itemImage}
          placeholderColor={theme.colors.surface2}
          iconColor={theme.colors.text3}
        />
        <View style={styles.itemContent}>
          <View style={styles.itemHeader}>
            <Text style={[styles.itemName, { color: theme.colors.text1 }]} numberOfLines={1}>
              {item.name}
            </Text>
            <TouchableOpacity onPress={() => handleRemove(item.id)} style={styles.removeButton}>
              <Ionicons name="heart" size={20} color={theme.colors.semantic.error} />
            </TouchableOpacity>
          </View>
          {item.description ? (
            <Text style={[styles.itemDesc, { color: theme.colors.text2 }]} numberOfLines={2}>
              {item.description}
            </Text>
          ) : null}
          <Text style={[styles.itemPrice, { color: theme.colors.text1 }]}>
            {formatPrice(item.discountedPrice ?? item.basePrice)}
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Saved</Text>
        <Text style={[styles.subtitle, { color: theme.colors.text2 }]}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: spacing[8] }} color="#FFD000" />
      ) : items.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="heart-outline" size={56} color={theme.colors.text3} />
          <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>No saved dishes yet</Text>
          <Text style={[styles.emptySub, { color: theme.colors.text2 }]}>
            Tap the heart on any menu item to save it here.
          </Text>
          <Button
            title="Browse menu"
            onPress={() => navigation.navigate('Main', { screen: 'Search', params: {} })}
            style={{ marginTop: spacing[4] }}
          />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
  },
  title: {
    fontSize: typography.fontSize.title,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  subtitle: {
    fontSize: typography.fontSize.caption,
    marginTop: 4,
  },
  list: {
    padding: spacing[4],
    paddingBottom: spacing[10],
    gap: spacing[3],
  },
  itemCard: {
    flexDirection: 'row',
    overflow: 'hidden',
    marginBottom: spacing[3],
    borderRadius: borderRadius.lg,
  },
  itemImage: {
    width: 96,
    height: 96,
  },
  imagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemContent: {
    flex: 1,
    padding: spacing[3],
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  itemName: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginRight: spacing[2],
  },
  removeButton: { padding: 4 },
  itemDesc: {
    fontSize: typography.fontSize.caption,
    marginTop: 4,
  },
  itemPrice: {
    marginTop: spacing[2],
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[6],
  },
  emptyTitle: {
    fontSize: typography.fontSize.title,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: spacing[3],
  },
  emptySub: {
    textAlign: 'center',
    marginTop: spacing[2],
    lineHeight: 20,
  },
});

export default SavedScreen;
