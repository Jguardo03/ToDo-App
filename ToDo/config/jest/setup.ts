// Icons draw through a native module that does not exist in Jest; they are decorative, so render nothing.
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));

// Browser/device storage does not exist in Jest; use the in-memory version shipped with the library.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
