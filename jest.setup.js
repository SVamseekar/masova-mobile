import '@react-native-async-storage/async-storage/jest/async-storage-mock';

if (typeof global.window === 'undefined') {
  global.window = global;
}
if (typeof global.window.dispatchEvent !== 'function') {
  global.window.dispatchEvent = () => true;
}

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('react-native-keychain', () => ({
  ACCESSIBLE: { WHEN_UNLOCKED_THIS_DEVICE_ONLY: 'WHEN_UNLOCKED_THIS_DEVICE_ONLY' },
  setGenericPassword: jest.fn(),
  getGenericPassword: jest.fn(),
  resetGenericPassword: jest.fn(),
}));

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 0, left: 0, right: 0 }),
  SafeAreaProvider: ({ children }) => children,
}));

jest.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
  MaterialIcons: () => null,
  FontAwesome: () => null,
  Feather: () => null,
  Entypo: () => null,
}));

jest.mock('expo-linear-gradient', () => ({
  LinearGradient: ({ children }) => children,
}));

jest.mock('expo-haptics', () => ({
  impactAsync: jest.fn(),
  notificationAsync: jest.fn(),
  selectionAsync: jest.fn(),
  ImpactFeedbackStyle: { Light: 'light', Medium: 'medium', Heavy: 'heavy' },
  NotificationFeedbackType: { Success: 'success', Warning: 'warning', Error: 'error' },
}));

jest.mock('expo-font', () => ({
  useFonts: () => [true, null],
  isLoaded: () => true,
  loadAsync: jest.fn(),
}));

jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn().mockResolvedValue({ status: 'granted' }),
  getCurrentPositionAsync: jest.fn().mockResolvedValue({ coords: { latitude: 17.385, longitude: 78.4867 } }),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn().mockResolvedValue({ isConnected: true, isInternetReachable: true }),
  useNetInfo: () => ({ isConnected: true, isInternetReachable: true }),
}));

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  setUser: jest.fn(),
  addBreadcrumb: jest.fn(),
  wrap: (component) => component,

}));

