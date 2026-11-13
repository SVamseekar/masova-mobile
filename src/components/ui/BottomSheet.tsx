import React, { useEffect, useRef } from 'react';
import {
  Animated,
  AppState,
  Easing,
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useReducedMotion } from '../../hooks/useReducedMotion';
import { useTheme } from '../../hooks/useTheme';

/** Short, interruptible native sheet motion; no loops or moving interaction targets. */
export const BottomSheet: React.FC<{
  visible: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}> = ({ visible, title, onClose, children, footer }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const progress = useRef(new Animated.Value(1)).current;
  const reduced = useReducedMotion();
  useEffect(() => {
    if (!visible || reduced || (AppState.currentState != null && AppState.currentState !== 'active')) {
      progress.stopAnimation();
      progress.setValue(1);
      return;
    }
    progress.setValue(0);
    const animation = Animated.timing(progress, {
      toValue: 1,
      duration: 220,
      easing: Easing.bezier(0.2, 0, 0, 1),
      useNativeDriver: true,
    });
    animation.start();
    const subscription = AppState.addEventListener('change', (state) => {
      if (state !== 'active') {
        animation.stop();
        progress.setValue(1);
      }
    });
    return () => {
      animation.stop();
      subscription.remove();
    };
  }, [visible, reduced, progress]);
  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel={`Close ${title}`}
        />
        <Animated.View
          accessibilityViewIsModal
          style={[
            styles.sheet,
            {
              backgroundColor: theme.colors.surface1,
              paddingBottom: Math.max(insets.bottom, 16),
              opacity: progress,
              transform: [
                { translateY: progress.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
              ],
            },
          ]}
        >
          <View style={[styles.handle, { backgroundColor: theme.colors.border }]} />
          <View style={styles.header}>
            <Text accessibilityRole="header" style={[styles.title, { color: theme.colors.text1 }]}>
              {title}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Close ${title}`}
              style={styles.close}
              onPress={onClose}
            >
              <Ionicons name="close" size={24} color={theme.colors.text1} />
            </Pressable>
          </View>
          <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={styles.body}>
            {children}
          </ScrollView>
          {footer && (
            <View style={[styles.footer, { borderColor: theme.colors.border }]}>{footer}</View>
          )}
        </Animated.View>
      </View>
    </Modal>
  );
};
const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: { maxHeight: '88%', borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  handle: { width: 48, height: 4, borderRadius: 2, alignSelf: 'center', marginTop: 10 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16 },
  title: { flex: 1, fontSize: 22, fontWeight: '700' },
  close: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  body: { padding: 16, gap: 12 },
  footer: { paddingHorizontal: 16, paddingTop: 16, borderTopWidth: 1, gap: 12 },
});
