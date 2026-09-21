import { defineConfig } from 'tsdown'

const externalDependencies = [
  '@base-ui/react',
  '@emotion/react',
  '@emotion/styled',
  '@mui/material',
  'react',
  'react-dom',
  'react-hook-form'
]

const browserTarget = ['Chrome117', 'Edge121', 'Firefox121', 'Safari17']

export default defineConfig([
  {
    clean: true,
    define: {
      'process.env.NODE_ENV': 'process.env.NODE_ENV'
    },
    dts: true,
    entry: {
      index: 'src/index.ts',
      'base-ui': 'src/base-ui.tsx',
      shadcn: 'src/shadcn.ts',
      'react-hook-form': 'src/react-hook-form.tsx',
      'base-ui/react-hook-form': 'src/base-ui-react-hook-form.tsx'
    },
    deps: {
      neverBundle: externalDependencies
    },
    format: ['esm'],
    outDir: 'dist',
    platform: 'browser',
    sourcemap: true,
    target: browserTarget
  },
  {
    clean: false,
    dts: true,
    entry: {
      headless: 'src/headless.ts'
    },
    deps: {
      neverBundle: externalDependencies
    },
    format: ['esm'],
    outDir: 'dist',
    platform: 'neutral',
    sourcemap: true,
    target: 'es2024'
  }
])
