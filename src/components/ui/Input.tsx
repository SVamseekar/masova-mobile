import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  ViewStyle,
  TextStyle,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography } from '../../styles';

type InputState = 'default' | 'error' | 'success';

interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  helperText?: string;
  error?: string;
  state?: InputState;
  size?: 'sm' | 'md' | 'lg';
  leftIcon?: keyof typeof Ionicons.glyphMap;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightIconPress?: () => void;
  containerStyle?: ViewStyle;
  inputStyle?: TextStyle;
  isPassword?: boolean;
}

const Input: React.FC<InputProps> = ({
  label,
  helperText,
  error,
  state = 'default',
  size = 'md',
  leftIcon,
  rightIcon,
  onRightIconPress,
  containerStyle,
  inputStyle,
  isPassword = false,
  ...textInputProps
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const effectiveState = error ? 'error' : state;

  const getHeight = () => {
    switch (size) {
      case 'sm': return 40;
      case 'lg': return 56;
      default:   return 52;
    }
  };

  const getBorderColor = () => {
    if (isFocused) return '#FFD000';
    if (effectiveState === 'error') return theme.colors.error;
    if (effectiveState === 'success') return theme.colors.success;
    return theme.colors.border;
  };

  const getStateColor = () => {
    if (effectiveState === 'error') return theme.colors.error;
    if (effectiveState === 'success') return theme.colors.success;
    return theme.colors.text2;
  };

  return (
    <View style={[styles.wrapper, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: theme.colors.text2 }]}>{label}</Text>
      )}
      <View
        style={[
          styles.container,
          {
            backgroundColor: theme.colors.surface3,
            borderColor: getBorderColor(),
            borderWidth: isFocused ? 1.5 : StyleSheet.hairlineWidth,
            minHeight: getHeight(),
          },
        ]}
      >
        {leftIcon && (
          <Ionicons
            name={leftIcon}
            size={20}
            color={theme.colors.text3}
            style={styles.leftIcon}
          />
        )}
        <TextInput
          {...textInputProps}
          style={[styles.input, { color: theme.colors.text1 }, inputStyle]}
          placeholderTextColor={theme.colors.text3}
          onFocus={(e) => {
            setIsFocused(true);
            textInputProps.onFocus?.(e);
          }}
          onBlur={(e) => {
            setIsFocused(false);
            textInputProps.onBlur?.(e);
          }}
          secureTextEntry={isPassword && !showPassword}
        />
        {isPassword && (
          <TouchableOpacity onPress={() => setShowPassword(p => !p)} style={styles.rightIcon}>
            <Ionicons
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color={theme.colors.text3}
            />
          </TouchableOpacity>
        )}
        {rightIcon && !isPassword && (
          <TouchableOpacity onPress={onRightIconPress} disabled={!onRightIconPress} style={styles.rightIcon}>
            <Ionicons name={rightIcon} size={20} color={theme.colors.text3} />
          </TouchableOpacity>
        )}
      </View>
      {(error || helperText) && (
        <Text style={[styles.helperText, { color: getStateColor() }]}>
          {error || helperText}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: typography.fontSize.bodySm,
    fontWeight: typography.fontWeight.medium,
    marginBottom: spacing.xs,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.input,
    paddingHorizontal: spacing.lg,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: typography.fontWeight.regular,
    paddingVertical: spacing.md,
  },
  leftIcon: {
    marginRight: spacing.sm,
  },
  rightIcon: {
    padding: spacing.xs,
    marginLeft: spacing.xs,
  },
  helperText: {
    fontSize: typography.fontSize.caption,
    marginTop: spacing.xs,
  },
});

export default Input;
