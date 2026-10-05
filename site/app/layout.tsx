import { AppRouterCacheProvider } from '@mui/material-nextjs/v15-appRouter'
import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import type { ReactNode } from 'react'

import './globals.css'
import { Providers } from './providers'

const configuredSiteUrl = process.env.NEXT_PUBLIC_DOCS_URL

// Self-hosted at build time: no runtime request to a font CDN.
const sans = Geist({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-sans'
})
const mono = Geist_Mono({
  display: 'swap',
  subsets: ['latin'],
  variable: '--font-mono'
})

export const viewport: Viewport = {
  colorScheme: 'light dark',
  themeColor: [
    { color: '#ffffff', media: '(prefers-color-scheme: light)' },
    { color: '#0a1210', media: '(prefers-color-scheme: dark)' }
  ]
}

export const metadata: Metadata = {
  title: 'OTP Input — React, Material UI, Base UI and shadcn',
  description:
    'Documentation, interactive playground, and migration guide for @wh1teee/mui-otp-input, an accessible one-time code input for React.',
  ...(configuredSiteUrl
    ? {
        alternates: { canonical: '/' },
        metadataBase: new URL(configuredSiteUrl),
        openGraph: {
          description:
            'Accessible one-time code input for Material UI, Base UI and shadcn.',
          title: 'MUI OTP Input documentation',
          type: 'website' as const,
          url: '/'
        }
      }
    : {})
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <AppRouterCacheProvider>
          <Providers>{children}</Providers>
        </AppRouterCacheProvider>
      </body>
    </html>
  )
}
