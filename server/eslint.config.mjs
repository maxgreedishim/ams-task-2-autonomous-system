import tsParser from '@typescript-eslint/parser';

export default [{
  files: ['**/*.ts'],
  languageOptions: { parser: tsParser, ecmaVersion: 'latest', sourceType: 'module', globals: { process: 'readonly', console: 'readonly' } },
  rules: {
    'no-console': 'off',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    'no-undef': 'error',
  },
}];
