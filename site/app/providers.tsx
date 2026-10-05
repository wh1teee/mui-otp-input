'use client'

import { CssBaseline, ThemeProvider } from '@mui/material'
import { createTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'

const docsTheme = createTheme({
  // Follow the operating-system preference; the CSS tokens do the same.
  // Surfaces match the docs CSS tokens so MUI and hand-styled regions agree.
  colorSchemes: {
    dark: {
      palette: {
        background: { default: '#0a1210', paper: '#111c19' },
        primary: { main: '#6ee7b7' }
      }
    },
    light: {
      palette: {
        background: { default: '#ffffff', paper: '#ffffff' },
        primary: { main: '#047857' }
      }
    }
  },
  cssVariables: { colorSchemeSelector: 'media' },
  components: {
    MuiButton: { styleOverrides: { root: { textTransform: 'none' } } },
    MuiToggleButton: { styleOverrides: { root: { textTransform: 'none' } } }
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: 'var(--font-sans), ui-sans-serif, system-ui, sans-serif'
  }
})

export function Providers({ children }: { children: ReactNode }) {
  return (
    <ThemeProvider theme={docsTheme}>
      <CssBaseline />
      {children}
    </ThemeProvider>
  )
}
