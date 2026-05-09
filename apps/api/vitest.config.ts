import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globalSetup: './src/__tests__/setup.ts',
    environment: 'node',
    reporters: ['verbose'],
    testTimeout: 15000,
    hookTimeout: 30000,
    include: ['src/__tests__/**/*.test.ts'],
    // Run all test files sequentially to avoid SQLite locking
    fileParallelism: false,
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
  },
});
