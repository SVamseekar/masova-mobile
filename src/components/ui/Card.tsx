import React from 'react';
import { View, StyleSheet, ViewStyle, TouchableOpacity } from 'react-native';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, shadows } from '../../styles';

type CardElevation = 'none' | 'sm' | 'md' | 'lg';

interface CardProps {
  children: React.ReactNode;
  elevation?: CardElevation;
  padding?: number;
  onPress?: () => void;
  style?: ViewStyle;
  borderless?: boolean;
  // Legacy props (ignored in new design)
  variant?: 'solid' | 'glass' | 'glassDark';
}

const Card: React.FC<CardProps> = ({
  children,
  elevation = 'sm',
  padding = 16,
  onPress,
  style,
  borderless = false,
}) => {
  const { theme, isDark } = useTheme();

  const elevationStyle = (() => {
    if (isDark) {
      switch (elevation) {
        case 'none': return { backgroundColor: theme.colors.bg };
        case 'sm':   return { backgroundColor: theme.colors.surface1 };
        case 'md':   return { backgroundColor: theme.colors.surface2 };
        case 'lg':   return { backgroundColor: theme.colors.surface3 };
        default:     return { backgroundColor: theme.colors.surface1 };
      }
    } else {
      switch (elevation) {
        case 'none': return { backgroundColor: theme.colors.bg, ...shadows.none };
        case 'sm':   return { backgroundColor: theme.colors.surface1, ...shadows.sm };
        case 'md':   return { backgroundColor: theme.colors.surface1, ...shadows.md };
        case 'lg':   return { backgroundColor: theme.colors.surface1, ...shadows.lg };
        default:     return { backgroundColor: theme.colors.surface1, ...shadows.sm };
      }
    }
  })();

  const cardStyle: ViewStyle = {
    borderRadius: borderRadius.card,
    padding,
    overflow: 'hidden',
    ...elevationStyle,
    ...(!borderless && {
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: theme.colors.border,
    }),
    ...style,
  };

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={cardStyle}>
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={cardStyle}>{children}</View>;
};

export default Card;
