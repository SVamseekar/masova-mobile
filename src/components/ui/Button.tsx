import React from 'react';
import {
  TouchableOpacity, Text, ActivityIndicator, ViewStyle, TextStyle, View,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, typography } from '../../styles';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  style?: ViewStyle;
  accessibilityLabel?: string;
  accessibilityRole?: 'button' | 'link' | 'tab' | 'none';
}

const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  fullWidth = false,
  leftIcon,
  rightIcon,
  style,
  accessibilityLabel,
  accessibilityRole = 'button',
}) => {
  const { theme, isDark } = useTheme();

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onPress();
    }
  };

  const sizeStyles: { container: ViewStyle; text: TextStyle } = (() => {
    switch (size) {
      case 'sm': return {
        container: { paddingVertical: 8, paddingHorizontal: 16, minHeight: 36 },
        text: { fontSize: 13, lineHeight: 18 },
      };
      case 'lg': return {
        container: { paddingVertical: 16, paddingHorizontal: 24, minHeight: 56 },
        text: { fontSize: 17, lineHeight: 24 },
      };
      default: return {
        container: { paddingVertical: 12, paddingHorizontal: 20, minHeight: 48 },
        text: { fontSize: typography.fontSize.body, lineHeight: typography.lineHeight.body },
      };
    }
  })();

  const variantStyles: { container: ViewStyle; text: TextStyle } = (() => {
    if (disabled) return {
      container: { backgroundColor: theme.colors.surface3 },
      text: { color: theme.colors.text3 },
    };
    switch (variant) {
      case 'primary': return {
        container: { backgroundColor: '#FFD000' },
        text: { color: '#000000' },
      };
      case 'secondary': return {
        container: {
          backgroundColor: 'transparent',
          borderWidth: 1.5,
          borderColor: '#FFD000',
        },
        text: { color: isDark ? '#FFD000' : '#0F0F0F' },
      };
      case 'ghost': return {
        container: { backgroundColor: 'transparent' },
        text: { color: theme.colors.text2 },
      };
      case 'danger': return {
        container: { backgroundColor: theme.colors.error },
        text: { color: '#FFFFFF' },
      };
    }
  })();

  const containerStyle: ViewStyle = {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.button,
    alignSelf: fullWidth ? 'stretch' : 'flex-start',
    ...sizeStyles.container,
    ...variantStyles.container,
    ...style,
  };

  const textStyle: TextStyle = {
    fontWeight: typography.fontWeight.bold,
    letterSpacing: 0.2,
    ...sizeStyles.text,
    ...variantStyles.text,
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      disabled={disabled || loading}
      style={containerStyle}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator color={variantStyles.text.color as string} size="small" />
      ) : (
        <>
          {leftIcon && <View style={{ marginRight: 8 }}>{leftIcon}</View>}
          <Text style={textStyle}>{title}</Text>
          {rightIcon && <View style={{ marginLeft: 8 }}>{rightIcon}</View>}
        </>
      )}
    </TouchableOpacity>
  );
};

export default Button;
