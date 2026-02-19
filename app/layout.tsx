import type { Metadata, Viewport } from 'next'
import { Plus_Jakarta_Sans } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import { QueryProvider } from '@/components/QueryProvider'
import Footer from '@/components/Footer'
import PerformanceMonitor from '@/components/PerformanceMonitor'
import KeyboardShortcuts from '@/components/KeyboardShortcuts'

const font = Plus_Jakarta_Sans({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Strava Dashboard - Your Personal Activity Tracker',
  description: 'Comprehensive Strava activity dashboard with analytics, maps, goals, and more',
  keywords: 'Strava, fitness, running, cycling, activities, dashboard, analytics',
  authors: [{ name: 'Strava Dashboard' }],
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#FC4C02',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Strava Dashboard" />
      </head>
              <body className={`${font.className} flex flex-col min-h-screen bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50`}>
                <ThemeProvider>
                  <QueryProvider>
                  <KeyboardShortcuts />
                  <PerformanceMonitor />
                  <div className="flex-1">
                    {children}
                  </div>
                  <Footer />
                  </QueryProvider>
                </ThemeProvider>
              </body>
    </html>
  )
}
