'use client'

import { useEffect, useRef, useState, type MouseEvent, type ReactNode } from 'react'
import Link from 'next/link'
import { Minus, Plus, RotateCcw, X } from 'lucide-react'
import { CatalogueCover } from '@/components/catalogue-cover'
import type { CatalogueEntry } from '@/lib/queries'

export function FloorplanViewer({ entries, children }: { entries: readonly CatalogueEntry[]; children: ReactNode }) {
  const viewportRef = useRef<HTMLDivElement>(null)
  const [zoom, setZoom] = useState(1)
  const [selected, setSelected] = useState<CatalogueEntry | null>(null)

  useEffect(() => {
    const canvas = viewportRef.current?.querySelector<HTMLElement>('[data-floorplan-canvas]')
    if (canvas) canvas.style.width = `${zoom * 100}%`
  }, [zoom])

  useEffect(() => {
    if (!selected) return
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelected(null) }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [selected])

  const handleMapClick = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return
    const anchor = (event.target as Element).closest<HTMLAnchorElement>('[data-floorplan-canvas] a[href*="/catalogues/"]')
    if (!anchor) return
    const path = new URL(anchor.href, window.location.href).pathname
    const match = path.match(/^\/events\/([^/]+)\/catalogues\/(\d+)\/?$/)
    if (!match) return
    const entry = entries.find((item) => item.eventSlug === match[1] && item.id === Number(match[2]))
    if (!entry) return
    event.preventDefault()
    setSelected(entry)
  }

  return <div className="relative">
    <div ref={viewportRef} onClick={handleMapClick} className="max-h-[82vh] overflow-auto rounded-2xl border border-border bg-card">
      {children}
    </div>
    <div role="group" aria-label="Floorplan zoom controls" className="absolute right-3 top-3 z-20 flex items-center gap-1 rounded-xl border border-border bg-card/95 p-1 shadow-lg backdrop-blur">
      <button type="button" aria-label="Zoom out" title="Zoom out" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, Math.round((value - 0.25) * 100) / 100))} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><Minus className="size-4" /></button>
      <span className="min-w-12 text-center text-xs font-semibold tabular-nums">{Math.round(zoom * 100)}%</span>
      <button type="button" aria-label="Zoom in" title="Zoom in" disabled={zoom >= 2.5} onClick={() => setZoom((value) => Math.min(2.5, Math.round((value + 0.25) * 100) / 100))} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><Plus className="size-4" /></button>
      <button type="button" aria-label="Reset zoom" title="Reset zoom" disabled={zoom === 1} onClick={() => setZoom(1)} className="rounded-lg p-2 hover:bg-muted disabled:opacity-40"><RotateCcw className="size-4" /></button>
    </div>
    {selected && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/55 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelected(null) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="floorplan-catalogue-title" className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <header className="flex items-start justify-between gap-4 border-b border-border p-4 sm:p-5">
          <div className="min-w-0"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Booth {selected.booth}</p><h2 id="floorplan-catalogue-title" className="mt-1 truncate text-xl font-extrabold">{selected.artistName}</h2></div>
          <button type="button" aria-label="Close catalogue preview" onClick={() => setSelected(null)} className="shrink-0 rounded-full border border-input p-2 hover:bg-muted"><X className="size-4" /></button>
        </header>
        <div className="overflow-y-auto p-4 sm:p-5"><CatalogueCover entry={selected} /></div>
        <footer className="flex justify-end border-t border-border p-4">
          <Link href={`/events/${selected.eventSlug}/catalogues/${selected.id}`} className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90">Open full catalogue</Link>
        </footer>
      </section>
    </div>}
  </div>
}
