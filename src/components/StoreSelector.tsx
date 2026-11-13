import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storeApi } from '../services/api';
import { Store } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useStoreContext } from '../contexts/StoreContext';
import { useCart } from '../contexts/CartContext';
import { useNetworkStatus } from '../hooks/useNetworkStatus';
import { formatPrice } from '../utils/money';
import { BottomSheet } from './ui/BottomSheet';
import { Button } from './ui';

export const StoreSelector: React.FC<{ onStoreChange?: (store: Store | null) => void }> = ({
  onStoreChange,
}) => {
  const { theme } = useTheme();
  const { selectedStore, setSelectedStore } = useStoreContext();
  const { itemCount, clearCart } = useCart();
  const { isOffline } = useNetworkStatus();
  const [stores, setStores] = useState<Store[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const savingRef = useRef(false);
  const [error, setError] = useState<string>();
  const [draft, setDraft] = useState<Store | null>(null);
  const [query, setQuery] = useState('');
  const alive = useRef(true);
  useEffect(
    () => () => {
      alive.current = false;
    },
    [],
  );
  const key = (store: Store | null) => store?.storeCode || store?.id;
  const address = (store: Store) =>
    typeof store.address === 'string'
      ? store.address
      : [store.address?.street, store.address?.city, store.address?.state, store.address?.pincode]
          .filter(Boolean)
          .join(', ');
  const load = async () => {
    setLoading(true);
    setError(undefined);
    try {
      const data = await storeApi.getAll();
      if (alive.current) setStores(Array.isArray(data) ? data : []);
    } catch {
      if (alive.current) setError('Could not load stores. Check your connection and retry.');
    } finally {
      if (alive.current) setLoading(false);
    }
  };
  const choose = async () => {
    if (!draft || savingRef.current || isOffline) return;
    savingRef.current = true;
    setSaving(true);
    setError(undefined);
    const changesStore = key(selectedStore) !== key(draft);
    try {
      await setSelectedStore(draft);
      if (changesStore && itemCount) clearCart();
      onStoreChange?.(draft);
      if (alive.current) setOpen(false);
    } catch {
      if (alive.current)
        setError('Could not save your store. Your store and cart have not changed. Retry.');
    } finally {
      savingRef.current = false;
      if (alive.current) setSaving(false);
    }
  };
  const filtered = stores.filter((store) =>
    `${store.name} ${address(store)}`.toLowerCase().includes(query.trim().toLowerCase()),
  );
  return (
    <View>
      <Pressable
        style={styles.selector}
        accessibilityRole="button"
        accessibilityLabel={`Select store. ${selectedStore?.name ?? 'No store selected'}`}
        onPress={() => {
          setDraft(selectedStore);
          setQuery('');
          setOpen(true);
          void load();
        }}
      >
        <Ionicons name="storefront-outline" size={22} color={theme.colors.text1} />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: theme.colors.text1 }]}>
            {selectedStore?.name ?? 'Select store'}
          </Text>
          {selectedStore && (
            <Text style={[styles.meta, { color: theme.colors.text2 }]}>
              {selectedStore.address?.city} · {selectedStore.currency}
            </Text>
          )}
        </View>
        <Ionicons name="chevron-down" size={20} color={theme.colors.text2} />
      </Pressable>
      <BottomSheet
        visible={open}
        title="Select store"
        onClose={() => {
          if (!saving) setOpen(false);
        }}
        footer={
          <>
            {key(draft) !== key(selectedStore) && itemCount > 0 && (
              <Text
                style={[
                  styles.warning,
                  { color: theme.colors.text1, backgroundColor: theme.colors.selection },
                ]}
              >
                Switching store will clear your cart. {itemCount}{' '}
                {itemCount === 1 ? 'item' : 'items'} will be removed.
              </Text>
            )}
            {error && (
              <Text
                accessibilityLiveRegion="polite"
                style={[styles.meta, { color: theme.colors.error }]}
              >
                {error}
              </Text>
            )}
            {isOffline && (
              <Text style={[styles.meta, { color: theme.colors.error }]}>
                Connect before switching stores.
              </Text>
            )}
            <Button
              title={draft ? `Choose ${draft.name}` : 'Choose a store'}
              disabled={
                !draft ||
                loading ||
                saving ||
                isOffline ||
                draft.status === 'INACTIVE' ||
                draft.status === 'MAINTENANCE'
              }
              loading={saving}
              fullWidth
              onPress={() => {
                void choose();
              }}
            />
          </>
        }
      >
        <Text style={[styles.body, { color: theme.colors.text2 }]}>
          Choose a store to see its menu and prices.
        </Text>
        <TextInput
          accessibilityLabel="Search stores by area or address"
          value={query}
          onChangeText={setQuery}
          placeholder="Search by area or address"
          placeholderTextColor={theme.colors.text2}
          style={[styles.search, { color: theme.colors.text1, borderColor: theme.colors.border }]}
        />
        {loading ? (
          <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.accent} />
            <Text style={{ color: theme.colors.text2 }}>Loading stores…</Text>
          </View>
        ) : error && !stores.length ? (
          <Button
            title="Retry"
            onPress={() => {
              void load();
            }}
          />
        ) : !filtered.length ? (
          <View style={styles.loading}>
            <Text style={{ color: theme.colors.text2 }}>
              {stores.length ? 'No stores match your search.' : 'No stores available.'}
            </Text>
            <Button
              title={stores.length ? 'Clear search' : 'Retry'}
              onPress={() => {
                if (stores.length) setQuery('');
                else void load();
              }}
            />
          </View>
        ) : (
          filtered.map((store) => {
            const selected = key(draft) === key(store);
            const inactive = store.status === 'INACTIVE' || store.status === 'MAINTENANCE';
            const openingStatus = inactive ? 'Unavailable' : store.isOpen === true ? 'Open' : store.isOpen === false ? 'Closed' : 'Opening status unavailable';
            return (
              <Pressable
                key={key(store)}
                onPress={() => setDraft(store)}
                disabled={saving || inactive}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected, disabled: saving || inactive }}
                accessibilityLabel={`${store.name}, ${openingStatus}, ${store.currency ?? 'currency not configured'}`}
                style={[
                  styles.store,
                  {
                    backgroundColor: selected ? theme.colors.selection : theme.colors.surface1,
                    borderColor: theme.colors.border,
                    opacity: inactive ? 0.5 : 1,
                  },
                ]}
              >
                <View style={{ flex: 1, gap: 6 }}>
                  <Text style={[styles.name, { color: theme.colors.text1 }]}>{store.name}</Text>
                  <Text
                    style={[
                      styles.meta,
                      { color: store.isOpen ? theme.colors.success : theme.colors.text2 },
                    ]}
                  >
                    {openingStatus} ·{' '}
                    {store.currency ?? 'Currency unavailable'}
                  </Text>
                  <Text style={[styles.meta, { color: theme.colors.text2 }]}>{address(store)}</Text>
                  <Text style={[styles.meta, { color: theme.colors.text2 }]}>
                    {store.openingTime && store.closingTime
                      ? `${store.openingTime}–${store.closingTime} · `
                      : ''}
                    {store.currency && store.deliveryFee != null
                      ? `${formatPrice(store.deliveryFee, store.currency, store.locale)} delivery`
                      : 'Delivery fee confirmed at checkout'}
                  </Text>
                </View>
                <Ionicons
                  name={selected ? 'radio-button-on' : 'radio-button-off'}
                  size={24}
                  color={theme.colors.text1}
                />
              </Pressable>
            );
          })
        )}
      </BottomSheet>
    </View>
  );
};
const styles = StyleSheet.create({
  selector: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: 12 },
  name: { fontSize: 16, fontWeight: '600' },
  body: { fontSize: 16, lineHeight: 24 },
  meta: { fontSize: 13, lineHeight: 19 },
  search: { borderWidth: 1, borderRadius: 8, minHeight: 48, paddingHorizontal: 12, fontSize: 16 },
  loading: { paddingVertical: 24, alignItems: 'center', gap: 12 },
  store: {
    borderWidth: 1,
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
  },
  warning: { padding: 12, fontSize: 14, lineHeight: 20, borderRadius: 8 },
});
