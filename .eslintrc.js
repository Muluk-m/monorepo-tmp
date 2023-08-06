const OFF = 0
const WARN = 1
const ERROR = 2

module.exports = {
  root: true,
  env: {
    browser: true,
    es6: true,
    node: true,
  },
  extends: [
    'airbnb-base',
    'plugin:vue/recommended',
    'plugin:prettier/recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaFeatures: {
      impliedStrict: true,
    },
    ecmaVersion: 12,
    sourceType: 'module',
  },
  plugins: ['@typescript-eslint', 'prettier', 'vue'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.ts', '.js', '.json', '.vue'],
      },
    },
  },
  rules: {
    'import/extensions': OFF,
    'import/prefer-default-export': OFF,
    'import/no-unresolved': OFF,
    'import/no-dynamic-require': OFF,
    '@typescript-eslint/no-non-null-assertion': OFF,
    '@typescript-eslint/no-empty-function': WARN,
    '@typescript-eslint/ban-types': OFF,
    '@typescript-eslint/explicit-function-return-type': OFF,
    '@typescript-eslint/explicit-module-boundary-types': OFF,
    '@typescript-eslint/no-explicit-any': OFF,
    '@typescript-eslint/no-unused-vars': [WARN, { args: 'all', argsIgnorePattern: '^_' }],
    'no-param-reassign': OFF,
    'vue/no-v-model-argument': OFF,
    'import/no-relative-packages': OFF,
    'vue/no-v-html': OFF,
    'lines-between-class-members': OFF,
    'consistent-return': OFF,
    'func-names': OFF,
    'no-empty': OFF,
    'default-case': OFF,
    'linebreak-style': [ERROR, 'unix'],
    camelcase: OFF,
    quotes: [ERROR, 'single'],
    'no-unused-expressions': WARN,
    'no-template-curly-in-string': OFF,
    'import/no-extraneous-dependencies': OFF,
    'no-plusplus': OFF,
    'no-console': OFF,
    'no-useless-constructor': OFF,
    'class-methods-use-this': OFF,
    'jsx-quotes': [ERROR, 'prefer-single'],
    'global-require': OFF,
    'no-use-before-define': OFF,
    'no-restricted-syntax': OFF,
    'no-continue': OFF,
    'no-shadow': OFF,
  },
}
