/**
 * Change Password Screen
 * Updates user password via authApi.changePassword
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography, shadows } from '../../styles';
import { Button, Card } from '../../components/ui';
import { RootStackParamList } from '../../types';
import { authApi } from '../../services/api';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const ChangePasswordScreen: React.FC = () => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavigationProp>();

  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Required Field', 'Please enter your current password');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'New password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Password Mismatch', 'New password and confirm password do not match');
      return;
    }

    try {
      setSubmitting(true);
      await authApi.changePassword({ currentPassword, newPassword });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert('Success', 'Your password has been changed successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (err: any) {
      console.error('Failed to change password:', err);
      Alert.alert('Error', err?.message || 'Failed to change password. Please check your current password.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: theme.colors.text1 }]}>Change Password</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <Card elevation="sm" style={styles.card}>
          {/* Current Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>Current Password</Text>
            <View style={[styles.passwordWrapper, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text1 }]}
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry={!showCurrent}
                placeholder="Enter current password"
                placeholderTextColor={theme.colors.text3}
              />
              <TouchableOpacity onPress={() => setShowCurrent(!showCurrent)} style={styles.eyeIcon}>
                <Ionicons name={showCurrent ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.text2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* New Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>New Password</Text>
            <View style={[styles.passwordWrapper, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text1 }]}
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNew}
                placeholder="Enter new password (min 6 chars)"
                placeholderTextColor={theme.colors.text3}
              />
              <TouchableOpacity onPress={() => setShowNew(!showNew)} style={styles.eyeIcon}>
                <Ionicons name={showNew ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.text2} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Confirm New Password */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: theme.colors.text2 }]}>Confirm New Password</Text>
            <View style={[styles.passwordWrapper, { backgroundColor: theme.colors.surface2, borderColor: theme.colors.border }]}>
              <TextInput
                style={[styles.input, { color: theme.colors.text1 }]}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry={!showConfirm}
                placeholder="Re-enter new password"
                placeholderTextColor={theme.colors.text3}
              />
              <TouchableOpacity onPress={() => setShowConfirm(!showConfirm)} style={styles.eyeIcon}>
                <Ionicons name={showConfirm ? 'eye-off-outline' : 'eye-outline'} size={20} color={theme.colors.text2} />
              </TouchableOpacity>
            </View>
          </View>
        </Card>
      </ScrollView>

      {/* Submit Button */}
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
          title="Update Password"
          onPress={handleChangePassword}
          size="lg"
          loading={submitting}
          disabled={submitting}
          style={styles.submitButton}
        />
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
  },
  inputContainer: {
    marginBottom: spacing[4],
  },
  inputLabel: {
    fontSize: typography.fontSize.bodySm,
    marginBottom: spacing[2],
  },
  passwordWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingRight: spacing[3],
  },
  input: {
    flex: 1,
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    fontSize: typography.fontSize.body,
  },
  eyeIcon: {
    padding: spacing[2],
  },
  footer: {
    padding: spacing[4],
    borderTopWidth: StyleSheet.hairlineWidth,
    ...shadows.lg,
  },
  submitButton: {
    width: '100%',
  },
});

export default ChangePasswordScreen;
