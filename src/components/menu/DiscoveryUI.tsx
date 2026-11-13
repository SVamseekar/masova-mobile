import { AnimatedPressable as Pressable } from "../ui/AnimatedPressable";
import React from 'react';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../../hooks/useTheme';
import { useCart } from '../../contexts/CartContext';
import { useSelectedStore } from '../../hooks/useSelectedStore';
import { MenuItem, RootStackParamList } from '../../types';
import { formatMenuPrice } from '../../utils/menuDisplay';
import { ALLERGEN_LABELS, AllergenType } from '../../constants/allergens';
import { Button } from '../ui';
import { MenuDishImage } from './MenuDishImage';

export const AllergenLabels: React.FC<{ item: MenuItem }> = ({ item }) => {
  const { theme } = useTheme();
  const labels = (item.allergens ?? []).map(
    (value) => ALLERGEN_LABELS[value as AllergenType] || value.replace(/_/g, ' ').toLowerCase(),
  );
  return (
    <Text style={[styles.meta, { color: theme.colors.text2 }]}>
      {item.allergensDeclared === true
        ? labels.length
          ? `Contains: ${labels.join(', ')}`
          : 'No declared allergens'
        : 'Allergen information not declared'}
    </Text>
  );
};

export const DishRow: React.FC<{ item: MenuItem; onPress: () => void }> = ({ item, onPress }) => {
  const { theme } = useTheme();
  const { selectedStore } = useSelectedStore();
  const price = formatMenuPrice(
    item.discountedPrice ?? item.basePrice,
    selectedStore?.currency,
    selectedStore?.locale,
  );
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`${item.name}, ${price}${!item.isAvailable ? ', unavailable' : ''}. View options`}
      style={[styles.dish, { backgroundColor: theme.colors.surface1 }]}
    >
      <MenuDishImage name={item.name} imageUrl={item.imageUrl} style={styles.image} />
      <View style={styles.dishBody}>
        <View style={styles.row}>
          <Text style={[styles.name, { color: theme.colors.text1 }]}>{item.name}</Text>
          <Text style={[styles.price, { color: theme.colors.text1 }]}>{price}</Text>
        </View>
        {!!item.description && (
          <Text numberOfLines={2} style={[styles.description, { color: theme.colors.text2 }]}>
            {item.description}
          </Text>
        )}
        <AllergenLabels item={item} />
        <Text
          style={[
            styles.meta,
            { color: !item.isAvailable ? theme.colors.error : theme.colors.success },
          ]}
        >
          {!item.isAvailable
            ? 'Unavailable'
            : (item.dietaryInfo ?? [])
                .map((value) => value.replace(/_/g, ' ').toLowerCase())
                .join(' · ')}
        </Text>
      </View>
    </Pressable>
  );
};

export const CartStrip: React.FC = () => {
  const { theme } = useTheme();
  const { itemCount } = useCart();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  if (!itemCount) return null;
  return (
    <View style={[styles.cartWrap, { backgroundColor: theme.colors.bg }]}>
      <Button
        title={`View cart · ${itemCount} ${itemCount === 1 ? 'item' : 'items'}`}
        fullWidth
        onPress={() => navigation.navigate('Cart')}
        leftIcon={<Ionicons name="cart-outline" size={22} color={theme.colors.onAccent} />}
        rightIcon={<Ionicons name="arrow-forward" size={20} color={theme.colors.onAccent} />}
      />
    </View>
  );
};

export const MenuNotice: React.FC<{
  title: string;
  detail?: string;
  loading?: boolean;
  onRetry?: () => void;
  pending?: boolean;
  action?: string;
}> = ({ title, detail, loading, onRetry, pending, action = 'Retry' }) => {
  const { theme } = useTheme();
  return (
    <View style={styles.notice} accessibilityLiveRegion="polite">
      {loading && <ActivityIndicator color={theme.colors.accent} />}
      <Text style={[styles.noticeTitle, { color: theme.colors.text1 }]}>{title}</Text>
      {!!detail && (
        <Text style={[styles.noticeDetail, { color: theme.colors.text2 }]}>{detail}</Text>
      )}
      {!!onRetry && <Button title={action} onPress={onRetry} loading={pending} />}
    </View>
  );
};

export const CachedMenuNotice: React.FC<{
  offline: boolean;
  failed: boolean;
  updatedAt?: number;
  onRetry: () => void;
  pending?: boolean;
}> = ({ offline, failed, updatedAt, onRetry, pending }) => {
  const { theme } = useTheme();
  const { selectedStore } = useSelectedStore();
  if (!offline && !failed) return null;
  return (
    <View
      style={[styles.cached, { backgroundColor: theme.colors.surface2 }]}
      accessibilityLiveRegion="polite"
    >
      <View style={{ flex: 1 }}>
        <Text style={[styles.name, { color: theme.colors.text1 }]}>
          {offline ? 'You’re offline' : 'Menu update failed'}
        </Text>
        <Text style={[styles.meta, { color: theme.colors.text2 }]}>
          Showing last loaded menu
          {updatedAt ? ` · ${new Date(updatedAt).toLocaleString(selectedStore?.locale)}` : ''}.
          Availability must be checked online.
        </Text>
      </View>
      <Button title="Retry" size="sm" variant="secondary" onPress={onRetry} loading={pending} />
    </View>
  );
};

const styles = StyleSheet.create({
  dish: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 8,
    gap: 12,
    marginBottom: 8,
    minHeight: 112,
  },
  image: { width: 96, height: 96, borderRadius: 8 },
  dishBody: { flex: 1, gap: 4 },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  name: { fontSize: 15, fontWeight: '600', flex: 1 },
  price: { fontSize: 15, fontWeight: '700', fontVariant: ['tabular-nums'] },
  description: { fontSize: 14, lineHeight: 19 },
  meta: { fontSize: 12, lineHeight: 18 },
  cartWrap: { padding: 12 },
  notice: { padding: 24, alignItems: 'center', gap: 12 },
  noticeTitle: { fontSize: 20, fontWeight: '700', textAlign: 'center' },
  noticeDetail: { fontSize: 16, lineHeight: 24, textAlign: 'center' },
  cached: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
    borderRadius: 8,
    marginVertical: 8,
  },
});
