/* eslint-env node */
module.exports = {
  root: true,
  env: { browser: true, es2022: true, node: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
    'prettier',
  ],
  // privateUniversities.js reads ./private.json with an import attribute, which
  // this parser version cannot read; the file is type-checked by Vite and Node.
  ignorePatterns: ['dist', 'node_modules', 'coverage', 'public', 'src/mocks/seed/privateUniversities.js'],
  settings: { react: { version: 'detect' } },
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  rules: {
    'react/prop-types': 'off',
    'no-unused-vars': ['warn', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
}
