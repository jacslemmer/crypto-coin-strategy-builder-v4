import { defineConfig } from 'vitest/config';
import { resolve } from 'path';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: ['./tests/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'dist/',
        'coverage/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/index.ts'
      ]
    }
  },
  resolve: {
    alias: {
      '@app': resolve(__dirname, './src/app'),
      '@domain': resolve(__dirname, './src/domain'),
      '@infra': resolve(__dirname, './src/infra'),
      '@ports': resolve(__dirname, './src/ports'),
      '@tests': resolve(__dirname, './tests')
    }
  }
});





