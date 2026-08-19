// File: tests/jest.config.js
module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: true,
  forceExit: true,
  detectOpenHandles: true,
  // Chạy theo thứ tự file (không parallel)
  maxWorkers: 1,
  // Tự động chạy setup trước mỗi suite
  globalSetup: './helpers/globalSetup.js',
  globalTeardown: './helpers/globalTeardown.js',
  // Thứ tự test
  testSequencer: './helpers/testSequencer.js',
};
