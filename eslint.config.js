import firebaseRulesPlugin from '@firebase/eslint-plugin-security-rules';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default [
  {
    ignores: ['dist/**/*', 'functions/**/*', 'worker.js']
  },
  {
    files: ['firestore.rules'],
    plugins: {
      '@firebase/security-rules': firebaseRulesPlugin
    },
    rules: {
      ...firebaseRulesPlugin.configs['flat/recommended'].rules
    }
  },
  ...tseslint.configs.recommended.map(cfg => ({
    ...cfg,
    files: ['src/**/*.{ts,tsx}']
  })),
  {
    files: ['src/**/*.{ts,tsx}'],
    plugins: {
      'react-hooks': reactHooks
    },
    rules: {
      // --- Genuinely valuable, kept as errors ---
      'react-hooks/rules-of-hooks': 'error',

      // --- Useful signal, kept as warnings so they don't block ---
      'react-hooks/exhaustive-deps': 'warn',
      '@typescript-eslint/no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],

      // --- Permissive while the codebase is brought up to standard ---
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-empty-object-type': 'off',
      '@typescript-eslint/ban-ts-comment': 'off',

      // --- React Compiler-specific rules: not on the compiler, so disabled to avoid
      //     false positives on valid patterns (e.g. setting state inside effects). ---
      'react-hooks/purity': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/static-components': 'off',
      'react-hooks/set-state-in-effect': 'off',
      'react-hooks/set-state-in-render': 'off',
      'react-hooks/refs': 'off',
      'react-hooks/preserve-manual-memoization': 'off'
    }
  }
];
