import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import { CatalogueScrollRestoration } from '@/components/catalogue-scroll-restoration'
import './globals.css'

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })
const ANALYTICS_SAMPLE_KEY = 'mcc:vercel-analytics:last-sent'
const ANALYTICS_SAMPLE_INTERVAL = 7 * 24 * 60 * 60 * 1000

function sampleAnalyticsOncePerWeek(event: BeforeSendEvent) {
  // Keep one page view per browser storage context each week, instead of
  // sending every navigation. If browser storage is unavailable, fail closed.
  if (typeof window === 'undefined') return null
  try {
    const previous = Number(window.localStorage.getItem(ANALYTICS_SAMPLE_KEY))
    if (Number.isFinite(previous) && previous > 0 && Date.now() - previous < ANALYTICS_SAMPLE_INTERVAL) return null
    window.localStorage.setItem(ANALYTICS_SAMPLE_KEY, String(Date.now()))
    return event
  } catch {
    return null
  }
}

export const metadata: Metadata = {
  title: {
    default: 'Malaysia Convention Catalogue',
    template: '%s | Malaysia Convention Catalogue',
  },
  description:
    'my.concatalogue — an archive of Artist Alleys, catalogues, stamp rallies and fan events from conventions across Malaysia.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#f8f4ec',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className={`${bricolage.variable} ${dmSans.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <CatalogueScrollRestoration />
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        <Analytics beforeSend={sampleAnalyticsOncePerWeek} />
      </body>
    </html>
  )
}
