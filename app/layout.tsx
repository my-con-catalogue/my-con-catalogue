import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, DM_Sans } from 'next/font/google'
import { SiteHeader } from '@/components/site-header'
import { SiteFooter } from '@/components/site-footer'
import './globals.css'

const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage' })
const dmSans = DM_Sans({ subsets: ['latin'], variable: '--font-dm-sans' })

export const metadata: Metadata = {
  title: {
    default: 'Malaysia Convention Catalogue',
    template: '%s | Malaysia Convention Catalogue',
  },
  description:
    'my.concatalogue — an archive of Artist Alleys, catalogues, stamp rallies and fan cafes from conventions across Malaysia.',
  icons: {
    icon: [
      { url: '/icon-light-32x32.png', media: '(prefers-color-scheme: light)' },
      { url: '/icon-dark-32x32.png', media: '(prefers-color-scheme: dark)' },
      { url: '/icon.svg', type: 'image/svg+xml' },
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
        <SiteHeader />
        <main className="flex-1">{children}</main>
        <SiteFooter />
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}
