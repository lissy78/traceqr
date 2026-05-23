import type { Metadata, Viewport } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

// =====================================================
// FONT CONFIGURATION
// Load Geist fonts for modern, clean typography
// =====================================================

const geistSans = Geist({ 
  subsets: ['latin'],
  variable: '--font-geist-sans',
});

const geistMono = Geist_Mono({ 
  subsets: ['latin'],
  variable: '--font-geist-mono',
});

// =====================================================
// METADATA
// SEO and PWA configuration for TraceQR
// =====================================================

export const metadata: Metadata = {
  title: 'TraceQR - Rastrear, Reciclar, Ganar',
  description: 'Plataforma de trazabilidad de reciclaje. Escanea envases, gana puntos verdes y canjea recompensas mientras cuidas el planeta.',
  generator: 'v0.app',
  manifest: '/manifest.json',
  keywords: ['reciclaje', 'trazabilidad', 'QR', 'puntos verdes', 'medio ambiente', 'sostenibilidad'],
  authors: [{ name: 'TraceQR - Semillero RREDSI' }],
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'TraceQR',
  },
  formatDetection: {
    telephone: false,
  },
  openGraph: {
    type: 'website',
    siteName: 'TraceQR',
    title: 'TraceQR - Rastrear, Reciclar, Ganar',
    description: 'Plataforma de trazabilidad de reciclaje. Escanea envases, gana puntos verdes y canjea recompensas.',
  },
}

// =====================================================
// VIEWPORT
// Mobile-optimized viewport settings for PWA
// =====================================================

export const viewport: Viewport = {
  themeColor: '#5eead4',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

// =====================================================
// ROOT LAYOUT
// Main layout wrapper for the entire application
// =====================================================

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html 
      lang="es" 
      className={`${geistSans.variable} ${geistMono.variable} bg-background`}
    >
      <head>
        {/* PWA theme color for status bar */}
        <meta name="theme-color" content="#5eead4" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="TraceQR" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="font-sans antialiased min-h-screen">
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
