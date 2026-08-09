/**
 * Address Management Screen
 * Manage saved addresses
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography } from '../../styles';
import { Card, Badge, Button } from '../../components/ui';
import { RootStackParamList, DeliveryAddress } from '../../types';
import { customerApi } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

// Helper to convert backend address format to DeliveryAddress
const convertToDeliveryAddress = (addr: any): DeliveryAddress => ({
  id: addr.id || addr._id,
  label: addr.label || 'Home',
  street: addr.addressLine1 || addr.address_line1 || addr.street,
  addressLine1: addr.addressLine1 || addr.address_line1,
  addressLine2: addr.addressLine2 || addr.address_line2,
  city: addr.city,
  state: addr.state,
  postalCode: addr.postalCode || addr.postal_code,
  zipCode: addr.postalCode || addr.postal_code || addr.zipCode,
  latitude: addr.latitude,
  longitude: addr.longitude,
  landmark: addr.landmark,
  instructions: addr.landmark || addr.instructions,
  isDefault: addr.isDefault ?? addr.is_default ?? addr.default ?? false,
});

const AddressManagementScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [addresses, setAddresses] = useState<DeliveryAddress[]>([]);
  const [loading, setLoading] = useState(true);
  const [customerId, setCustomerId] = useState<string | null>(null);

  // Fetch addresses when screen gains focus
  const fetchAddresses = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    try {
      const customer = await customerApi.getByUserId(user.id);
      setCustomerId(customer?.id || null);
      if (customer?.addresses && customer.addresses.length > 0) {
        const convertedAddresses = customer.addresses.map(convertToDeliveryAddress);
        setAddresses(convertedAddresses);
      } else {
        setAddresses([]);
      }
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  const handleSetDefault = async (addressId: string) => {
    if (!customerId) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      await customerApi.setDefaultAddress(customerId, addressId);
      // Refresh addresses
      fetchAddresses();
    } catch (error: any) {
      console.error('Failed to set default address:', error);
      Alert.alert('Error', 'Failed to set default address. Please try again.');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!customerId) return;

    Alert.alert(
      'Delete Address',
      'Are you sure you want to delete this address?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              await customerApi.removeAddress(customerId, addressId);
              // Refresh addresses
              fetchAddresses();
            } catch (error: any) {
              console.error('Failed to delete address:', error);
              Alert.alert('Error', 'Failed to delete address. Please try again.');
            }
          },
        },
      ]
    );
  };

  const renderAddress = ({ item }: { item: DeliveryAddress }) => {
    const displayStreet = item.street || item.addressLine1 || '';
    const displayZip = item.zipCode || item.postalCode || '';

    return (
      <View
        style={[
          styles.addressCard,
          { backgroundColor: theme.colors.surface1, borderColor: theme.colors.border },
        ]}
      >
        <View style={styles.addressHeader}>
          <View style={styles.addressLabel}>
            <Ionicons
              name={
                item.label?.toUpperCase() === 'HOME' ? 'home' :
                item.label?.toUpperCase() === 'WORK' ? 'briefcase' : 'location'
              }
              size={18}
              color={'#FFD000'}
            />
            <Text style={[styles.addressLabelText, { color: theme.colors.text1 }]}>
              {item.label}
            </Text>
            {item.isDefault && <Badge label="Default" variant="primary" size="sm" />}
          </View>
          <View style={styles.addressActions}>
            <TouchableOpacity
              onPress={() => navigation.navigate('AddAddress', { address: item })}
              style={styles.actionButton}
            >
              <Ionicons name="create-outline" size={20} color={theme.colors.text2} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => handleDeleteAddress(item.id)}
              style={styles.actionButton}
            >
              <Ionicons name="trash-outline" size={20} color={theme.colors.semantic.error} />
            </TouchableOpacity>
          </View>
        </View>

        <Text style={[styles.addressStreet, { color: theme.colors.text1 }]} numberOfLines={2}>
          {displayStreet}
        </Text>
        {item.addressLine2 && (
          <Text style={[styles.addressLine2, { color: theme.colors.text2 }]}>
            {item.addressLine2}
          </Text>
        )}
        <Text style={[styles.addressCity, { color: theme.colors.text2 }]}>
          {item.city}{item.state ? `, ${item.state}` : ''}{displayZip ? ` - ${displayZip}` : ''}
        </Text>
        {item.landmark && (
          <Text style={[styles.landmark, { color: theme.colors.text3 }]}>
            Landmark: {item.landmark}
          </Text>
        )}

        {!item.isDefault && (
          <TouchableOpacity
            style={[styles.setDefaultButton, { borderTopColor: theme.colors.border }]}
            onPress={() => handleSetDefault(item.id)}
          >
            <Text style={[styles.setDefaultText, { color: '#FFD000' }]}>
              Set as Default
            </Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color={'#FFD000'} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>My Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      <FlatList
        data={addresses}
        renderItem={renderAddress}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={64} color={theme.colors.text3} />
            <Text style={[styles.emptyTitle, { color: theme.colors.text1 }]}>
              No saved addresses
            </Text>
            <Text style={[styles.emptySubtitle, { color: theme.colors.text2 }]}>
              Add your delivery addresses for faster checkout
            </Text>
          </View>
        }
        ListFooterComponent={
          <Button
            title="Add New Address"
            variant="secondary"
            leftIcon={<Ionicons name="add" size={20} color={'#FFD000'} />}
            onPress={() => navigation.navigate('AddAddress', {})}
            fullWidth
          />
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[3],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  title: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  listContent: {
    padding: spacing.screenPadding,
    gap: spacing[3],
  },
  addressCard: {
    padding: spacing[4],
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing[2],
  },
  addressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  addressLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
  },
  addressLabelText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    textTransform: 'capitalize',
  },
  addressActions: {
    flexDirection: 'row',
    gap: spacing[2],
  },
  actionButton: {
    padding: spacing[1],
  },
  addressStreet: {
    fontSize: typography.fontSize.body,
    lineHeight: 22,
  },
  addressLine2: {
    fontSize: typography.fontSize.bodySm,
    marginTop: 2,
  },
  addressCity: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
  },
  landmark: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing[1],
    fontStyle: 'italic',
  },
  setDefaultButton: {
    marginTop: spacing[3],
    paddingTop: spacing[3],
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  setDefaultText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing[8],
  },
  emptyTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginTop: spacing[4],
  },
  emptySubtitle: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    marginTop: spacing[2],
    marginBottom: spacing[6],
  },
});

export default AddressManagementScreen;
