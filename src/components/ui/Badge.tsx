import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { spacing, typography, borderRadius } from '../../styles';

type BadgeVariant = 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';
type BadgeSize = 'sm' | 'md';

interface BadgeProps {
  label: string;
  variant?: BadgeVariant;
  size?: BadgeSize;
  dot?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
}

const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'primary',
  size = 'md',
  dot = false,
  icon,
  style,
}) => {
  const { theme } = useTheme();

  const getColors = (): { bg: string; text: string; dotColor: string } => {
    switch (variant) {
      case 'primary':   return { bg: '#FFD000', text: '#000000', dotColor: '#FFD000' };
      case 'secondary': return { bg: theme.colors.surface2, text: theme.colors.text1, dotColor: theme.colors.text2 };
      case 'success':   return { bg: theme.colors.success, text: '#FFFFFF', dotColor: theme.colors.success };
      case 'warning':   return { bg: theme.colors.warning, text: '#000000', dotColor: theme.colors.warning };
      case 'error':     return { bg: theme.colors.error, text: '#FFFFFF', dotColor: theme.colors.error };
      case 'info':      return { bg: theme.colors.surface2, text: theme.colors.text2, dotColor: theme.colors.text2 };
      default:          return { bg: '#FFD000', text: '#000000', dotColor: '#FFD000' };
    }
  };

  const { bg, text, dotColor } = getColors();
  const isSm = size === 'sm';

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          paddingHorizontal: isSm ? 6 : spacing.md,
          paddingVertical: isSm ? 2 : 3,
        },
        style,
      ]}
    >
      {dot && <View style={[styles.dot, { backgroundColor: dotColor }]} />}
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text
        style={[
          styles.label,
          {
            color: text,
            fontSize: isSm ? typography.fontSize.caption : typography.fontSize.label,
          },
        ]}
      >
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.pill,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: spacing.sm,
  },
  icon: {
    marginRight: spacing.xs,
  },
  label: {
    fontWeight: '600',
  },
});

export default Badge;
