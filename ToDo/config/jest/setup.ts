// Icons draw through a native module that does not exist in Jest; they are decorative, so render nothing.
jest.mock('expo-symbols', () => ({ SymbolView: () => null }));
