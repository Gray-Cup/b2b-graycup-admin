import { clx } from "@medusajs/ui"
import './global.css'
import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Toaster } from '@medusajs/ui'
import { ThemeToggle } from './components/theme-toggle'

export const metadata: Metadata = {
  title: {
    default: 'GrayCup Admin',
    template: '%s | GrayCup Admin',
  },
  description: 'GrayCup B2B Admin Panel',
  robots: {
    index: false,
    follow: false,
  },
}

const cx = (...classes: (string | undefined)[]) => classes.filter(Boolean).join(' ')

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="en"
      data-mode="light"
      style={{ colorScheme: 'light' }}
      suppressHydrationWarning
      className={cx(
        'light',
        GeistSans.variable,
        GeistMono.variable
      )}
    >
      <body className="antialiased bg-ui-bg-subtle">
        {children}
        <ThemeToggle />
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  )
}
