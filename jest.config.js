const esModules = ['@middy'].join('|');
module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test'],
  testMatch: ['**/*.test.ts'],
  extensionsToTreatAsEsm: ['.ts'],
  transformIgnorePatterns: [`node_modules/(?!${esModules})`],
  // transformIgnorePatterns: ['/node_modules/(?!(@middy/core)/)'],
  moduleNameMapper: {
    '^@middy/core$': '<rootDir>/node_modules/@middy/core',
  },
  transform: {
    '^.+\\.ts?$': [
      'ts-jest',
      {
        useESM: true,
      },
    ],
  },
};
