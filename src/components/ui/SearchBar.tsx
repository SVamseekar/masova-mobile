import React, { useState } from 'react';
import {
  View, TextInput, StyleSheet, TouchableOpacity, ViewStyle,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '../../hooks/useTheme';
import { borderRadius, typography, spacing } from '../../styles';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  onFocus?: () => void;
  onBlur?: () => void;
  onPress?: () => void;
  onVoicePress?: () => void;
  onClear?: () => void;
  editable?: boolean;
  autoFocus?: boolean;
  style?: ViewStyle;
}

const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChangeText,
  placeholder = 'Search...',
  onFocus,
  onBlur,
  onPress,
  onVoicePress,
  onClear,
  editable = true,
  autoFocus = false,
  style,
}) => {
  const { theme } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onChangeText('');
    onClear?.();
  };

  const content = (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.colors.surface2,
          borderColor: isFocused ? '#FFD000' : theme.colors.border,
          borderWidth: isFocused ? 1.5 : StyleSheet.hairlineWidth,
        },
        style,
      ]}
    >
      <Ionicons
        name="search-outline"
        size={20}
        color={theme.colors.text3}
        style={styles.icon}
      />
      <TextInput
        style={[styles.input, { color: theme.colors.text1 }]}
        placeholder={placeholder}
        placeholderTextColor={theme.colors.text3}
        value={value}
        onChangeText={onChangeText}
        onFocus={() => {
          setIsFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setIsFocused(false);
          onBlur?.();
        }}
        editable={editable}
        autoFocus={autoFocus}
        autoCapitalize="none"
        returnKeyType="search"
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={handleClear} style={styles.iconButton}>
          <Ionicons name="close-circle" size={18} color={theme.colors.text3} />
        </TouchableOpacity>
      )}
      {onVoicePress && value.length === 0 && (
        <TouchableOpacity
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            onVoicePress();
          }}
          style={styles.iconButton}
        >
          <Ionicons name="mic-outline" size={20} color={theme.colors.text3} />
        </TouchableOpacity>
      )}
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: borderRadius.pill,
    paddingHorizontal: spacing.lg,
  },
  icon: {
    marginRight: spacing.sm,
  },
  input: {
    flex: 1,
    fontSize: typography.fontSize.body,
    fontWeight: '400',
    paddingVertical: 0,
  },
  iconButton: {
    padding: spacing.xs,
    marginLeft: spacing.sm,
  },
});

export default SearchBar;
