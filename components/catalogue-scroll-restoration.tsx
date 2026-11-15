'use client'

import { usePathname } from 'next/navigation'
import { useEffect } from 'react'

/** Restores the catalogue list position after returning from a detail route. */
export function CatalogueScrollRestoration() {
  const pathname = usePathname()

  useEffect(() => {
    const segments = pathname.split('/').filter(Boolean)
    if (segments.length !== 2 || segments[0] !== 'events') return

    const key = `mcc:catalogue-filters:${segments[1]}:return-scroll`
    let saved: string | null = null
    try {
      saved = window.sessionStorage.getItem(key)
    } catch {
      return
    }
    if (saved === null) return

    const position = Number(saved)
    if (!Number.isFinite(position)) {
      window.sessionStorage.removeItem(key)
      return
    }

    let attempts = 0
    let timer: number | undefined
    let cancelled = false
    const restore = () => {
      if (cancelled) return
      window.scrollTo({ top: position, left: 0, behavior: 'auto' })
      attempts += 1
      // Re-apply for a short settling window: Next may perform its own
      // scroll-to-top after this component's first restoration attempt.
      if (attempts >= 20) {
        window.sessionStorage.removeItem(key)
        return
      }
      timer = window.setTimeout(restore, 100)
    }

    // Keep trying while the event page hydrates and Next applies its own scroll.
    timer = window.setTimeout(restore, 0)
    return () => {
      cancelled = true
      if (timer !== undefined) window.clearTimeout(timer)
    }
  }, [pathname])

  return null
}
