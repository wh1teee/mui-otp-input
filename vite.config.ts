import { resolve } from 'node:path'
import { configDefaults, defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  test: {
    environment: 'jsdom',
    globals: true,
    exclude: [...configDefaults.exclude, '**/dist/**', 'tests/browser/**']
  },
  resolve: {
    alias: {
      '@assets': resolve(import.meta.dirname, './src/assets'),
      '@shared': resolve(import.meta.dirname, './src/shared'),
      '@components': resolve(import.meta.dirname, './src/components')
    }
  },
  plugins: [react()]
})
