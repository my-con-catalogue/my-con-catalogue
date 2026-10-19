'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { ArtistSocialLinks } from '@/components/artist-social-links'
import { getArtistSocialAccounts } from '@/lib/artist-socials'
import type { CatalogueEntry, CatalogueType } from '@/lib/queries'
import { cn } from '@/lib/utils'

function displayTag(tag: string) {
  return tag.toLocaleLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

function uniqueSorted(values: readonly (readonly string[])[]) {
  return [...new Set(values.flat())].sort((a, b) => a.localeCompare(b))
}

const CATALOGUES_PER_PAGE = 20
type SavedCatalogueFilters = {
  catalogueType?: CatalogueType
  query?: string
  fandoms?: unknown
  merch?: unknown
  stampRally?: unknown
  page?: number
}

function storedStringSet(value: unknown) {
  return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
}

function BoothNumberText({ value }: { value: string }) {
  const viewportRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [overflows, setOverflows] = useState(false)

  useEffect(() => {
    const viewport = viewportRef.current
    const text = textRef.current
    if (!viewport || !text) return
    const measure = () => setOverflows(text.getBoundingClientRect().width > viewport.clientWidth + 1)
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(text)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={viewportRef} title={value} className="block min-w-0 max-w-full overflow-hidden">
      <span className={cn('booth-number-track flex w-max whitespace-nowrap', overflows && 'booth-number-track-overflow')}>
        <span ref={textRef}>{value}</span>
        <span className="pl-8" aria-hidden="true">{value}</span>
      </span>
    </span>
  )
}

function FilterDropdown({
  label,
  options,
  selected,
  onToggle,
  searchable = false,
}: {
  label: string
  options: string[]
  selected: Set<string>
  onToggle: (value: string) => void
  searchable?: boolean
}) {
  const [search, setSearch] = useState('')
  if (options.length === 0) return null
  const visibleOptions = options.filter((option) => displayTag(option).toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()))
  const id = label.toLocaleLowerCase().replace(/[^a-z0-9]+/g, '-')

  return (
    <details className="group relative w-full sm:w-auto">
      <summary className={cn(
        'flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border bg-background px-3 py-2 text-sm font-semibold transition-colors hover:border-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden',
        selected.size > 0 ? 'border-foreground' : 'border-input',
      )}>
        <span>{label}{selected.size > 0 ? ` · ${selected.size}` : ''}</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 z-30 mt-2 w-full min-w-64 rounded-xl border border-border bg-card p-3 shadow-xl sm:min-w-72">
        {searchable && (
          <div className="relative mb-2">
            <label htmlFor={`filter-search-${id}`} className="sr-only">Search {label.toLowerCase()} tags</label>
            <Search className="pointer-events-none absolute left-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id={`filter-search-${id}`}
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder={`Find a ${label.toLowerCase()}...`}
              className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
        )}
        <p className="px-1 pb-2 text-xs text-muted-foreground">Choose any that apply</p>
        <ul className="max-h-60 space-y-1 overflow-y-auto">
          {visibleOptions.map((option) => {
            const active = selected.has(option)
            return (
              <li key={option}>
                <label className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-secondary">
                  <input type="checkbox" checked={active} onChange={() => onToggle(option)} className="size-4 accent-primary" />
                  <span className="min-w-0 flex-1">{displayTag(option)}</span>
                  {active && <Check className="size-4 text-primary" aria-hidden="true" />}
                </label>
              </li>
            )
          })}
          {visibleOptions.length === 0 && (
            <li className="px-2 py-3 text-sm text-muted-foreground">No matching tags.</li>
          )}
        </ul>
      </div>
    </details>
  )
}

function TagList({ tags, label, maxRows = 3, outlined = false }: { tags: readonly string[]; label: string; maxRows?: number; outlined?: boolean }) {
  const listRef = useRef<HTMLUListElement>(null)
  const [visibleCount, setVisibleCount] = useState(tags.length)
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    const list = listRef.current
    if (!list || expanded) return

    const measureRows = () => {
      const items = Array.from(list.children) as HTMLElement[]
      const rowTops = [...new Set(items.map((item) => Math.round(item.getBoundingClientRect().top)))].sort((a, b) => a - b)
      if (rowTops.length <= maxRows) return

      const lastVisibleRowTop = rowTops[maxRows - 1]
      const overflowIndex = items.slice(0, visibleCount).findIndex((item) => Math.round(item.getBoundingClientRect().top) > lastVisibleRowTop)
      if (overflowIndex >= 0) {
        setVisibleCount((current) => Math.min(current, overflowIndex))
        return
      }

      const moreButton = visibleCount < tags.length ? items[visibleCount] : undefined
      if (moreButton && Math.round(moreButton.getBoundingClientRect().top) > lastVisibleRowTop) {
        setVisibleCount((current) => Math.max(0, current - 1))
      }
    }

    let frame = requestAnimationFrame(measureRows)
    let observedWidth = list.clientWidth
    const observer = new ResizeObserver((observations) => {
      const width = observations[0]?.contentRect.width ?? list.clientWidth
      if (Math.round(width) !== Math.round(observedWidth)) {
        observedWidth = width
        setVisibleCount(tags.length)
      }
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(measureRows)
    })
    observer.observe(list)

    return () => {
      cancelAnimationFrame(frame)
      observer.disconnect()
    }
  }, [expanded, label, maxRows, tags.length, visibleCount])

  return (
    <ul ref={listRef} aria-label={label} className="mt-1.5 flex flex-wrap gap-1.5">
      {(expanded ? tags : tags.slice(0, visibleCount)).map((tag) => (
        <li key={tag} title={displayTag(tag)} className={cn('max-w-full truncate whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium', outlined ? 'border border-border text-muted-foreground' : 'bg-secondary')}>
          {displayTag(tag)}
        </li>
      ))}
      {!expanded && visibleCount < tags.length && (
        <li>
          <button type="button" onClick={() => setExpanded(true)} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground hover:bg-secondary">
            +{tags.length - visibleCount} more
          </button>
        </li>
      )}
      {expanded && (
        <li>
          <button type="button" onClick={() => { setExpanded(false); setVisibleCount(tags.length) }} className="rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground hover:bg-secondary">
            Show less
          </button>
        </li>
      )}
    </ul>
  )
}

