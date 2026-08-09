/**
 * Guest Prompt View
 * Reusable component for protected screens requiring authentication
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { useTheme } from '../hooks/useTheme';
import { spacing, borderRadius, typography } from '../styles';
import { RootStackParamList } from '../types';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface GuestPromptViewProps {
  screenName: string;
  icon?: keyof typeof Ionicons.glyphMap;
  description?: string;
}

const GuestPromptView: React.FC<GuestPromptViewProps> = ({
  screenName,
  icon = 'lock-closed-outline',
  description,
}) => {
  const { theme } = useTheme();
  const navigation = useNavigation<NavigationProp>();

  const defaultDescription = `Sign in to view your ${screenName.toLowerCase()} and enjoy a personalized experience.`;

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg }]}>
      <View style={styles.content}>
        <View
          style={[
            styles.iconContainer,
            { backgroundColor: `${'#FFD000'}15` },
          ]}
        >
          <Ionicons name={icon} size={56} color={'#FFD000'} />
        </View>

        <Text style={[styles.title, { color: theme.colors.text1 }]}>
          Sign in to view {screenName}
        </Text>

        <Text style={[styles.description, { color: theme.colors.text2 }]}>
          {description || defaultDescription}
        </Text>

        <TouchableOpacity
          style={[styles.signInButton, { backgroundColor: '#FFD000' }]}
          onPress={() => navigation.navigate('Auth')}
          activeOpacity={0.8}
        >
          <Text style={styles.signInButtonText}>Sign In</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.createAccountButton}
          onPress={() => navigation.navigate('Auth')}
          activeOpacity={0.7}
        >
          <Text style={[styles.createAccountText, { color: '#FFD000' }]}>
            Don't have an account? Create one
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing[6],
  },
  content: {
    alignItems: 'center',
    maxWidth: 360,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing[5],
  },
  title: {
    fontSize: typography.fontSize.title,
    fontWeight: typography.fontWeight.bold,
    textAlign: 'center',
    marginBottom: spacing[3],
  },
  description: {
    fontSize: typography.fontSize.body,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 22,
  },
  signInButton: {
    paddingHorizontal: spacing[8],
    paddingVertical: spacing[4],
    borderRadius: borderRadius.lg,
    width: '100%',
    alignItems: 'center',
    marginBottom: spacing[3],
  },
  signInButtonText: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.semibold,
  },
  createAccountButton: {
    paddingVertical: spacing[2],
  },
  createAccountText: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
  },
});

export default GuestPromptView;
