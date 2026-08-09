/**
 * Dish photo — local bundled seed images first, then remote URI.
 */

import React from 'react';
import { View, StyleSheet, StyleProp, ImageStyle, ViewStyle } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { localMenuImage } from '../../constants/menuImages';

type Props = {
  name?: string;
  imageUrl?: string | null;
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  placeholderColor?: string;
  iconColor?: string;
};

export const MenuDishImage: React.FC<Props> = ({
  name,
  imageUrl,
  style,
  containerStyle,
  placeholderColor = '#E8E8E8',
  iconColor = '#9A9A9A',
}) => {
  const local = localMenuImage(name, imageUrl || undefined);
  const remote =
    imageUrl && /^https?:\/\//i.test(imageUrl) ? { uri: imageUrl } : undefined;
  const source = local || remote;

  if (!source) {
    return (
      <View style={[styles.placeholder, { backgroundColor: placeholderColor }, style, containerStyle]}>
        <Ionicons name="restaurant-outline" size={28} color={iconColor} />
      </View>
    );
  }

  return (
    <Image
      source={source}
      style={[style]}
      contentFit="cover"
      cachePolicy="memory-disk"
      transition={180}
    />
  );
};

const styles = StyleSheet.create({
  placeholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default MenuDishImage;
