/**
 * Shared FlatList performance defaults for long scrollable lists
 * (menu, order history, notifications, loyalty).
 *
 * Tune once; import into screens so list virtualization stays consistent.
 */
import { Platform } from 'react-native';

export const LIST_PERF = {
  /** Detach off-screen views (Android benefit; harmless on iOS). */
  removeClippedSubviews: Platform.OS === 'android',
  /** First paint batch size for typical phone viewports. */
  initialNumToRender: 8,
  /** Incremental batch size while scrolling. */
  maxToRenderPerBatch: 8,
  /** Viewport multiples kept mounted (lower = less memory, more recycle). */
  windowSize: 7,
  /** Defer updates during scroll for smoother FPS on dense image lists. */
  updateCellsBatchingPeriod: 50,
} as const;

/**
 * Spread onto FlatList props for menu / order-style lists.
 */
export function getListPerfProps() {
  return {
    removeClippedSubviews: LIST_PERF.removeClippedSubviews,
    initialNumToRender: LIST_PERF.initialNumToRender,
    maxToRenderPerBatch: LIST_PERF.maxToRenderPerBatch,
    windowSize: LIST_PERF.windowSize,
    updateCellsBatchingPeriod: LIST_PERF.updateCellsBatchingPeriod,
  };
}
