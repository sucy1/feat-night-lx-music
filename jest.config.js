module.exports = {
  preset: 'react-native',
  testMatch: ['**/__tests__/**/*.test.{ts,tsx}'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  setupFiles: [
    '<rootDir>/jest.setup.js',
  ],
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-native-community|react-native-pager-view|@react-native-async-storage)/)',
  ],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/store/playlist/**/*.{ts,tsx}',
    'src/core/playlist.{ts,tsx}',
    '!**/__tests__/**',
    '!**/node_modules/**',
  ],
  globals: {
    'ts-jest': {
      tsconfig: 'tsconfig.test.json',
    },
  },
}
