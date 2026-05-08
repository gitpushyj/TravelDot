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
    '/supabase/',
  ],
  modulePathIgnorePatterns: [
    '<rootDir>/.claude/',
    '<rootDir>/ios/',
    '<rootDir>/android/',
    '<rootDir>/supabase/',
  ],
  watchPathIgnorePatterns: ['<rootDir>/.claude/'],
  haste: {
    forceNodeFilesystemAPI: true,
  },
};
