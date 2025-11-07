import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    dir: 'tests'
  },
  resolve: {
    alias: {
      '@': '/Users/dilleuh/Coding/Vocal Ambitus/src',
      '@db': '/Users/dilleuh/Coding/Vocal Ambitus/db'
    }
  }
});

