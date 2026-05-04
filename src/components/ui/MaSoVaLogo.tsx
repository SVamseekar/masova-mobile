import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface MaSoVaLogoProps {
  size?: 'sm' | 'md' | 'lg';
  textColor?: string;
  markOnly?: boolean;
}

const SIZES = {
  sm: { markHeight: 16, fontSize: 18, gap: 6 },
  md: { markHeight: 22, fontSize: 24, gap: 8 },
  lg: { markHeight: 32, fontSize: 34, gap: 10 },
};

const SteamBowlMark: React.FC<{ height: number }> = ({ height }) => {
  const arcWidths = [height * 1.2, height * 0.9, height * 0.6];
  const arcOpacities = [1, 0.6, 0.3];
  const strokeWidth = Math.max(2, height * 0.1);
  const arcSpacing = height * 0.18;

  return (
    <View style={{ height, justifyContent: 'flex-end', alignItems: 'center' }}>
      {arcWidths.map((width, i) => (
        <View
          key={i}
          style={{
            width,
            height: width * 0.5,
            borderTopLeftRadius: width * 0.5,
            borderTopRightRadius: width * 0.5,
            borderTopWidth: strokeWidth,
            borderLeftWidth: strokeWidth,
            borderRightWidth: strokeWidth,
            borderColor: `rgba(255, 208, 0, ${arcOpacities[i]})`,
            marginBottom: i < arcWidths.length - 1 ? arcSpacing : 0,
            backgroundColor: 'transparent',
          }}
        />
      ))}
    </View>
  );
};

export const MaSoVaLogo: React.FC<MaSoVaLogoProps> = ({
  size = 'md',
  textColor = '#FFFFFF',
  markOnly = false,
}) => {
  const { markHeight, fontSize, gap } = SIZES[size];

  if (markOnly) {
    return <SteamBowlMark height={markHeight} />;
  }

  return (
    <View style={[styles.container, { gap }]}>
      <SteamBowlMark height={markHeight} />
      <Text style={[styles.wordmark, { fontSize, color: textColor, letterSpacing: -0.5 }]}>
        <Text style={{ color: textColor }}>Ma</Text>
        <Text style={{ color: '#FFD000' }}>So</Text>
        <Text style={{ color: textColor }}>Va</Text>
      </Text>
    </View>
  );
};

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
