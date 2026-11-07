'use client'

import type { ReactNode } from 'react'
import { useEffect, useState } from 'react'
import { ChevronDown } from 'lucide-react'

export function FloorplanDisclosure({
  id,
  title,
  description,
  children,
}: {
  id: string
  title: string
  description: string
  children: ReactNode
}) {
  const [isOpen, setIsOpen] = useState(true)
  const storageKey = `mcc:floorplan:${id}`

  useEffect(() => {
    try {
      setIsOpen(window.localStorage.getItem(storageKey) !== 'hidden')
    } catch {
      // Keep the map open if browser storage is unavailable.
    }
  }, [storageKey])

  const toggleOpen = () => {
    const nextOpen = !isOpen
    setIsOpen(nextOpen)
    try {
      window.localStorage.setItem(storageKey, nextOpen ? 'open' : 'hidden')
    } catch {
      // The disclosure remains usable for the current page without storage.
    }
  }

  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10">
      <div className="group">
        <div className="mb-4 flex items-start justify-between gap-4">
          <span>
            <span className="block text-3xl font-extrabold tracking-tight">{title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
          </span>
          <button
            type="button"
            aria-expanded={isOpen}
            aria-controls={`floorplan-panel-${id}`}
            onClick={toggleOpen}
            className="inline-flex shrink-0 items-center gap-2 rounded-full border border-input bg-card px-3 py-2 text-sm font-semibold"
          >
            {isOpen ? 'Hide map' : 'Show map'}
            <ChevronDown className={`size-4 transition-transform ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
          </button>
        </div>
        {isOpen && <div id={`floorplan-panel-${id}`}>{children}</div>}
      </div>
    </section>
  )
}