export function CatalogueBrowser({ entries, boothNumbers = [] }: { entries: readonly CatalogueEntry[]; boothNumbers?: readonly string[] }) {
  const [catalogueType, setCatalogueType] = useState<CatalogueType>('booth_catalogue')
  const [query, setQuery] = useState('')
  const [fandoms, setFandoms] = useState<Set<string>>(new Set())
  const [merch, setMerch] = useState<Set<string>>(new Set())
  const [stampRally, setStampRally] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const storageKey = entries[0]?.eventSlug ? `mcc:catalogue-filters:${entries[0].eventSlug}` : null
  const [restoredStorageKey, setRestoredStorageKey] = useState<string | null>(null)

  useEffect(() => {
    if (!storageKey) return

    // Keep each event's catalogue filters when the visitor opens a booth and
    // returns to the event page in this tab.
    setCatalogueType('booth_catalogue')
    setQuery('')
    setFandoms(new Set())
    setMerch(new Set())
    setStampRally(new Set())
    setPage(1)

    try {
      const savedValue = window.sessionStorage.getItem(storageKey)
      if (savedValue) {
        const saved = JSON.parse(savedValue) as SavedCatalogueFilters
        if (saved.catalogueType === 'booth_catalogue' || saved.catalogueType === 'pickup_only') setCatalogueType(saved.catalogueType)
        if (typeof saved.query === 'string') setQuery(saved.query)
        setFandoms(storedStringSet(saved.fandoms))
        setMerch(storedStringSet(saved.merch))
        setStampRally(storedStringSet(saved.stampRally))
        if (typeof saved.page === 'number' && Number.isInteger(saved.page) && saved.page > 0) setPage(saved.page)
      }
    } catch {
      // If storage is unavailable or contains invalid data, use the default filters.
    }
    setRestoredStorageKey(storageKey)
  }, [storageKey])

  useEffect(() => {
    if (!storageKey || restoredStorageKey !== storageKey) return
    try {
      window.sessionStorage.setItem(storageKey, JSON.stringify({
        catalogueType,
        query,
        fandoms: [...fandoms],
        merch: [...merch],
        stampRally: [...stampRally],
        page,
      } satisfies SavedCatalogueFilters))
    } catch {
      // The catalogue still works normally if session storage is unavailable.
    }
  }, [catalogueType, query, fandoms, merch, stampRally, page, restoredStorageKey, storageKey])

  const typeEntries = entries.filter((entry) => entry.catalogueType === catalogueType)
  const boothCatalogueEntries = entries.filter((entry) => entry.catalogueType === 'booth_catalogue')
  const pickupEntries = entries.filter((entry) => entry.catalogueType === 'pickup_only')
  const fandomOptions = useMemo(() => uniqueSorted(typeEntries.map((e) => e.fandoms)), [typeEntries])
  const merchOptions = useMemo(() => uniqueSorted(typeEntries.map((e) => e.merchTypes)), [typeEntries])

  const toggle = (setter: typeof setFandoms) => (value: string) => {
    setPage(1)
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const filtered = typeEntries.filter((e) => {
    const q = query.trim().toLowerCase()
    if (q && !e.artistName.toLowerCase().includes(q) && !(e.booth ?? '').toLowerCase().includes(q)) return false
    if (fandoms.size > 0 && !e.fandoms.some((f) => fandoms.has(f))) return false
    if (merch.size > 0 && !e.merchTypes.some((m) => merch.has(m))) return false
    if (stampRally.size > 0 && !stampRally.has(e.stampRally ? 'Yes' : 'No')) return false
    return true
  })

  const hasFilters = query !== '' || fandoms.size > 0 || merch.size > 0 || stampRally.size > 0
  const pageCount = Math.max(1, Math.ceil(filtered.length / CATALOGUES_PER_PAGE))
  const currentPage = Math.min(page, pageCount)
  const firstVisible = filtered.length === 0 ? 0 : (currentPage - 1) * CATALOGUES_PER_PAGE + 1
  const lastVisible = Math.min(currentPage * CATALOGUES_PER_PAGE, filtered.length)
  const visibleEntries = filtered.slice(firstVisible - 1, lastVisible)
  const pageNumbers = Array.from({ length: pageCount }, (_, index) => index + 1).filter(
    (number) => number === 1 || number === pageCount || Math.abs(number - currentPage) <= 1,
  )
  const catalogueByBooth = new Map<string, CatalogueEntry>()
  for (const entry of boothCatalogueEntries) {
    if (entry.booth?.trim()) catalogueByBooth.set(entry.booth.trim().toLocaleLowerCase(), entry)
  }
  const catalogueBoothNumbers = boothCatalogueEntries.map((entry) => entry.booth).filter((booth): booth is string => Boolean(booth?.trim()))
  const configuredBooths = [...new Set(boothNumbers.map((booth) => booth.trim()).filter(Boolean))]
  const unconfiguredCatalogueBooths = [...new Set(catalogueBoothNumbers)]
    .filter((booth) => !configuredBooths.some((configured) => configured.toLocaleLowerCase() === booth.toLocaleLowerCase()))
    .sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' }))
  const allBoothNumbers = [...configuredBooths, ...unconfiguredCatalogueBooths]

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div role="group" aria-label="Catalogue type" className="flex flex-wrap gap-2">
          {([
            { value: 'booth_catalogue', label: 'Booth Catalogue', count: boothCatalogueEntries.length },
            { value: 'pickup_only', label: 'Pick-Up Only', count: pickupEntries.length },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={catalogueType === option.value}
              onClick={() => {
                setCatalogueType(option.value)
                setQuery('')
                setFandoms(new Set())
                setMerch(new Set())
                setStampRally(new Set())
                setPage(1)
              }}
              className={cn(
                'rounded-full border px-4 py-2 text-sm font-semibold transition-colors',
                catalogueType === option.value ? 'border-foreground bg-foreground text-background' : 'border-input bg-background hover:bg-secondary',
              )}
            >
              {option.label} <span className="ml-1 opacity-75">({option.count})</span>
            </button>
          ))}
        </div>
        <div className="relative">
          <label htmlFor="catalogue-search" className="sr-only">
            Search artists or booth numbers
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="catalogue-search"
            type="search"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setPage(1)
            }}
            placeholder="Search artist or booth..."
            className="h-11 w-full rounded-lg border border-input bg-background pl-10 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {catalogueType === 'booth_catalogue' && allBoothNumbers.length > 0 && (
          <section aria-label="Jump to a booth" className="rounded-lg border border-border bg-background p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-sm font-bold">Jump to a booth</h3>
              <p className="text-xs text-muted-foreground"><span className="font-semibold text-primary">Colored</span> = catalogue available · Gray = not listed yet</p>
            </div>
            <ul className="mt-2 grid max-h-36 grid-cols-[repeat(auto-fill,minmax(4.5rem,1fr))] gap-1.5 overflow-y-auto pr-1">
              {allBoothNumbers.map((booth) => {
                const catalogue = catalogueByBooth.get(booth.trim().toLocaleLowerCase())
                return (
                  <li key={booth} className="min-w-0">
                    {catalogue ? (
                      <Link href={`/events/${catalogue.eventSlug}/catalogues/${catalogue.id}`} className="booth-number-marquee-container flex h-9 w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-accent px-1.5 py-1 text-xs font-semibold leading-tight text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground sm:px-2 sm:text-sm">
                        <BoothNumberText value={booth} />
                      </Link>
                    ) : (
                      <span aria-label={`${booth}, catalogue not listed`} className="booth-number-marquee-container flex h-9 w-full min-w-0 cursor-not-allowed items-center justify-center overflow-hidden rounded-md border border-border bg-muted px-1.5 py-1 text-xs font-medium leading-tight text-muted-foreground/60 sm:px-2 sm:text-sm">
                        <BoothNumberText value={booth} />
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        <div className="flex flex-wrap gap-2">
          <FilterDropdown label="Fandom" options={fandomOptions} selected={fandoms} onToggle={toggle(setFandoms)} searchable={fandomOptions.length > 8} />
          <FilterDropdown label="Merch type" options={merchOptions} selected={merch} onToggle={toggle(setMerch)} searchable={merchOptions.length > 8} />
          <FilterDropdown label="Stamp rally" options={['Yes', 'No']} selected={stampRally} onToggle={toggle(setStampRally)} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <p aria-live="polite">
            Showing <strong>{firstVisible}–{lastVisible}</strong> of {filtered.length} matching catalogues ({typeEntries.length} total)
          </p>
          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setQuery('')
                setFandoms(new Set())
                setMerch(new Set())
                setStampRally(new Set())
                setPage(1)
              }}
              className="inline-flex items-center gap-1 font-semibold text-primary"
            >
              <X className="size-4" aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {typeEntries.length === 0
            ? catalogueType === 'pickup_only' ? 'No pick-up catalogues archived for this event yet.' : 'No booth catalogues archived for this event yet.'
            : 'No catalogues match these filters.'}
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEntries.map((entry) => {
            const hasCatalogueMaterial = entry.instagramPosts.length > 0 || entry.catalogueLinks.length > 0 || entry.catalogueFileUrls.length > 0
            return (
            <li key={entry.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between bg-foreground px-4 py-3 text-background">
                <span className="text-xs font-bold uppercase tracking-wider">Booth number</span>
                <span className="rounded-md bg-accent px-3 py-1 font-heading text-lg font-extrabold text-accent-foreground">{entry.booth}</span>
              </div>
              <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} className="flex items-center justify-center gap-2 border-b border-border bg-muted px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-accent/50">
                <span aria-hidden="true">›</span><span>{hasCatalogueMaterial ? 'Check catalogue material here' : 'View artist details'}</span><span aria-hidden="true">‹</span>
              </Link>
              {entry.catalogueType === 'pickup_only' && (entry.pickupNote?.trim() || entry.orderCutoff?.trim()) && (
                <div className="border-b border-border bg-accent/60 px-4 py-3 text-sm leading-relaxed text-foreground">
                  {entry.orderCutoff?.trim() && <p><span className="font-bold">Order cutoff: </span>{entry.orderCutoff}</p>}
                  {entry.pickupNote?.trim() && <p><span className="font-bold">Pick-up note: </span>{entry.pickupNote}</p>}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="text-lg font-bold leading-tight">
                  <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} className="hover:text-primary">{entry.artistName}</Link>
                </h3>
                {(() => {
                  const accounts = getArtistSocialAccounts(entry.artistInstagrams, entry.artistSocialLinks)
                  return (
                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                      {accounts.slice(0, 3).map((account) => (
                        <ArtistSocialLinks key={account.href} name={entry.artistName} instagrams={[]} links={[account.href]} />
                      ))}
                      {accounts.length > 3 && (
                        <details className="min-w-0">
                          <summary className="cursor-pointer list-none truncate text-xs font-semibold text-primary underline underline-offset-2 [&::-webkit-details-marker]:hidden">+{accounts.length - 3} more</summary>
                          <div className="mt-1.5 flex flex-col gap-1.5">
                            {accounts.slice(3).map((account) => (
                              <ArtistSocialLinks key={account.href} name={entry.artistName} instagrams={[]} links={[account.href]} />
                            ))}
                          </div>
                        </details>
                      )}
                    </div>
                  )
                })()}
                <p className={cn('text-xs font-semibold', hasCatalogueMaterial ? 'text-muted-foreground' : 'text-rose-700')}>
                  {hasCatalogueMaterial
                    ? `Catalogue available${entry.instagramPosts.length > 0 ? ` · ${entry.instagramPosts.length} Instagram post${entry.instagramPosts.length === 1 ? '' : 's'}` : ''}`
                    : 'Catalogue unavailable'}
                </p>
                <div>
                  <p className="text-xs font-bold">Fandom:</p>
                  <TagList tags={entry.fandoms} label="Fandoms" maxRows={3} />
                </div>
                <div className="mt-auto">
                  <p className="text-xs font-bold">Merch:</p>
                  <TagList tags={entry.merchTypes} label="Merch types" maxRows={3} outlined />
                </div>
                <p className={cn('inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold', entry.stampRally ? 'border-emerald-800 bg-emerald-700 text-white' : 'border-border bg-muted text-foreground')}>
                  <span aria-hidden="true">{entry.stampRally ? '✦' : '♡'}</span>Stamp Rally · {entry.stampRally ? 'Yes' : 'No'}
                </p>
              </div>
            </li>
            )
          })}
        </ul>
      )}
      {filtered.length > CATALOGUES_PER_PAGE && (
        <nav aria-label="Catalogue pages" className="flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={() => setPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-input px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>
          {pageNumbers.map((number, index) => (
            <span key={number} className="contents">
              {index > 0 && pageNumbers[index - 1] < number - 1 && <span className="px-1 text-muted-foreground" aria-hidden="true">…</span>}
              <button
                type="button"
                onClick={() => setPage(number)}
                aria-current={currentPage === number ? 'page' : undefined}
                aria-label={`Page ${number}`}
                className={cn(
                  'min-w-10 rounded-lg border px-3 py-2 text-sm font-semibold',
                  currentPage === number ? 'border-foreground bg-foreground text-background' : 'border-input bg-card hover:bg-secondary',
                )}
              >
                {number}
              </button>
            </span>
          ))}
          <button
            type="button"
            onClick={() => setPage(Math.min(pageCount, currentPage + 1))}
            disabled={currentPage === pageCount}
            className="rounded-lg border border-input px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </nav>
      )}
    </div>
  )
}
