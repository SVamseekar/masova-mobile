/**
 * QuantitySelector Component
 * Increment/decrement control for cart items
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { spacing, borderRadius, typography } from '../../styles';

interface QuantitySelectorProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
}

const QuantitySelector: React.FC<QuantitySelectorProps> = ({
  value,
  onChange,
  min = 1,
  max = 99,
  size = 'md',
  style,
}) => {
  const { theme } = useTheme();

  const handleDecrease = () => {
    if (value > min) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value - 1);
    }
  };

  const handleIncrease = () => {
    if (value < max) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      onChange(value + 1);
    }
  };

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return {
          buttonSize: 28,
          fontSize: typography.fontSize.bodySm,
          iconSize: 16,
          minWidth: 80,
        };
      case 'lg':
        return {
          buttonSize: 44,
          fontSize: typography.fontSize.titleSm,
          iconSize: 24,
          minWidth: 120,
        };
      default:
        return {
          buttonSize: 36,
          fontSize: typography.fontSize.body,
          iconSize: 20,
          minWidth: 100,
        };
    }
  };

  const sizeStyles = getSizeStyles();
  const canDecrease = value > min;
  const canIncrease = value < max;

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface2,
          minWidth: sizeStyles.minWidth,
        },
        style,
      ]}
    >
      <TouchableOpacity
        onPress={handleDecrease}
        disabled={!canDecrease}
        style={[
          styles.button,
          {
            width: sizeStyles.buttonSize,
            height: sizeStyles.buttonSize,
            opacity: canDecrease ? 1 : 0.4,
          },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons
          name="remove"
          size={sizeStyles.iconSize}
          color={canDecrease ? '#FFD000' : theme.colors.text3}
        />
      </TouchableOpacity>

      <Text
        style={[
          styles.value,
          {
            fontSize: sizeStyles.fontSize,
            color: theme.colors.text1,
          },
        ]}
      >
        {value}
      </Text>

      <TouchableOpacity
        onPress={handleIncrease}
        disabled={!canIncrease}
        style={[
          styles.button,
          {
            width: sizeStyles.buttonSize,
            height: sizeStyles.buttonSize,
            opacity: canIncrease ? 1 : 0.4,
          },
        ]}
        activeOpacity={0.7}
      >
        <Ionicons
          name="add"
          size={sizeStyles.iconSize}
          color={canIncrease ? '#FFD000' : theme.colors.text3}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    padding: spacing[1],
  },
  button: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: borderRadius.sm,
  },
  value: {
    fontWeight: typography.fontWeight.semibold,
    textAlign: 'center',
    minWidth: 30,
  },
});

export default QuantitySelector;
