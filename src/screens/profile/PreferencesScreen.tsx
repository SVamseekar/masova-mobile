/**
 * Customer Preferences Screen
 * Manage dietary restrictions, allergen alerts, and preferred spice levels
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Button, Card, Badge } from '../../components/ui';
import { RootStackParamList, Customer, CustomerPreferences } from '../../types';
import { customerApi } from '../../services/api';
import { AllergenType, ALLERGEN_LABELS } from '../../constants/allergens';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const DIETARY_OPTIONS = [
  { id: 'VEGETARIAN', label: 'Vegetarian' },
  { id: 'VEGAN', label: 'Vegan' },
  { id: 'NON_VEGETARIAN', label: 'Non-Vegetarian' },
  { id: 'JAIN', label: 'Jain' },
  { id: 'HALAL', label: 'Halal' },
  { id: 'GLUTEN_FREE', label: 'Gluten-Free' },
  { id: 'DAIRY_FREE', label: 'Dairy-Free' },
];

const SPICE_LEVELS = [
  { id: 'MILD', label: 'Mild (Low Spice)', dots: 1 },
  { id: 'MEDIUM', label: 'Medium (Balanced)', dots: 2 },
  { id: 'HOT', label: 'Hot (Spicy)', dots: 3 },
  { id: 'EXTRA_HOT', label: 'Extra Hot (Very Spicy)', dots: 4 },
];

const ALLERGEN_LIST: AllergenType[] = [
  'MILK', 'EGGS', 'FISH', 'CRUSTACEANS', 'NUTS',
  'PEANUTS', 'CEREALS_GLUTEN', 'SOYA', 'SESAME', 'MUSTARD',
  'CELERY', 'LUPIN', 'MOLLUSCS', 'SULPHUR_DIOXIDE',
];

const PreferencesScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [dietaryRestrictions, setDietaryRestrictions] = useState<string[]>([]);
  const [allergenAlerts, setAllergenAlerts] = useState<AllergenType[]>([]);
  const [spiceLevel, setSpiceLevel] = useState<string>('MEDIUM');
  const [notifyOnOffers, setNotifyOnOffers] = useState(true);
  const [notifyOnOrderStatus, setNotifyOnOrderStatus] = useState(true);

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await customerApi.getByUserId(user.id);
      setCustomer(data);
      if (data?.preferences) {
        setDietaryRestrictions(data.preferences.dietaryRestrictions || []);
        setAllergenAlerts((data.preferences.allergenAlerts as AllergenType[]) || []);
        setSpiceLevel(data.preferences.spiceLevel || 'MEDIUM');
        setNotifyOnOffers(data.preferences.notifyOnOffers ?? true);
        setNotifyOnOrderStatus(data.preferences.notifyOnOrderStatus ?? true);
      }
    } catch (err: any) {
      console.error('Failed to load preferences:', err);
      Alert.alert('Error', err.message || 'Failed to load preferences');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const toggleDietary = (id: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setDietaryRestrictions((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const toggleAllergen = (allergen: AllergenType) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setAllergenAlerts((prev) =>
      prev.includes(allergen) ? prev.filter((item) => item !== allergen) : [...prev, allergen]
    );
  };

  const handleSave = async () => {
    if (!customer?.id) {
      Alert.alert('Error', 'Customer record not found');
      return;
    }
    try {
      setSaving(true);
      const updatedPreferences: CustomerPreferences = {
        favoriteMenuItems: customer.preferences?.favoriteMenuItems || [],
        cuisinePreferences: customer.preferences?.cuisinePreferences || [],
        dietaryRestrictions,
        allergenAlerts: allergenAlerts as string[],
        spiceLevel,
        notifyOnOffers,
        notifyOnOrderStatus,
      };

      await customerApi.updatePreferences(customer.id, updatedPreferences);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Preferences saved successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('Failed to save preferences:', err);
      Alert.alert('Error', err.message || 'Failed to save preferences');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color="#FFD000" />
        <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
          Loading your preferences...
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Food & Dietary Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Dietary Restrictions */}
        <Card elevation="sm" style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Dietary Restrictions</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.text2 }]}>
            Select all dietary choices that apply to you
          </Text>
          <View style={styles.chipContainer}>
            {DIETARY_OPTIONS.map((opt) => {
              const selected = dietaryRestrictions.includes(opt.id);
              return (
                <TouchableOpacity
                  key={opt.id}
                  onPress={() => toggleDietary(opt.id)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? '#FFD000' : theme.colors.surface2,
                      borderColor: selected ? '#FFD000' : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? '#000000' : theme.colors.text1 },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Allergen Alerts */}
        <Card elevation="sm" style={styles.sectionCard}>
          <View style={styles.sectionHeaderRow}>
            <Ionicons name="warning-outline" size={20} color="#EF4444" />
            <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Allergen Alerts</Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.text2 }]}>
            Items containing selected allergens will show warning badges on the menu
          </Text>
          <View style={styles.chipContainer}>
            {ALLERGEN_LIST.map((allergen) => {
              const selected = allergenAlerts.includes(allergen);
              return (
                <TouchableOpacity
                  key={allergen}
                  onPress={() => toggleAllergen(allergen)}
                  style={[
                    styles.chip,
                    {
                      backgroundColor: selected ? '#EF4444' : theme.colors.surface2,
                      borderColor: selected ? '#EF4444' : theme.colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.chipText,
                      { color: selected ? '#FFFFFF' : theme.colors.text1 },
                    ]}
                  >
                    {ALLERGEN_LABELS[allergen] || allergen}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        {/* Spice Level Preference */}
        <Card elevation="sm" style={styles.sectionCard}>
          <Text style={[styles.sectionTitle, { color: theme.colors.text1 }]}>Preferred Spice Level</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.text2 }]}>
            We'll recommend items matching your spice preference
          </Text>
          <View style={styles.spiceContainer}>
            {SPICE_LEVELS.map((lvl) => {
              const selected = spiceLevel === lvl.id;
              return (
                <TouchableOpacity
                  key={lvl.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setSpiceLevel(lvl.id);
                  }}
                  style={[
                    styles.spiceOption,
                    {
                      backgroundColor: selected ? `${'#FFD000'}15` : theme.colors.surface2,
                      borderColor: selected ? '#FFD000' : theme.colors.border,
                    },
                  ]}
                >
                  <View style={styles.spiceHeader}>
                    <Text style={[styles.spiceLabel, { color: theme.colors.text1 }]}>{lvl.label}</Text>
                    <View style={{ flexDirection: 'row', gap: 3 }}>
                      {Array.from({ length: lvl.dots }).map((_, i) => (
                        <View
                          key={i}
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: '#EF4444',
                          }}
                        />
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </Card>

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Save Button Footer */}
      <View
        style={[
          styles.footer,
          {
            backgroundColor: theme.colors.surface1,
            paddingBottom: insets.bottom + spacing[3],
            borderTopColor: theme.colors.border,
          },
        ]}
      >
        <Button
          title="Save Preferences"
          onPress={handleSave}
          size="lg"
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing[3],
    fontSize: typography.fontSize.body,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
    paddingHorizontal: spacing.screenPadding,
    paddingTop: spacing[3],
  },
  sectionCard: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[2],
    marginBottom: spacing[1],
  },
  sectionTitle: {
    fontSize: typography.fontSize.titleSm,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
  },
  sectionSubtitle: {
    fontSize: typography.fontSize.bodySm,
    marginTop: spacing[1],
    marginBottom: spacing[4],
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing[2],
  },
  chip: {
    paddingVertical: spacing[2],
    paddingHorizontal: spacing[4],
    borderRadius: borderRadius.chip,
    borderWidth: 1,
  },
  chipText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
  },
  spiceContainer: {
    gap: spacing[2],
  },
  spiceOption: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
  },
  spiceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  spiceLabel: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.medium,
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    ...shadows.lg,
  },
  saveButton: {
    width: '100%',
  },
});

export default PreferencesScreen;
