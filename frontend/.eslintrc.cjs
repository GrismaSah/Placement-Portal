module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react-refresh/only-export-components': [
      'warn',
      { allowConstantExport: true },
    ],

    // This project does not use the `prop-types` package — it isn't even a
    // dependency, so the rule could only ever be satisfied by adding a
    // runtime type layer nobody maintains. Leaving it on meant `npm run lint`
    // reported hundreds of unfixable errors and drowned the real ones
    // (unused vars, missing hook deps), so it never got run. Off, so lint is
    // a signal again.
    'react/prop-types': 'off',
  },
}