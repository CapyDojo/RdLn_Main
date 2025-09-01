import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts'],
    include: [
      'tests/unit/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/integration/**/*.{test,spec}.{js,ts,jsx,tsx}',
      'tests/performance/**/*.{test,spec}.{js,ts}',
      'tests/accuracy/**/*.{test,spec}.{js,ts}',
      'src/**/*.{test,spec}.{js,ts,jsx,tsx}'
    ],
    exclude: [
      'tests/e2e/**/*',
      'node_modules/**/*',
      'tests/archive/**/*',
    ],
    testTimeout: 30000, // 30 seconds max for any test (reduced from 120s OCR timeout)
    hookTimeout: 30000,
    // Re-enabled parallel execution (removed forced sequential from OCR config)
    reporter: ['verbose', 'json'],
    outputFile: {
      json: './test-results/test-results.json'
    },
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/coverage/**',
        '**/__mocks__/**',
        '**/types/**'
      ],
      thresholds: {
        global: {
          branches: 70,
          functions: 70,
          lines: 70,
          statements: 70
        },
        // Per-file thresholds for critical components
        'src/components/ProcessingDisplay.tsx': {
          branches: 90,
          functions: 90,
          lines: 90,
          statements: 90
        },
        'src/services/BackgroundLanguageLoader.ts': {
          branches: 85,
          functions: 85,
          lines: 85,
          statements: 85
        }
      },
      reportOnFailure: true,
      all: true,
      include: ['src/**/*.{ts,tsx}'],
      watermarks: {
        statements: [70, 85],
        functions: [70, 85],
        branches: [70, 85],
        lines: [70, 85]
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@tests': path.resolve(__dirname, './tests')
    }
  }
});
