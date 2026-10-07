'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, X } from 'lucide-react'
import { cn } from '@/lib/utils'

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/fan-cafes', label: 'Fan Cafes' },
  { href: '/artists', label: 'Artists' },
  { href: '/contact', label: 'Contact' },
  { href: '/disclaimer', label: 'Disclaimer' },
]

export function SiteHeader() {
  const pathname = usePathname()
  const [open, setOpen] = useState(false)

  const isActive = (href: string) => (href === '/' ? pathname === '/' : pathname.startsWith(href))

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
        <Link href="/" className="flex items-center gap-2" onClick={() => setOpen(false)}>
          <span
            aria-hidden="true"
            className="flex size-9 items-center justify-center rounded-lg bg-primary font-heading text-sm font-bold text-primary-foreground"
          >
            MCC
          </span>
          <span className="font-heading text-base font-bold leading-tight">
            Malaysia Convention
            <span className="block text-xs font-medium text-muted-foreground">Catalogue</span>
          </span>
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'rounded-full px-3 py-2 text-sm font-medium transition-colors hover:bg-muted',
                    isActive(link.href) && 'bg-foreground text-background hover:bg-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <button
          type="button"
          className="flex size-10 items-center justify-center rounded-lg border border-border lg:hidden"
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X className="size-5" /> : <Menu className="size-5" />}
          <span className="sr-only">{open ? 'Close menu' : 'Open menu'}</span>
        </button>
      </div>

      {open && (
        <nav id="mobile-nav" aria-label="Mobile" className="border-t border-border lg:hidden">
          <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            {NAV_LINKS.map((link) => (
              <li key={link.href}>
                <Link
                  href={link.href}
                  onClick={() => setOpen(false)}
                  aria-current={isActive(link.href) ? 'page' : undefined}
                  className={cn(
                    'block rounded-lg px-3 py-2.5 font-medium hover:bg-muted',
                    isActive(link.href) && 'bg-foreground text-background hover:bg-foreground',
                  )}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  )
}
