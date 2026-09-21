// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'
import {
  hooksConfig,
  importsConfig,
  jsxA11yConfig,
  prettierConfig,
  reactConfig,
  testingLibraryConfig,
  typescriptConfig
} from '@viclafouch/eslint-config-viclafouch'

/**
 * @type {import("eslint").Linter.Config}
 */
export default [
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/.vitest/**',
      '**/.docusaurus/**',
      '**/build/**',
      '**/storybook-static/**',
      'scripts/**',
      'docs/**'
    ]
  },
  ...typescriptConfig,
  ...reactConfig,
  ...hooksConfig,
  ...importsConfig,
  ...jsxA11yConfig,
  ...testingLibraryConfig,
  ...prettierConfig,
  {
    rules: {
      '@typescript-eslint/consistent-type-definitions': 'off',
      complexity: ['error', 25],
      'no-restricted-syntax': [
        'error',
        {
          selector: 'ImportDeclaration[source.value="react"] ImportSpecifier',
          message:
            'Use React.useState, React.ReactNode, etc. instead of destructuring React imports.'
        },
        {
          selector:
            'ImportDeclaration[source.value="react-dom"] ImportSpecifier',
          message:
            'Use ReactDOM.createRoot, etc. instead of destructuring ReactDOM imports.'
        }
      ],
      'prefer-arrow-callback': 'off',
      'react/function-component-definition': 'off',
      'unicorn/filename-case': 'off'
    }
  },
  {
    files: [
      'src/base-ui.tsx',
      'src/mui.tsx',
      'src/internal/**/*.tsx',
      'src/**/*.test.tsx',
      'tests/browser/**/*.tsx'
    ],
    rules: {
      'jsx-a11y/no-autofocus': 'off',
      'react-hooks/immutability': 'off',
      'react-hooks/refs': 'off',
      'react/jsx-no-leaked-render': 'off'
    }
  },
  {
    files: ['src/mui.tsx'],
    rules: {
      'consistent-return': 'off',
      'max-lines-per-function': 'off',
      'max-params': 'off'
    }
  },
  {
    files: ['src/internal/otp-behavior-root.tsx'],
    rules: {
      'arrow-body-style': 'off',
      'consistent-return': 'off',
      'no-nested-ternary': 'off',
      'padding-line-between-statements': 'off',
      'react/hook-use-state': 'off',
      'unicorn/no-useless-undefined': 'off'
    }
  },
  {
    files: [
      '**/*.test.tsx',
      '**/*.test.ts',
      '**/testUtils/**',
      'tests/browser/**'
    ],
    rules: {
      'max-lines-per-function': 'off',
      'react/button-has-type': 'off',
      'testing-library/no-node-access': 'off',
      'testing-library/prefer-screen-queries': 'off'
    }
  },
  ...storybook.configs['flat/recommended']
]
