/**
 * Offline Banner Component
 * Displays a top alert banner when device loses network connectivity
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNetworkStatus } from '../../hooks/useNetworkStatus';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography } from '../../styles';

export const OfflineBanner: React.FC = () => {
  const { isOffline } = useNetworkStatus();
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  if (!isOffline) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        {
          backgroundColor: theme.colors.semantic.error || '#EF4444',
          paddingTop: Math.max(insets.top, spacing[2]),
        },
      ]}
      accessibilityRole="alert"
      accessibilityLabel="You are currently offline. Some actions are unavailable."
    >
      <View style={styles.content}>
        <Ionicons name="wifi-outline" size={16} color="#FFFFFF" />
        <Text style={styles.text}>
          You’re offline — some actions unavailable
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    width: '100%',
    paddingBottom: spacing[2],
    paddingHorizontal: spacing[4],
    zIndex: 9999,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing[2],
  },
  text: {
    color: '#FFFFFF',
    fontSize: typography.fontSize.caption,
    fontWeight: typography.fontWeight.semibold,
  },
});

export default OfflineBanner;
