/**
 * Entrance fade + slide-up (stagger with delayMs).
 * Used on Home for section/card reveals like food-delivery apps.
 */

import React, { useEffect, useRef } from 'react';
import { Animated, StyleProp, ViewStyle } from 'react-native';

type Props = {
  children: React.ReactNode;
  delayMs?: number;
  durationMs?: number;
  distance?: number;
  style?: StyleProp<ViewStyle>;
  /** Remount / re-run when this changes (e.g. storeId or data length) */
  trigger?: string | number | boolean;
};

export const FadeInUp: React.FC<Props> = ({
  children,
  delayMs = 0,
  durationMs = 420,
  distance = 18,
  style,
  trigger = 1,
}) => {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(distance);
    const anim = Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: durationMs,
        delay: delayMs,
        useNativeDriver: true,
      }),
      Animated.spring(translateY, {
        toValue: 0,
        delay: delayMs,
        useNativeDriver: true,
        friction: 9,
        tension: 80,
      }),
    ]);
    anim.start();
    return () => anim.stop();
  }, [trigger, delayMs, durationMs, distance, opacity, translateY]);

  return (
    <Animated.View style={[style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
};

export default FadeInUp;
