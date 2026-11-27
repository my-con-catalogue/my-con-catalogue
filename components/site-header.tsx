'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState } from 'react'
import { Menu, UserRound, X } from 'lucide-react'
import Image from 'next/image'
import { cn } from '@/lib/utils'

export const NAV_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/events', label: 'Events' },
  { href: '/fan-events', label: 'Fan Events' },
  { href: '/interest-check', label: 'Interest Check' },
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
          <Image
            src="/branding/mycc-logo-light.png"
            alt="myCC logo"
            width={58}
            height={45}
            priority
            className="h-10 w-[52px] shrink-0 object-contain sm:h-11 sm:w-[58px]"
          />
          <span className="font-heading text-base font-bold leading-tight">
            Malaysia Convention
            <span className="block text-xs font-medium text-muted-foreground">Catalogue</span>
          </span>
        </Link>

        <div className="flex items-center gap-2">
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

          <details className="group relative">
            <summary
              title="Account options"
              aria-label="Open account options"
              className={cn(
                'flex size-10 shrink-0 cursor-pointer list-none items-center justify-center rounded-lg border border-border transition-colors hover:bg-muted [&::-webkit-details-marker]:hidden',
                isActive('/account') && 'bg-foreground text-background hover:bg-foreground',
              )}
            >
              <UserRound className="size-5" aria-hidden="true" />
              <span className="sr-only">Account options</span>
            </summary>
            <div className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-border bg-background p-2 shadow-lg">
              <Link href="/account?mode=login" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false }} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Log in</Link>
              <Link href="/account?mode=create" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false }} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Sign up</Link>
              <div className="my-1 border-t border-border" />
              <Link href="/account/calendar" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false }} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Personal calendar</Link>
              <Link href="/account/shared-lists" onClick={(event) => { const menu = event.currentTarget.closest('details'); if (menu) menu.open = false }} className="block rounded-lg px-3 py-2 text-sm font-medium hover:bg-muted">Shared lists</Link>
            </div>
          </details>

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
