import { useEffect, useState } from 'react';
import { AccessibilityInfo } from 'react-native';

/** Keep motion disabled until the native preference is known. */
export const useReducedMotion = (): boolean => {
  const [reduced, setReduced] = useState(true);
  useEffect(() => {
    let mounted = true;
    let changed = false;
    const subscription = AccessibilityInfo.addEventListener('reduceMotionChanged', (value) => {
      changed = true;
      if (mounted) setReduced(value);
    });
    void AccessibilityInfo.isReduceMotionEnabled()
      .then((value) => {
        if (mounted && !changed) setReduced(value);
      })
      .catch(() => {
        /* Retain the conservative preference if native lookup fails. */
      });
    return () => {
      mounted = false;
      subscription.remove();
    };
  }, []);
  return reduced;
};
