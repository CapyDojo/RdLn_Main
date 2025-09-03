import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/testing/setup.ts'],
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/performance/**/*.{test,spec}.{js,ts}',
    ],
    exclude: [
      'tests/e2e/**/*',
      'tests/archive/**/*',
      'node_modules/**/*',
      'src/RetiredCode/**/*',
      '**/*.d.ts',
      '**/*.config.*',
    ],
    testTimeout: 10000, // 10 seconds for unit tests
    hookTimeout: 10000,
    reporter: ['verbose'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'tests/',
        'src/RetiredCode/',
        'src/testing/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/__mocks__/**',
        '**/types/**'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@/tests': path.resolve(__dirname, './tests')
    }
  }
});