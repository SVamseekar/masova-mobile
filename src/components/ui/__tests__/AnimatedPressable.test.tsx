import React from 'react';
import renderer, { act } from 'react-test-renderer';
import { AccessibilityInfo, Animated, AppState, Text } from 'react-native';
import { AnimatedPressable } from '../AnimatedPressable';

let motionChanged: (enabled: boolean) => void;
let appChanged: (state: 'active' | 'background') => void;
let tree: ReturnType<typeof renderer.create>;
beforeEach(async () => {
  jest.spyOn(AccessibilityInfo, 'isReduceMotionEnabled').mockResolvedValue(false);
  const subscription = AccessibilityInfo.addEventListener('announcementFinished', () => {});
  jest.spyOn(AccessibilityInfo, 'addEventListener').mockImplementation((...args: unknown[]) => {
    motionChanged = args[1] as typeof motionChanged;
    return subscription;
  });
  jest.spyOn(AppState, 'addEventListener').mockImplementation((_event, callback) => {
    appChanged = callback as typeof appChanged;
    return { remove: jest.fn() };
  });
  await act(async () => {
    tree = renderer.create(
      <AnimatedPressable>
        <Text>Dish</Text>
      </AnimatedPressable>,
    );
  });
});
afterEach(async () => {
  await act(async () => tree.unmount());
  jest.restoreAllMocks();
});
const opacity = () => tree.root.findByType(Animated.View).props.style[1].opacity;
it('settles active feedback immediately when reduced motion becomes enabled', () => {
  act(() => opacity().setValue(0.78));
  act(() => motionChanged(true));
  expect(opacity().__getValue()).toBe(1);
});
it('keeps feedback settled when a press event arrives while app is backgrounded', () => {
  act(() => appChanged('background'));
  const timing = jest.spyOn(Animated, 'timing');
  act(() =>
    tree.root
      .findAll(
        (node: { props: { onPressIn?: unknown } }) => typeof node.props.onPressIn === 'function',
      )[0]
      .props.onPressIn({}),
  );
  expect(opacity().__getValue()).toBe(1);
  expect(timing).not.toHaveBeenCalled();
});
it('settles feedback when a pressed control becomes disabled', () => {
  act(() => opacity().setValue(0.78));
  act(() =>
    tree.update(
      <AnimatedPressable disabled>
        <Text>Dish</Text>
      </AnimatedPressable>,
    ),
  );
  expect(opacity().__getValue()).toBe(1);
});
