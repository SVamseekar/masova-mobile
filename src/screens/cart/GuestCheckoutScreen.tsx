/**
 * Guest Checkout Screen
 * Handles both guest checkout form and logged-in user address selection
 * Mirrors web app's GuestCheckoutPage.tsx
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography } from '../../styles';
import { Card } from '../../components/ui';
import { RootStackParamList, GuestInfo, DeliveryAddress } from '../../types';
import { customerApi } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;
type RouteProps = RouteProp<RootStackParamList, 'GuestCheckout'>;

interface Address {
  id: string;
  street: string;
  city: string;
  state: string;
  pincode: string;
  isDefault?: boolean;
}

const GuestCheckoutScreen: React.FC = () => {
  const { theme } = useTheme();
  const { isAuthenticated, user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<RouteProps>();

  // Form state for guest users
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [pincode, setPincode] = useState('');
  const [deliveryInstructions, setDeliveryInstructions] = useState('');

  // State for authenticated users
  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [showNewAddressForm, setShowNewAddressForm] = useState(false);
  const [saveAddress, setSaveAddress] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load saved addresses for authenticated users
  useEffect(() => {
    if (isAuthenticated && user) {
      loadSavedAddresses();
      // Pre-fill phone from user profile
      setPhone(user.phone || '');
    }
  }, [isAuthenticated, user]);

  const loadSavedAddresses = async () => {
    if (!user?.id) {
      setSavedAddresses([]);
      return;
    }
    try {
      setIsLoading(true);
      const customer = await customerApi.getByUserId(user.id);
      const mapped: Address[] = (customer.addresses || []).map((a: DeliveryAddress) => ({
        id: a.id,
        street: a.addressLine1 || a.street || '',
        city: a.city,
        state: a.state || '',
        pincode: a.postalCode || a.zipCode || '',
        isDefault: a.isDefault,
      }));
      setSavedAddresses(mapped);
      const defaultAddress = mapped.find((addr) => addr.isDefault) || mapped[0];
      if (defaultAddress) {
        setSelectedAddressId(defaultAddress.id);
      }
    } catch (error) {
      console.error('Failed to load addresses:', error);
      setSavedAddresses([]);
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!isAuthenticated && !emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return false;
    }

    // Phone validation (Indian mobile: 10 digits starting with 6-9)
    const phoneRegex = /^[6-9]\d{9}$/;
    if (!phoneRegex.test(phone)) {
      Alert.alert('Invalid Phone', 'Please enter a valid 10-digit Indian mobile number.');
      return false;
    }

    // PIN code validation (6 digits)
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(pincode)) {
      Alert.alert('Invalid PIN Code', 'Please enter a valid 6-digit PIN code.');
      return false;
    }

    // For authenticated users with saved addresses
    if (isAuthenticated && !showNewAddressForm && !selectedAddressId) {
      Alert.alert('No Address Selected', 'Please select a delivery address.');
      return false;
    }

    // Check required fields
    if (isAuthenticated && showNewAddressForm) {
      if (!street || !city || !state || !pincode) {
        Alert.alert('Incomplete Information', 'Please fill in all required address fields.');
        return false;
      }
    } else if (!isAuthenticated) {
      if (!firstName || !lastName || !email || !phone || !street || !city || !state || !pincode) {
        Alert.alert('Incomplete Information', 'Please fill in all required fields.');
        return false;
      }
    }

    return true;
  };

  const handleContinue = () => {
    if (!validateForm()) return;

    let guestInfo: GuestInfo;

    if (isAuthenticated) {
      if (showNewAddressForm) {
        // New address for authenticated user
        guestInfo = {
          name: user?.name || '',
          email: user?.email || '',
          phone,
          street,
          city,
          state,
          pincode,
          deliveryInstructions,
          saveAddress,
        };
      } else {
        // Use selected saved address
        const selectedAddress = savedAddresses.find(addr => addr.id === selectedAddressId);
        if (!selectedAddress) {
          Alert.alert('Error', 'Please select an address.');
          return;
        }
        guestInfo = {
          name: user?.name || '',
          email: user?.email || '',
          phone,
          street: selectedAddress.street,
          city: selectedAddress.city,
          state: selectedAddress.state,
          pincode: selectedAddress.pincode,
          deliveryInstructions,
        };
      }
    } else {
      // Guest user
      guestInfo = {
        name: `${firstName} ${lastName}`.trim(),
        email,
        phone,
        street,
        city,
        state,
        pincode,
        deliveryInstructions,
      };
    }

    // Navigate to CheckoutScreen with guest info
    navigation.navigate('Checkout', { guestInfo });
  };

  const renderSavedAddressCard = (address: Address) => (
    <TouchableOpacity
      key={address.id}
      style={[
        styles.addressCard,
        {
          backgroundColor: theme.colors.surface1,
          borderColor:
            selectedAddressId === address.id
              ? '#FFD000'
              : theme.colors.border,
          borderWidth: selectedAddressId === address.id ? 2 : 1,
        },
      ]}
      onPress={() => {
        setSelectedAddressId(address.id);
        setShowNewAddressForm(false);
      }}
    >
      <View style={styles.addressCardHeader}>
        <View
          style={[
            styles.radioButton,
            {
              borderColor:
                selectedAddressId === address.id
                  ? '#FFD000'
                  : theme.colors.border,
            },
          ]}
        >
          {selectedAddressId === address.id && (
            <View
              style={[
                styles.radioButtonInner,
                { backgroundColor: '#FFD000' },
              ]}
            />
          )}
        </View>
        {address.isDefault && (
          <View
            style={[
              styles.defaultBadge,
              { backgroundColor: `${'#FFD000'}20` },
            ]}
          >
            <Text style={[styles.defaultBadgeText, { color: '#FFD000' }]}>
              Default
            </Text>
          </View>
        )}
      </View>
      <Text style={[styles.addressText, { color: theme.colors.text1 }]}>
        {address.street}
      </Text>
      <Text style={[styles.addressText, { color: theme.colors.text2 }]}>
        {address.city}, {address.state} - {address.pincode}
      </Text>
    </TouchableOpacity>
  );

  const renderGuestForm = () => (
    <>
      <Card elevation="sm" style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
          Contact Information
        </Text>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
              First Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface2,
                  color: theme.colors.text1,
                  borderColor: theme.colors.border,
                },
              ]}
              value={firstName}
              onChangeText={setFirstName}
              placeholder="John"
              placeholderTextColor={theme.colors.text3}
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
              Last Name *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface2,
                  color: theme.colors.text1,
                  borderColor: theme.colors.border,
                },
              ]}
              value={lastName}
              onChangeText={setLastName}
              placeholder="Doe"
              placeholderTextColor={theme.colors.text3}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
            Email *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text1,
                borderColor: theme.colors.border,
              },
            ]}
            value={email}
            onChangeText={setEmail}
            placeholder="john.doe@example.com"
            placeholderTextColor={theme.colors.text3}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
            Phone Number *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text1,
                borderColor: theme.colors.border,
              },
            ]}
            value={phone}
            onChangeText={setPhone}
            placeholder="9876543210"
            placeholderTextColor={theme.colors.text3}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
      </Card>

      <Card elevation="sm" style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
          Delivery Address
        </Text>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
            Street Address *
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
              {
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text1,
                borderColor: theme.colors.border,
              },
            ]}
            value={street}
            onChangeText={setStreet}
            placeholder="Building, Street, Area"
            placeholderTextColor={theme.colors.text3}
            multiline
            numberOfLines={2}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={styles.inputHalf}>
            <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
              City *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface2,
                  color: theme.colors.text1,
                  borderColor: theme.colors.border,
                },
              ]}
              value={city}
              onChangeText={setCity}
              placeholder="Mumbai"
              placeholderTextColor={theme.colors.text3}
            />
          </View>

          <View style={styles.inputHalf}>
            <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
              State *
            </Text>
            <TextInput
              style={[
                styles.input,
                {
                  backgroundColor: theme.colors.surface2,
                  color: theme.colors.text1,
                  borderColor: theme.colors.border,
                },
              ]}
              value={state}
              onChangeText={setState}
              placeholder="Maharashtra"
              placeholderTextColor={theme.colors.text3}
            />
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
            PIN Code *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text1,
                borderColor: theme.colors.border,
              },
            ]}
            value={pincode}
            onChangeText={setPincode}
            placeholder="400001"
            placeholderTextColor={theme.colors.text3}
            keyboardType="numeric"
            maxLength={6}
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
            Delivery Instructions (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
              {
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text1,
                borderColor: theme.colors.border,
              },
            ]}
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="e.g., Ring doorbell twice"
            placeholderTextColor={theme.colors.text3}
            multiline
            numberOfLines={2}
          />
        </View>
      </Card>
    </>
  );

  const renderAuthenticatedView = () => (
    <>
      {/* Phone Number (Always Editable) */}
      <Card elevation="sm" style={styles.formSection}>
        <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
          Contact Number
        </Text>
        <View style={styles.inputContainer}>
          <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
            Phone Number *
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text1,
                borderColor: theme.colors.border,
              },
            ]}
            value={phone}
            onChangeText={setPhone}
            placeholder="9876543210"
            placeholderTextColor={theme.colors.text3}
            keyboardType="phone-pad"
            maxLength={10}
          />
        </View>
      </Card>

      {/* Saved Addresses or New Address Form */}
      <Card elevation="sm" style={styles.formSection}>
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>
            Delivery Address
          </Text>
          {!showNewAddressForm && savedAddresses.length > 0 && (
            <TouchableOpacity onPress={() => setShowNewAddressForm(true)}>
              <Text style={[styles.addNewText, { color: '#FFD000' }]}>
                Add New
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {isLoading ? (
          <ActivityIndicator size="small" color={'#FFD000'} />
        ) : showNewAddressForm || savedAddresses.length === 0 ? (
          <>
            {savedAddresses.length > 0 && (
              <TouchableOpacity
                style={styles.backToSavedButton}
                onPress={() => setShowNewAddressForm(false)}
              >
                <Ionicons name="arrow-back" size={20} color={'#FFD000'} />
                <Text style={[styles.backToSavedText, { color: '#FFD000' }]}>
                  Back to Saved Addresses
                </Text>
              </TouchableOpacity>
            )}

            {/* New Address Form (reuse guest form fields) */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
                Street Address *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  styles.multilineInput,
                  {
                    backgroundColor: theme.colors.surface2,
                    color: theme.colors.text1,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={street}
                onChangeText={setStreet}
                placeholder="Building, Street, Area"
                placeholderTextColor={theme.colors.text3}
                multiline
                numberOfLines={2}
              />
            </View>

            <View style={styles.inputRow}>
              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
                  City *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface2,
                      color: theme.colors.text1,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Mumbai"
                  placeholderTextColor={theme.colors.text3}
                />
              </View>

              <View style={styles.inputHalf}>
                <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
                  State *
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: theme.colors.surface2,
                      color: theme.colors.text1,
                      borderColor: theme.colors.border,
                    },
                  ]}
                  value={state}
                  onChangeText={setState}
                  placeholder="Maharashtra"
                  placeholderTextColor={theme.colors.text3}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
                PIN Code *
              </Text>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: theme.colors.surface2,
                    color: theme.colors.text1,
                    borderColor: theme.colors.border,
                  },
                ]}
                value={pincode}
                onChangeText={setPincode}
                placeholder="400001"
                placeholderTextColor={theme.colors.text3}
                keyboardType="numeric"
                maxLength={6}
              />
            </View>

            {/* Save Address Checkbox */}
            <TouchableOpacity
              style={styles.checkboxRow}
              onPress={() => setSaveAddress(!saveAddress)}
            >
              <View
                style={[
                  styles.checkbox,
                  {
                    backgroundColor: saveAddress
                      ? '#FFD000'
                      : 'transparent',
                    borderColor: theme.colors.border,
                  },
                ]}
              >
                {saveAddress && <Ionicons name="checkmark" size={16} color="#FFF" />}
              </View>
              <Text style={[styles.checkboxLabel, { color: theme.colors.text2 }]}>
                Save this address for future orders
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          <View style={styles.savedAddressesList}>
            {savedAddresses.map(renderSavedAddressCard)}
          </View>
        )}

        {/* Delivery Instructions (Always Show) */}
        <View style={[styles.inputContainer, { marginTop: spacing[4] }]}>
          <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>
            Delivery Instructions (Optional)
          </Text>
          <TextInput
            style={[
              styles.input,
              styles.multilineInput,
              {
                backgroundColor: theme.colors.surface2,
                color: theme.colors.text1,
                borderColor: theme.colors.border,
              },
            ]}
            value={deliveryInstructions}
            onChangeText={setDeliveryInstructions}
            placeholder="e.g., Ring doorbell twice"
            placeholderTextColor={theme.colors.text3}
            multiline
            numberOfLines={2}
          />
        </View>
      </Card>
    </>
  );

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          {
            paddingTop: insets.top + spacing[4],
            backgroundColor: theme.colors.surface1,
          },
        ]}
      >
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.colors.text1 }]}>
          {isAuthenticated ? 'Delivery Details' : 'Guest Checkout'}
        </Text>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {isAuthenticated ? renderAuthenticatedView() : renderGuestForm()}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Continue Button */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom + spacing[4],
            backgroundColor: theme.colors.surface1,
          },
        ]}
      >
        <TouchableOpacity
          style={[styles.continueButton, { backgroundColor: '#FFD000' }]}
          onPress={handleContinue}
          activeOpacity={0.8}
        >
          <Text style={styles.continueButtonText}>Continue to Payment</Text>
          <Ionicons name="arrow-forward" size={20} color="#FFF" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing[4],
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
  },
  scrollContent: {
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing[4],
  },
  formSection: {
    padding: spacing[5],
    marginBottom: spacing[4],
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing[4],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: spacing[4],
  },
  addNewText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.semibold,
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  inputRow: {
    flexDirection: 'row',
    gap: spacing[3],
    marginBottom: spacing[4],
  },
  inputHalf: {
    flex: 1,
  },
  inputLabel: {
    fontSize: typography.fontSize.bodySm,
    marginBottom: spacing[2],
  },
  input: {
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: borderRadius.md,
    fontSize: typography.fontSize.body,
    borderWidth: 1,
  },
  multilineInput: {
    minHeight: 60,
    paddingTop: spacing[3],
    textAlignVertical: 'top',
  },
  savedAddressesList: {
    marginTop: spacing[2],
  },
  addressCard: {
    padding: spacing[4],
    borderRadius: borderRadius.md,
    marginBottom: spacing[3],
  },
  addressCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[2],
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  defaultBadge: {
    paddingHorizontal: spacing[2],
    paddingVertical: spacing[1],
    borderRadius: borderRadius.sm,
  },
  defaultBadgeText: {
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
  addressText: {
    fontSize: typography.fontSize.bodySm,
    marginBottom: spacing[1],
  },
  backToSavedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing[4],
    gap: spacing[2],
  },
  backToSavedText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.semibold,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing[2],
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing[2],
  },
  checkboxLabel: {
    flex: 1,
    fontSize: typography.fontSize.bodySm,
  },
  footer: {
    paddingTop: spacing[4],
    paddingHorizontal: spacing.screenPadding,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    gap: spacing[2],
  },
  continueButtonText: {
    color: '#FFF',
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default GuestCheckoutScreen;
