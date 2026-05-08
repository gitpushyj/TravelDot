module.exports = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.(ts|tsx|js|jsx)$': 'babel-jest',
  },
  testMatch: ['**/?(*.)+(test).(ts|tsx)'],
  testPathIgnorePatterns: [
    '/node_modules/',
    '/ios/',
    '/android/',
    '/.claude/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/',
    '<rootDir>/ios/',
    '<rootDir>/android/',
  ],
  watchPathIgnorePatterns: ['<rootDir>/.claude/'],
  haste: {
    forceNodeFilesystemAPI: true,
  },
};
