/**
 * Notification Settings Screen
 * Manage push notification and status alert preferences
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
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
import { Button, Card } from '../../components/ui';
import { RootStackParamList, Customer, CustomerPreferences } from '../../types';
import { customerApi } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const NotificationSettingsScreen: React.FC = () => {
  const { theme } = useTheme();
  const { user } = useAuth();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [notifyOnOrderStatus, setNotifyOnOrderStatus] = useState(true);
  const [notifyOnOffers, setNotifyOnOffers] = useState(true);

  const loadPreferences = useCallback(async () => {
    if (!user?.id) return;
    try {
      setLoading(true);
      const data = await customerApi.getByUserId(user.id);
      setCustomer(data);
      if (data?.preferences) {
        setNotifyOnOrderStatus(data.preferences.notifyOnOrderStatus ?? true);
        setNotifyOnOffers(data.preferences.notifyOnOffers ?? true);
      }
    } catch (err: any) {
      console.error('Failed to load notification settings:', err);
      Alert.alert('Error', err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  const handleSave = async () => {
    if (!customer?.id) {
      Alert.alert('Error', 'Customer record not found');
      return;
    }
    try {
      setSaving(true);
      const updatedPreferences: CustomerPreferences = {
        ...(customer.preferences || {}),
        notifyOnOrderStatus,
        notifyOnOffers,
      };

      await customerApi.updatePreferences(customer.id, updatedPreferences);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Notification settings updated successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('Failed to save notification settings:', err);
      Alert.alert('Error', err.message || 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContainer, { backgroundColor: theme.colors.bg }]}>
        <ActivityIndicator size="large" color="#FFD000" />
        <Text style={[styles.loadingText, { color: theme.colors.text2 }]}>
          Loading settings...
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
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Notification Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card elevation="sm" style={styles.card}>
          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: theme.colors.text1 }]}>Order Status Updates</Text>
              <Text style={[styles.description, { color: theme.colors.text2 }]}>
                Real-time updates on your order progress, kitchen preparation, and delivery
              </Text>
            </View>
            <Switch
              value={notifyOnOrderStatus}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotifyOnOrderStatus(val);
              }}
              trackColor={{ false: theme.colors.border, true: '#FFD000' }}
              thumbColor={notifyOnOrderStatus ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>

          <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />

          <View style={styles.row}>
            <View style={styles.rowText}>
              <Text style={[styles.label, { color: theme.colors.text1 }]}>Promotions & Offers</Text>
              <Text style={[styles.description, { color: theme.colors.text2 }]}>
                Exclusive discounts, loyalty rewards, and seasonal menu announcements
              </Text>
            </View>
            <Switch
              value={notifyOnOffers}
              onValueChange={(val) => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setNotifyOnOffers(val);
              }}
              trackColor={{ false: theme.colors.border, true: '#FFD000' }}
              thumbColor={notifyOnOffers ? '#FFFFFF' : '#F4F3F4'}
            />
          </View>
        </Card>

        {/* System Permission Card */}
        <Card elevation="sm" style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Ionicons name="notifications-circle-outline" size={28} color="#FFD000" />
            <View style={{ flex: 1 }}>
              <Text style={[styles.infoTitle, { color: theme.colors.text1 }]}>Push Notifications Active</Text>
              <Text style={[styles.infoBody, { color: theme.colors.text2 }]}>
                Notifications are enabled for MaSoVa Mobile. You will receive updates directly on this device.
              </Text>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Save Button */}
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
          title="Save Settings"
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
  card: {
    padding: spacing[4],
    marginBottom: spacing[4],
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing[2],
  },
  rowText: {
    flex: 1,
    paddingRight: spacing[4],
  },
  label: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
    fontFamily: 'PlusJakartaSans-SemiBold',
    marginBottom: 4,
  },
  description: {
    fontSize: typography.fontSize.caption,
    lineHeight: 18,
  },
  divider: {
    height: 1,
    marginVertical: spacing[3],
  },
  infoCard: {
    padding: spacing[4],
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing[3],
  },
  infoTitle: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  infoBody: {
    fontSize: typography.fontSize.caption,
    marginTop: 2,
    lineHeight: 16,
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

export default NotificationSettingsScreen;
