import withNuxt from './.nuxt/eslint.config.mjs'
import vitestPlugin from '@vitest/eslint-plugin'

export default withNuxt([
  {
    rules: {
      'no-console': 'off',
      'no-var': 'error',
      'prefer-const': 'off',
      indent: ['error', 2, { SwitchCase: 1 }],
      quotes: ['error', 'single', { avoidEscape: true }],
      semi: ['error', 'never'],
      'comma-dangle': ['error', 'never'],
      'object-curly-spacing': ['error', 'always'],
      'array-bracket-spacing': ['error', 'never'],
      'space-before-function-paren': ['error', 'always'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
      'key-spacing': ['error', { beforeColon: false, afterColon: true }],
      'arrow-spacing': ['error', { before: true, after: true }],
      'max-len': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': ['error', {
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '.*'
      }],
      '@typescript-eslint/no-unused-expressions': 'error',
      'no-empty': 'error',
      'vue/no-v-html': 'off'
    },
    ignores: ['.nuxt/', 'dist/', 'node_modules/', './.output/']
  },
  {
    files: ['nuxt.config.js', 'nuxt.config.ts', 'eslint.config.mjs'],
    rules: {
      'no-undef': 'off'
    }
  },
  {
    files: ['tests/**/*.js', 'tests/**/*.ts'],
    plugins: {
      vitest: vitestPlugin
    },
    languageOptions: {
      globals: {
        ...vitestPlugin.environments.env.globals
      }
    },
    rules: {
      'no-console': 'off',
      'no-unused-vars': 'off',
      '@typescript-eslint/no-unused-vars': 'off',
      'vitest/valid-describe-callback': 'error',
      'vitest/no-disabled-tests': 'off',
      'vitest/no-focused-tests': 'error'
    }
  }
])
