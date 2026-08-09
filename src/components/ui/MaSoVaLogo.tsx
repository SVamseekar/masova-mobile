/**
 * MaSoVa brand mark — aligned with platform gold wordmark.
 * Uses bundled brand assets when available; falls back to vector mark + text.
 */

import React from 'react';
import { View, Text, StyleSheet, Image, ImageStyle, ViewStyle } from 'react-native';

interface MaSoVaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
  markOnly?: boolean;
  /** Prefer platform-style image wordmark */
  variant?: 'wordmark' | 'mark' | 'auto';
}

const SIZES = {
  sm: { mark: 22, fontSize: 18, gap: 6 },
  md: { mark: 28, fontSize: 24, gap: 8 },
  lg: { mark: 40, fontSize: 34, gap: 10 },
};

export const MaSoVaLogo: React.FC<MaSoVaLogoProps> = ({
  size = 'md',
  textColor = '#FFFFFF',
  markOnly = false,
  variant = 'auto',
}) => {
  const { mark, fontSize, gap } = SIZES[size];

  if (markOnly || variant === 'mark') {
    return (
      <Image
        source={require('../../../assets/brand/app-icon.png')}
        style={{ width: mark + 6, height: mark + 6, borderRadius: 8 } as ImageStyle}
        resizeMode="cover"
      />
    );
  }

  // Full wordmark: icon + platform-style MaSoVa text (gold So)
  return (
    <View style={[styles.container, { gap } as ViewStyle]}>
      <Image
        source={require('../../../assets/brand/app-icon.png')}
        style={{ width: mark, height: mark, borderRadius: 7 } as ImageStyle}
        resizeMode="cover"
      />
      <Text style={[styles.wordmark, { fontSize, color: textColor, letterSpacing: -0.6 }]}>
        <Text style={{ color: textColor }}>Ma</Text>
        <Text style={{ color: '#FFD000' }}>So</Text>
        <Text style={{ color: textColor }}>Va</Text>
      </Text>
    </View>
  );
};

/** Icon-only for launcher-adjacent UI */
export const MaSoVaAppIcon: React.FC<{ size?: number }> = ({ size = 40 }) => (
  <Image
    source={require('../../../assets/brand/app-icon.png')}
    style={{ width: size, height: size, borderRadius: size * 0.22 }}
    resizeMode="cover"
  />
);

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wordmark: {
    fontFamily: 'PlusJakartaSans-ExtraBold',
    includeFontPadding: false,
  },
});

export default MaSoVaLogo;
