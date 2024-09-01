module.exports = {
  extends: [
      'eslint-config-prettier',
       require.resolve('@vercel/style-guide/eslint/node'),
      'eslint-config-turbo',
  ].map(require.resolve),
  ignorePatterns: ['node_modules/', 'dist/'],
  rules: {
    'import/no-default-export': 'off',
    'turbo/no-undeclared-env-vars': 'off',
    'new-cap': 'off',
    'no-console': 'off'
  },
};