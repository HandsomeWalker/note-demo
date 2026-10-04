/** @type {import('eslint').UserConfig} */
import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import prettier from 'eslint-plugin-prettier';

export default [
  {
    ignores: ['dist'],
  },
  {
    files: ['**/*.{js,cjs,ts,jsx,tsx}'],
    extends: [js.configs.recommended, react.configs.recommended, reactHooks.configs.recommended],
    plugins: [prettier, react, reactRefresh],
    processor: prettier.processor,
    languageOptions: {
      extensions: ['.js', '.cjs', '.ts', '.tsx'],
      parserOptions: {
        ecmaVersion: 'latest',
        webpack: true,
        jsxPragma: 'React',
        ecmaFeatures: { jsx: true },
      },
      globals: {
        ...globals.browser,
        ...globals.node,
      },
    },
    settings: {
      react: { version: 'detect' },
    },
    rules: {
      ...prettier.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs['jsx-runtime'].rules,
      ...reactHooks.configs.recommended.rules,
      'prettier/prettier': 'error',
      'react/refresh': 'off',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },
];
