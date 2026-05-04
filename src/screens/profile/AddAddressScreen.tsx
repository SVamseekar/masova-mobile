/**
 * Add/Edit Address Screen
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography } from '../../styles';
import { Button, Input } from '../../components/ui';
import { RootStackParamList } from '../../types';
import { customerApi } from '../../services/api';

type AddAddressRouteProp = RouteProp<RootStackParamList, 'AddAddress'>;

interface CustomerData {
  id: string;
  addresses?: Array<{
    id: string;
    label: string;
    addressLine1: string;
    addressLine2?: string;
    city: string;
    state: string;
    postalCode: string;
    latitude?: number;
    longitude?: number;
    landmark?: string;
    isDefault?: boolean;
  }>;
}

const AddAddressScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const route = useRoute<AddAddressRouteProp>();

  const existingAddress = route.params?.address;
  const isEditing = !!existingAddress;

  const [customer, setCustomer] = useState<CustomerData | null>(null);
  const [loadingCustomer, setLoadingCustomer] = useState(true);

  const [label, setLabel] = useState(existingAddress?.label || 'Home');
  const [street, setStreet] = useState(existingAddress?.addressLine1 || existingAddress?.street || '');
  const [addressLine2, setAddressLine2] = useState(existingAddress?.addressLine2 || '');
  const [city, setCity] = useState(existingAddress?.city || '');
  const [state, setState] = useState(existingAddress?.state || '');
  const [zipCode, setZipCode] = useState(existingAddress?.postalCode || existingAddress?.zipCode || '');
  const [landmark, setLandmark] = useState(existingAddress?.landmark || existingAddress?.instructions || '');
  const [latitude, setLatitude] = useState<number | undefined>(existingAddress?.latitude);
  const [longitude, setLongitude] = useState<number | undefined>(existingAddress?.longitude);

  const [saving, setSaving] = useState(false);
  const [loadingLocation, setLoadingLocation] = useState(false);

  // Fetch customer data on mount
  useEffect(() => {
    const fetchCustomer = async () => {
      if (!user?.id) {
        setLoadingCustomer(false);
        return;
      }
      try {
        const data = await customerApi.getByUserId(user.id);
        setCustomer(data);
      } catch (error) {
        console.error('Failed to fetch customer:', error);
      } finally {
        setLoadingCustomer(false);
      }
    };
    fetchCustomer();
  }, [user?.id]);

  const handleUseCurrentLocation = async () => {
    try {
      setLoadingLocation(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

      // Request permission
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Denied',
          'Please enable location permissions in your device settings to use this feature.'
        );
        return;
      }

      // Get current location
      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      setLatitude(location.coords.latitude);
      setLongitude(location.coords.longitude);

      // Reverse geocode to get address
      const [geocoded] = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (geocoded) {
        // Build street address including building/place name
        const streetParts = [
          geocoded.name, // Building name, place name, or POI
          geocoded.streetNumber,
          geocoded.street,
        ].filter(Boolean);

        // Remove duplicates (sometimes name equals street)
        const uniqueParts = [...new Set(streetParts)];

        if (uniqueParts.length > 0) {
          setStreet(uniqueParts.join(', '));
        }

        // Use subregion/district for address line 2
        if (geocoded.subregion || geocoded.district) {
          setAddressLine2(geocoded.subregion || geocoded.district || '');
        }

        if (geocoded.city) setCity(geocoded.city);
        if (geocoded.region) setState(geocoded.region);
        if (geocoded.postalCode) setZipCode(geocoded.postalCode);

        // Log full geocoded response for debugging
        console.log('Geocoded address:', JSON.stringify(geocoded, null, 2));

        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error('Failed to get location:', error);
      Alert.alert('Error', 'Failed to get your current location. Please try again.');
    } finally {
      setLoadingLocation(false);
    }
  };

  const validateForm = (): boolean => {
    if (!street.trim()) {
      Alert.alert('Validation Error', 'Please enter street address');
      return false;
    }
    if (!city.trim()) {
      Alert.alert('Validation Error', 'Please enter city');
      return false;
    }
    if (!state.trim()) {
      Alert.alert('Validation Error', 'Please enter state');
      return false;
    }
    if (!zipCode.trim()) {
      Alert.alert('Validation Error', 'Please enter PIN code');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!customer?.id) {
      Alert.alert('Error', 'Customer profile not found. Please log in again.');
      return;
    }

    try {
      setSaving(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const addressData = {
        label: label.toUpperCase(),
        addressLine1: street.trim(),
        addressLine2: addressLine2.trim() || undefined,
        city: city.trim(),
        state: state.trim(),
        postalCode: zipCode.trim(),
        country: 'India',
        latitude,
        longitude,
        landmark: landmark.trim() || undefined,
        isDefault: !customer.addresses || customer.addresses.length === 0, // First address is default
      };

      if (isEditing && existingAddress?.id) {
        // Update existing address
        await customerApi.updateAddress(customer.id, existingAddress.id, addressData);
      } else {
        // Add new address
        await customerApi.addAddress(customer.id, addressData);
      }

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (error: any) {
      console.error('Failed to save address:', error);
      Alert.alert(
        'Error',
        error.response?.data?.message || 'Failed to save address. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  };

  const labelOptions = ['Home', 'Work', 'Other'];

  if (loadingCustomer) {
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
          <Ionicons name="close" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>
          {isEditing ? 'Edit Address' : 'Add Address'}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Use Current Location */}
        <TouchableOpacity
          style={[styles.locationButton, { borderColor: theme.colors.border }]}
          onPress={handleUseCurrentLocation}
          disabled={loadingLocation}
        >
          {loadingLocation ? (
            <ActivityIndicator size="small" color={'#FFD000'} />
          ) : (
            <Ionicons name="navigate" size={20} color={'#FFD000'} />
          )}
          <Text style={[styles.locationText, { color: '#FFD000' }]}>
            {loadingLocation ? 'Getting location...' : 'Use Current Location'}
          </Text>
        </TouchableOpacity>

        {/* Label Selection */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Save As
          </Text>
          <View style={styles.labelOptions}>
            {labelOptions.map((option) => (
              <TouchableOpacity
                key={option}
                style={[
                  styles.labelOption,
                  {
                    backgroundColor: label === option
                      ? `${'#FFD000'}15`
                      : theme.colors.surface2,
                    borderColor: label === option
                      ? '#FFD000'
                      : 'transparent',
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setLabel(option);
                }}
              >
                <Ionicons
                  name={option === 'Home' ? 'home' : option === 'Work' ? 'briefcase' : 'location'}
                  size={18}
                  color={label === option ? '#FFD000' : theme.colors.text2}
                />
                <Text
                  style={[
                    styles.labelOptionText,
                    { color: label === option ? '#FFD000' : theme.colors.text1 },
                  ]}
                >
                  {option}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Address Form */}
        <View style={styles.section}>
          <Input
            label="Street Address *"
            value={street}
            onChangeText={setStreet}
            placeholder="House/Flat no., Building name, Street"
            leftIcon="location-outline"
          />
          <Input
            label="Address Line 2"
            value={addressLine2}
            onChangeText={setAddressLine2}
            placeholder="Area, Colony, Locality"
          />
          <Input
            label="City *"
            value={city}
            onChangeText={setCity}
            placeholder="Enter city"
          />
          <View style={styles.row}>
            <View style={styles.halfInput}>
              <Input
                label="State *"
                value={state}
                onChangeText={setState}
                placeholder="State"
              />
            </View>
            <View style={styles.halfInput}>
              <Input
                label="PIN Code *"
                value={zipCode}
                onChangeText={setZipCode}
                placeholder="000000"
                keyboardType="number-pad"
                maxLength={6}
              />
            </View>
          </View>
          <Input
            label="Landmark (Optional)"
            value={landmark}
            onChangeText={setLandmark}
            placeholder="E.g., Near pizza shop, opposite park"
            multiline
            numberOfLines={2}
          />
        </View>

        {/* Location info */}
        {latitude && longitude && (
          <View style={[styles.locationInfo, { backgroundColor: theme.colors.surface2 }]}>
            <Ionicons name="checkmark-circle" size={16} color={theme.colors.semantic.success} />
            <Text style={[styles.locationInfoText, { color: theme.colors.text2 }]}>
              Location coordinates captured
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Save Button */}
      <View
        style={[
          styles.bottomBar,
          {
            backgroundColor: theme.colors.surface1,
            paddingBottom: insets.bottom + spacing[3],
          },
        ]}
      >
        <Button
          title={saving ? 'Saving...' : isEditing ? 'Save Changes' : 'Save Address'}
          onPress={handleSave}
          fullWidth
          size="lg"
          disabled={saving}
        />
      </View>
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
  scrollContent: {
    padding: spacing.screenPadding,
    paddingBottom: 120,
  },
  section: {
    marginBottom: spacing[6],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: spacing[3],
  },
  labelOptions: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  labelOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing[3],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    gap: spacing[2],
  },
  labelOptionText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  row: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  halfInput: {
    flex: 1,
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing[4],
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    gap: spacing[2],
    marginBottom: spacing[6],
  },
  locationText: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing[3],
    borderRadius: borderRadius.sm,
    gap: spacing[2],
  },
  locationInfoText: {
    fontSize: typography.fontSize.caption,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: spacing[4],
  },
});

export default AddAddressScreen;
