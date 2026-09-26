import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-sans',
});

export const metadata: Metadata = {
  title: {
    default: 'RefundRadar - Automated Refund Abuse Detection',
    template: '%s | RefundRadar',
  },
  description: 'Automated refund abuse detector for mobile app developers using RevenueCat. Detect fraud, protect revenue, and automate entitlement revocation.',
  keywords: ['refund', 'fraud detection', 'RevenueCat', 'mobile apps', 'entitlement management', 'SaaS'],
  authors: [{ name: 'RefundRadar' }],
  creator: 'RefundRadar',
  publisher: 'RefundRadar',
  robots: 'index, follow',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://app.refundradar.io',
    siteName: 'RefundRadar',
    title: 'RefundRadar - Automated Refund Abuse Detection',
    description: 'Automated refund abuse detector for mobile app developers using RevenueCat.',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'RefundRadar Dashboard',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'RefundRadar - Automated Refund Abuse Detection',
    description: 'Automated refund abuse detector for mobile app developers using RevenueCat.',
    images: ['/og-image.png'],
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/site.webmanifest',
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#FFFFFF' },
    { media: '(prefers-color-scheme: dark)', color: '#0F1116' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://api.revenuecat.com" />
        <link rel="preconnect" href="https://api.resend.com" />
        <link rel="dns-prefetch" href="https://app.refundradar.io" />
      </head>
      <body className={`${inter.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}