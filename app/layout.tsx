import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/ThemeProvider'
import Footer from '@/components/Footer'
import PerformanceMonitor from '@/components/PerformanceMonitor'

const inter = Inter({ subsets: ['latin'] })

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
              <body className={`${inter.className} flex flex-col min-h-screen`}>
                <ThemeProvider>
                  <PerformanceMonitor />
                  <div className="flex-1">
                    {children}
                  </div>
                  <Footer />
                </ThemeProvider>
              </body>
    </html>
  )
}
