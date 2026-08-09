import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';

import { useTheme } from '../../hooks/useTheme';
import { useAuth } from '../../contexts/AuthContext';
import { spacing, borderRadius, typography } from '../../styles';
import { Button, Input, MaSoVaLogo } from '../../components/ui';

const RegisterScreen: React.FC = () => {
  const { theme, isDark } = useTheme();
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { register } = useAuth();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !phone || !password) {
      setError('Please fill in all fields');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await register({ name, email, phone, password });
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [{ name: 'Main' as never }],
        })
      );
    } catch (err: any) {
      const errorMessage = err?.response?.data?.message || err?.message || 'Registration failed. Please try again.';
      setError(errorMessage);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isDark ? ['#0F0F0F', '#1A1A1A'] : ['#FFFFFF', '#F5F5F5']}
        style={StyleSheet.absoluteFillObject}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + spacing[2] }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={theme.colors.text1} />
          </TouchableOpacity>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.logoWrapper}>
            <MaSoVaLogo size="lg" textColor={isDark ? '#FFFFFF' : '#0F0F0F'} />
          </View>
          <Text style={[styles.title, { color: theme.colors.text1 }]}>Create Account</Text>
          <Text style={[styles.subtitle, { color: theme.colors.text2 }]}>
            Sign up to start ordering your favorite food
          </Text>

          <View style={styles.form}>
            {error ? (
              <View style={[styles.errorContainer, { backgroundColor: `${theme.colors.error}15` }]}>
                <Text style={[styles.errorText, { color: theme.colors.error }]}>{error}</Text>
              </View>
            ) : null}

            <Input
              label="Full Name"
              value={name}
              onChangeText={setName}
              placeholder="Enter your name"
              leftIcon="person-outline"
            />
            <Input
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="Enter your email"
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon="mail-outline"
            />
            <Input
              label="Phone Number"
              value={phone}
              onChangeText={setPhone}
              placeholder="Enter phone number"
              keyboardType="phone-pad"
              leftIcon="call-outline"
            />
            <Input
              label="Password"
              value={password}
              onChangeText={setPassword}
              placeholder="Create a password"
              isPassword
              leftIcon="lock-closed-outline"
              helperText="Min 8 characters with letters and numbers"
            />

            <Text style={[styles.terms, { color: theme.colors.text2 }]}>
              By signing up, you agree to our{' '}
              <Text style={{ color: '#FFD000' }}>Terms of Service</Text>
              {' '}and{' '}
              <Text style={{ color: '#FFD000' }}>Privacy Policy</Text>
            </Text>

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={loading}
              fullWidth
              size="lg"
            />
          </View>
        </ScrollView>

        {/* Footer */}
        <View style={[styles.footer, { paddingBottom: insets.bottom + spacing[4] }]}>
          <Text style={[styles.footerText, { color: theme.colors.text2 }]}>
            Already have an account?{' '}
          </Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={[styles.footerLink, { color: '#FFD000' }]}>Sign In</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: spacing.screenPadding,
  },
  logoWrapper: {
    marginBottom: spacing[6],
    alignItems: 'center',
  },
  title: {
    fontSize: typography.fontSize.headline,
    fontWeight: typography.fontWeight.bold,
    fontFamily: 'PlusJakartaSans-Bold',
    marginBottom: spacing[2],
  },
  subtitle: {
    fontSize: typography.fontSize.body,
    fontFamily: 'PlusJakartaSans-Regular',
    marginBottom: spacing[8],
  },
  form: {
    gap: spacing[1],
  },
  errorContainer: {
    padding: spacing[3],
    borderRadius: borderRadius.md,
    marginBottom: spacing[4],
  },
  errorText: {
    fontSize: typography.fontSize.bodySm,
    textAlign: 'center',
  },
  terms: {
    fontSize: typography.fontSize.bodySm,
    lineHeight: typography.lineHeight.body,
    marginVertical: spacing[4],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    padding: spacing[4],
  },
  footerText: {
    fontSize: typography.fontSize.body,
  },
  footerLink: {
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default RegisterScreen;
