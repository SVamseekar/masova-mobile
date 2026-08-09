import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { storeApi } from '../services/api';
import { Store } from '../types';
import { useTheme } from '../hooks/useTheme';
import { useStoreContext } from '../contexts/StoreContext';
import { useCart } from '../contexts/CartContext';
import { isFeatureEnabled } from '../config/featureFlags';

interface StoreSelectorProps {
  onStoreChange?: (store: Store | null) => void;
}

export const StoreSelector: React.FC<StoreSelectorProps> = ({ onStoreChange }) => {
  const { theme } = useTheme();
  const { selectedStore, setSelectedStore: setContextStore } = useStoreContext();
  const { itemCount, clearCart } = useCart();
  const [stores, setStores] = useState<Store[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Safety check - if theme is not loaded yet, return null
  if (!theme || !theme.colors || !theme.colors.brand) {
    return null;
  }

  // Fetch stores when modal opens
  useEffect(() => {
    if (isOpen && stores.length === 0) {
      fetchStores();
    }
  }, [isOpen]);

  const fetchStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await storeApi.getAll();
      setStores(data);
    } catch (err) {
      console.error('Failed to fetch stores:', err);
      setError('Failed to load stores');
    } finally {
      setLoading(false);
    }
  };

  const performStoreSelect = async (store: Store) => {
    try {
      await setContextStore(store);
      onStoreChange?.(store);
      setIsOpen(false);
    } catch (err) {
      console.error('Failed to save selected store:', err);
    }
  };

  const handleStoreSelect = async (store: Store) => {
    const strictGuard = isFeatureEnabled('ENABLE_STRICT_STORE_GUARD');
    if (
      strictGuard &&
      selectedStore &&
      selectedStore.id !== store.id &&
      itemCount > 0
    ) {
      Alert.alert(
        'Switch Store?',
        'Your cart contains items from your current store. Switching stores will clear your cart. Do you want to proceed?',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Clear Cart & Switch',
            style: 'destructive',
            onPress: async () => {
              clearCart();
              await performStoreSelect(store);
            },
          },
        ]
      );
      return;
    }
    // When guard is off, still clear cart on store change so prices/items stay store-scoped
    if (selectedStore && selectedStore.id !== store.id && itemCount > 0) {
      clearCart();
    }
    await performStoreSelect(store);
  };

  const getStoreLocation = (store: Store) => {
    // Extract city from address object
    if (typeof store.address === 'object' && store.address !== null) {
      return store.address.city || store.address.state || 'Unknown';
    }
    // Fallback for string address (legacy)
    const addressStr = String(store.address);
    const parts = addressStr.split(',');
    return parts.length > 1 ? parts[parts.length - 2].trim() : addressStr;
  };

  const formatStoreAddress = (address: Store['address']) => {
    if (typeof address === 'object' && address !== null) {
      const parts = [address.street, address.city, address.state, address.pincode].filter(Boolean);
      return parts.join(', ');
    }
    return String(address);
  };

  return (
    <View>
      {/* Store Selector Button */}
      <TouchableOpacity
        style={[styles.selectorButton, { backgroundColor: theme.colors.surface }]}
        onPress={() => setIsOpen(true)}
        activeOpacity={0.7}
      >
        <View style={styles.buttonContent}>
          <Ionicons name="location" size={20} color={'#FFD000'} />
          <View style={styles.storeInfo}>
            <Text style={[styles.storeName, { color: theme.colors.text1 }]} numberOfLines={1}>
              {selectedStore ? selectedStore.name : 'Select Store'}
            </Text>
            {selectedStore && (
              <Text style={[styles.storeLocation, { color: theme.colors.text2 }]} numberOfLines={1}>
                {getStoreLocation(selectedStore)}
              </Text>
            )}
          </View>
          <Ionicons
            name={isOpen ? 'chevron-up' : 'chevron-down'}
            size={18}
            color={theme.colors.text2}
          />
        </View>
      </TouchableOpacity>

      {/* Store Selection Modal */}
      <Modal
        visible={isOpen}
        transparent
        animationType="slide"
        onRequestClose={() => setIsOpen(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.bg }]}>
            {/* Header */}
            <View style={[styles.modalHeader, { borderBottomColor: theme.colors.border }]}>
              <Text style={[styles.modalTitle, { color: theme.colors.text1 }]}>
                Select Store
              </Text>
              <TouchableOpacity onPress={() => setIsOpen(false)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="close" size={28} color={theme.colors.text1} />
              </TouchableOpacity>
            </View>

            {/* Store List */}
            <ScrollView style={styles.storeList} showsVerticalScrollIndicator={false}>
              {loading ? (
                <View style={styles.centerContent}>
                  <ActivityIndicator size="large" color={'#FFD000'} />
                  <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
                    Loading stores...
                  </Text>
                </View>
              ) : error ? (
                <View style={styles.centerContent}>
                  <Ionicons name="alert-circle" size={48} color={theme.colors.semantic.error} />
                  <Text style={[styles.errorText, { color: theme.colors.semantic.error }]}>
                    {error}
                  </Text>
                  <TouchableOpacity
                    style={[styles.retryButton, { backgroundColor: '#FFD000' }]}
                    onPress={fetchStores}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              ) : stores.length === 0 ? (
                <View style={styles.centerContent}>
                  <Ionicons name="storefront-outline" size={48} color={theme.colors.text3} />
                  <Text style={[styles.emptyText, { color: theme.colors.text2 }]}>
                    No stores available
                  </Text>
                </View>
              ) : (
                stores.map((store) => {
                  const isSelected = selectedStore?.id === store.id;
                  return (
                    <TouchableOpacity
                      key={store.id}
                      style={[
                        styles.storeItem,
                        {
                          backgroundColor: isSelected
                            ? `${'#FFD000'}15`
                            : theme.colors.surface1,
                          borderColor: isSelected
                            ? '#FFD000'
                            : theme.colors.border,
                        },
                      ]}
                      onPress={() => handleStoreSelect(store)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.storeItemLeft}>
                        <View style={styles.storeItemHeader}>
                          <Text
                            style={[
                              styles.storeItemName,
                              {
                                color: isSelected
                                  ? '#FFD000'
                                  : theme.colors.text1,
                              },
                            ]}
                          >
                            {store.name}
                          </Text>
                          {store.isOpen ? (
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: `${theme.colors.semantic.success}20` },
                              ]}
                            >
                              <View
                                style={[
                                  styles.statusDot,
                                  { backgroundColor: theme.colors.semantic.success },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: theme.colors.semantic.success },
                                ]}
                              >
                                Open
                              </Text>
                            </View>
                          ) : (
                            <View
                              style={[
                                styles.statusBadge,
                                { backgroundColor: `${theme.colors.semantic.error}20` },
                              ]}
                            >
                              <View
                                style={[
                                  styles.statusDot,
                                  { backgroundColor: theme.colors.semantic.error },
                                ]}
                              />
                              <Text
                                style={[
                                  styles.statusText,
                                  { color: theme.colors.semantic.error },
                                ]}
                              >
                                Closed
                              </Text>
                            </View>
                          )}
                        </View>
                        <Text
                          style={[styles.storeItemAddress, { color: theme.colors.text2 }]}
                          numberOfLines={2}
                        >
                          {formatStoreAddress(store.address)}
                        </Text>
                        <View style={styles.storeItemFooter}>
                          <View style={styles.infoItem}>
                            <Ionicons
                              name="time-outline"
                              size={14}
                              color={theme.colors.text3}
                            />
                            <Text
                              style={[styles.infoText, { color: theme.colors.text3 }]}
                            >
                              {store.openingTime} - {store.closingTime}
                            </Text>
                          </View>
                          <View style={styles.infoItem}>
                            <Ionicons
                              name="bicycle-outline"
                              size={14}
                              color={theme.colors.text3}
                            />
                            <Text
                              style={[styles.infoText, { color: theme.colors.text3 }]}
                            >
                              ₹{store.deliveryFee} delivery
                            </Text>
                          </View>
                        </View>
                      </View>
                      {isSelected && (
                        <Ionicons
                          name="checkmark-circle"
                          size={28}
                          color={'#FFD000'}
                        />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  selectorButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minHeight: 44,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  storeInfo: {
    flex: 1,
  },
  storeName: {
    fontSize: 15,
    fontWeight: '600',
  },
  storeLocation: {
    fontSize: 12,
    marginTop: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  storeList: {
    padding: 16,
  },
  centerContent: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  retryButton: {
    marginTop: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 8,
  },
  storeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 2,
    gap: 12,
  },
  storeItemLeft: {
    flex: 1,
  },
  storeItemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  storeItemName: {
    fontSize: 16,
    fontWeight: '700',
    flex: 1,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 12,
    gap: 4,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  storeItemAddress: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 8,
  },
  storeItemFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  infoText: {
    fontSize: 12,
  },
});
