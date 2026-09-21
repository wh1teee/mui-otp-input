import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { playwright } from '@vitest/browser-playwright'

type BrowserName = 'chromium' | 'firefox' | 'webkit'

function resolveBrowser(value: string | undefined): BrowserName {
  switch (value ?? 'chromium') {
    case 'chromium':
    case 'firefox':
    case 'webkit':
      return value ?? 'chromium'
    default:
      throw new Error(`Unsupported VITEST_BROWSER: ${value}`)
  }
}

const browser = resolveBrowser(process.env.VITEST_BROWSER)
const browserPort = Number(process.env.VITEST_BROWSER_PORT ?? 63_410)

if (!Number.isInteger(browserPort) || browserPort < 1 || browserPort > 65_535) {
  throw new Error('VITEST_BROWSER_PORT must be an available TCP port.')
}

export default defineConfig({
  optimizeDeps: {
    include: [
      '@base-ui/react/merge-props',
      '@base-ui/react/otp-field',
      '@emotion/react',
      '@emotion/styled',
      '@mui/material/Box',
      '@mui/material/TextField',
      '@mui/material/styles',
      'react',
      'react/jsx-runtime',
      'react-dom',
      'react-dom/client',
      'react-dom/server',
      'react-hook-form'
    ]
  },
  plugins: [react()],
  resolve: {
    alias: {
      '@assets': new URL('./src/assets/', import.meta.url).pathname,
      '@components': new URL('./src/components/', import.meta.url).pathname,
      '@shared': new URL('./src/shared/', import.meta.url).pathname
    },
    dedupe: [
      '@emotion/react',
      '@emotion/styled',
      '@mui/material',
      '@mui/system',
      'react',
      'react-dom'
    ]
  },
  test: {
    api: {
      host: '127.0.0.1',
      port: browserPort,
      strictPort: true
    },
    fileParallelism: false,
    browser: {
      enabled: true,
      headless: true,
      instances: [{ browser }],
      provider: playwright(),
      viewport: { height: 844, width: 390 }
    },
    include: ['tests/browser/**/*.browser.test.tsx']
  }
})
