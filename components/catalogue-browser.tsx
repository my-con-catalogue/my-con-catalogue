'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import { Check, ChevronDown, Search, X } from 'lucide-react'
import { InstagramIcon } from '@/components/social-icons'
import { instagramUrl } from '@/lib/format'
import type { CatalogueEntry } from '@/lib/queries'
import { cn } from '@/lib/utils'

function displayTag(tag: string) {
  return tag.toLocaleLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

function uniqueSorted(values: readonly (readonly string[])[]) {
  return [...new Set(values.flat())].sort((a, b) => a.localeCompare(b))
}

const CATALOGUES_PER_PAGE = 20

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

export function CatalogueBrowser({ entries }: { entries: CatalogueEntry[] }) {
  const [query, setQuery] = useState('')
  const [fandoms, setFandoms] = useState<Set<string>>(new Set())
  const [merch, setMerch] = useState<Set<string>>(new Set())
  const [stampRally, setStampRally] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)

  const fandomOptions = useMemo(() => uniqueSorted(entries.map((e) => e.fandoms)), [entries])
  const merchOptions = useMemo(() => uniqueSorted(entries.map((e) => e.merchTypes)), [entries])

  const toggle = (setter: typeof setFandoms) => (value: string) => {
    setPage(1)
    setter((prev) => {
      const next = new Set(prev)
      if (next.has(value)) next.delete(value)
      else next.add(value)
      return next
    })
  }

  const filtered = entries.filter((e) => {
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

  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
        No catalogues archived for this event yet.
      </p>
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
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
        <div className="flex flex-wrap gap-2">
          <FilterDropdown label="Fandom" options={fandomOptions} selected={fandoms} onToggle={toggle(setFandoms)} searchable={fandomOptions.length > 8} />
          <FilterDropdown label="Merch type" options={merchOptions} selected={merch} onToggle={toggle(setMerch)} searchable={merchOptions.length > 8} />
          <FilterDropdown label="Stamp rally" options={['Yes', 'No']} selected={stampRally} onToggle={toggle(setStampRally)} />
        </div>
        <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
          <p aria-live="polite">
            Showing <strong>{firstVisible}–{lastVisible}</strong> of {filtered.length} matching catalogues ({entries.length} total)
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
          No catalogues match these filters.
        </p>
      ) : (
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEntries.map((entry) => (
            <li key={entry.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between bg-foreground px-4 py-3 text-background">
                <span className="text-xs font-bold uppercase tracking-wider">Booth number</span>
                <span className="rounded-md bg-accent px-3 py-1 font-heading text-lg font-extrabold text-accent-foreground">{entry.booth}</span>
              </div>
              <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} className="flex items-center justify-center gap-2 border-b border-border bg-muted px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-accent/50">
                <span aria-hidden="true">›</span><span>Check catalogue posts here</span><span aria-hidden="true">‹</span>
              </Link>
              <div className="flex flex-1 flex-col gap-3 p-4">
                <h3 className="text-lg font-bold leading-tight">
                  <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} className="hover:text-primary">{entry.artistName}</Link>
                </h3>
                <div className="flex flex-col gap-1.5">
                  {entry.artistInstagrams.map((handle) => (
                    <a key={handle} href={instagramUrl(handle)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary">
                      <InstagramIcon className="size-4" />@{handle.replace(/^@/, '')}
                    </a>
                  ))}
                </div>
                <p className="text-xs font-medium text-muted-foreground">Catalogue posts: {entry.instagramPosts.length}</p>
                <div>
                  <p className="text-xs font-bold">Fandom:</p>
                  <ul aria-label="Fandoms" className="mt-1.5 flex flex-wrap gap-1.5">
                  {entry.fandoms.map((f) => (
                    <li key={f} className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium">
                      {displayTag(f)}
                    </li>
                  ))}
                  </ul>
                </div>
                <div className="mt-auto">
                  <p className="text-xs font-bold">Merch:</p>
                  <ul aria-label="Merch types" className="mt-1.5 flex flex-wrap gap-1.5">
                  {entry.merchTypes.map((m) => (
                    <li key={m} className="rounded-full border border-border px-2.5 py-0.5 text-xs text-muted-foreground">
                      {displayTag(m)}
                    </li>
                  ))}
                  </ul>
                </div>
                <p className={cn('inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold', entry.stampRally ? 'border-emerald-800 bg-emerald-700 text-white' : 'border-border bg-muted text-foreground')}>
                  <span aria-hidden="true">{entry.stampRally ? '✦' : '♡'}</span>Stamp Rally · {entry.stampRally ? 'Yes' : 'No'}
                </p>
              </div>
            </li>
          ))}
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
