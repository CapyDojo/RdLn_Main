import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: [
      'dist/**',
      'dist-electron-new/**',
      'public/**',
      '.venv/**',
      'src/styles/archive/**',
      'src/tests/**',
      'src/utils/*backup*.ts',
      'src/utils/*test_backup*.ts',
      'src/RetiredCode/**',
      'RetiredCode/**',
      'CSS Tests/**',
      'Prototypes/**',
      'archived-tauri/**',
      'tests/archive/**',
      'tests/archive/legacy/**',
      'ocrservice_old.ts',
      'debug_*',
      'debug_*.*',
    ],
  },
  // Base TS/React rules for application code
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      'react-hooks': reactHooks,
      'react-refresh': reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'react-refresh/only-export-components': [
        'warn',
        { allowConstantExport: true },
      ],
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-empty': 'warn',
      'prefer-const': 'warn',
    },
  },
  // Electron main/preload (CommonJS)
  {
    files: ['src-electron/**/*.cjs', 'src-electron/**/*.js'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: { ...globals.node },
      sourceType: 'script',
    },
  },
  // Node scripts (ESM because package.json has type: module)
  {
    files: ['scripts/**/*.js'],
    languageOptions: {
      ecmaVersion: 'latest',
      globals: { ...globals.node },
      sourceType: 'module',
    },
  },
  // Testing helpers under src/testing
  {
    files: ['src/testing/**/*.ts', 'src/testing/**/*.tsx'],
    rules: {
      '@typescript-eslint/no-namespace': 'off',
    },
  },
  // Utilities with specific regex needs
  {
    files: ['src/utils/paragraphFormatting_A.ts'],
    rules: {
      'no-useless-escape': 'off',
    },
  },
  // Tests: relax strict rules and add globals
  {
    files: [
      'tests/**/*.ts',
      'tests/**/*.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/*.spec.ts',
      '**/*.spec.tsx',
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.node,
        ...globals.browser,
        describe: 'readonly',
        it: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeAll: 'readonly',
        afterAll: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
        vi: 'readonly',
      },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      // Tests often call hooks/utilities outside components
      'react-hooks/rules-of-hooks': 'off',
    },
  },
  // Tooling configs (allow unused vars in signatures)
  {
    files: ['vite.config.ts'],
    rules: {
      '@typescript-eslint/no-unused-vars': 'off',
    },
  },
  // Utilities with intentional control-char regexes
  {
    files: ['src/utils/typeValidation.ts'],
    rules: {
      'no-control-regex': 'off',
      'no-useless-escape': 'off',
    },
  }
);
