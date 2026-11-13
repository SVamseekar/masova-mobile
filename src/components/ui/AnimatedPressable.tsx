/**
 * Fixed-target press feedback with the native driver.
 */
import React, { useEffect, useRef } from 'react';
import { Animated, AppState, Pressable, PressableProps, StyleProp, ViewStyle } from 'react-native';

import { useReducedMotion } from '../../hooks/useReducedMotion';

type Props = Omit<PressableProps, 'style'> & {
  style?: StyleProp<ViewStyle>;
  scaleTo?: number;
  children: React.ReactNode;
};
export const AnimatedPressable: React.FC<Props> = ({
  style,
  children,
  onPressIn,
  onPressOut,
  disabled,
  scaleTo: _scaleTo,
  ...rest
}) => {
  const opacity = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  const active = useRef(AppState.currentState == null || AppState.currentState === 'active');
  useEffect(() => {
    const app = AppState.addEventListener('change', (state) => {
      active.current = state === 'active';
      if (!active.current) {
        opacity.stopAnimation();
        opacity.setValue(1);
      }
    });
    return () => {
      app.remove();
      opacity.stopAnimation();
    };
  }, [opacity]);
  useEffect(() => {
    if (reduced || disabled) {
      opacity.stopAnimation();
      opacity.setValue(1);
    }
  }, [reduced, disabled, opacity]);
  const animate = (value: number) => {
    opacity.stopAnimation();
    if (!active.current || reduced || disabled) {
      opacity.setValue(1);
      return;
    }
    Animated.timing(opacity, { toValue: value, duration: 100, useNativeDriver: true }).start();
  };
  return (
    <Pressable
      disabled={disabled}
      onPressIn={(event) => {
        if (!disabled) animate(0.78);
        onPressIn?.(event);
      }}
      onPressOut={(event) => {
        animate(1);
        onPressOut?.(event);
      }}
      {...rest}
    >
      <Animated.View style={[style, { opacity }]}>{children}</Animated.View>
    </Pressable>
  );
};
export default AnimatedPressable;
