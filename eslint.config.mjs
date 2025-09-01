// For more info, see https://github.com/storybookjs/eslint-plugin-storybook#configuration-flat-config-format
import storybook from 'eslint-plugin-storybook'
import hooksConfig from '@viclafouch/eslint-config-viclafouch/hooks.mjs'
import importsConfig from '@viclafouch/eslint-config-viclafouch/imports.mjs'
import baseConfig from '@viclafouch/eslint-config-viclafouch/index.mjs'
import prettierConfig from '@viclafouch/eslint-config-viclafouch/prettier.mjs'
import reactConfig from '@viclafouch/eslint-config-viclafouch/react.mjs'
import typescriptConfig from '@viclafouch/eslint-config-viclafouch/typescript.mjs'

/**
 * @type {import("eslint").Linter.Config}
 */
export default [
  ...baseConfig,
  ...reactConfig,
  ...hooksConfig,
  ...importsConfig,
  ...typescriptConfig,
  ...prettierConfig,
  {
    ignores: [
      '**/node_modules/**',
      '**/dist/**',
      '**/docs/build/**',
      'docs/.docusaurus/**/**'
    ]
  },
  ...storybook.configs['flat/recommended']
]
