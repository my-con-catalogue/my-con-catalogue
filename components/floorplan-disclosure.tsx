'use client'

import type { ReactNode } from 'react'
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
  return (
    <section id={id} className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10">
      <details open className="group">
        <summary className="mb-4 flex cursor-pointer list-none items-start justify-between gap-4 [&::-webkit-details-marker]:hidden">
          <span>
            <span className="block text-3xl font-extrabold tracking-tight">{title}</span>
            <span className="mt-1 block text-sm text-muted-foreground">{description}</span>
          </span>
          <span className="inline-flex shrink-0 items-center gap-2 rounded-full border border-input bg-card px-3 py-2 text-sm font-semibold">
            <span className="group-open:hidden">Show map</span>
            <span className="hidden group-open:inline">Hide map</span>
            <ChevronDown className="size-4 transition-transform group-open:rotate-180" aria-hidden="true" />
          </span>
        </summary>
        <div>{children}</div>
      </details>
    </section>
  )
}
