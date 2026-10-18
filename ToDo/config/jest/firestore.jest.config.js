/**
 * Jest config for the Firestore contract run (`npm run test:firestore`).
 * It uses plain Node, not the jest-expo / React Native environment: Firebase's Node build (gRPC) works against
 * real Firestore there, while the React Native test environment cannot make the network calls.
 */
process.env.RUN_FIRESTORE_CONTRACT = '1';

module.exports = {
  rootDir: '../..',
  testEnvironment: 'node',
  testMatch: ['<rootDir>/__tests__/repositories/firestore-contract-test.ts'],
  transform: {
    '^.+\\.[jt]sx?$': [
      'babel-jest',
      { presets: ['@babel/preset-typescript'], plugins: ['@babel/plugin-transform-modules-commonjs'] },
    ],
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/config/jest/style-mock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
};
