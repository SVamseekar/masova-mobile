module.exports = {
  preset: 'react-native',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: ['./jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@expo|expo-.*|@stomp/stompjs|@sentry)/)',
  ],

  testPathIgnorePatterns: ['/node_modules/', '/android/', '/ios/'],
};
