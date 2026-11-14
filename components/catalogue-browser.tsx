'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Bookmark, Check, ChevronDown, Search, X } from 'lucide-react'
import { ArtistSocialLinks } from '@/components/artist-social-links'
import { SocialPostEmbed } from '@/components/social-post-embed'
import { CataloguePreview } from '@/components/catalogue-preview'
import { getArtistSocialAccounts } from '@/lib/artist-socials'
import type { CatalogueEntry, CatalogueType } from '@/lib/queries'
import { cn } from '@/lib/utils'

function displayTag(tag: string) {
  return tag.toLocaleLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

function normalizeBooth(value: string) {
  return value.toLocaleLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, '')
}

function uniqueSorted(values: readonly (readonly string[])[]) {
  return [...new Set(values.flat())].sort((a, b) => a.localeCompare(b))
}

function cleanFandomTags(values: readonly string[] | null) {
  return [...new Set((values ?? []).map((tag) => tag.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b))
}

const CATALOGUES_PER_PAGE = 20
type SavedCatalogueFilters = {
  catalogueType?: CatalogueType | 'stamp_rally'
  query?: string
  fandoms?: unknown
  merch?: unknown
  stampRally?: unknown
  stampRallyFandoms?: unknown
  page?: number
}

type StampRallyEntry = {
  id: number
  title: string
  socialPostUrl: string | null
  fandom: readonly string[] | null
  participants: string[]
  description: string | null
  prizes: string | null
}

function storedStringSet(value: unknown) {
  return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
}

type BookmarkColor = 'rose' | 'blue' | 'amber' | 'green'
type BookmarkLabel = { name: string; color: BookmarkColor }

const DEFAULT_BOOKMARK_LABEL: BookmarkLabel = { name: 'Interested', color: 'blue' }
const BOOKMARK_COLOR_STYLES: Record<BookmarkColor, string> = {
  rose: 'border-rose-200 bg-rose-100 text-rose-800',
  blue: 'border-blue-200 bg-blue-100 text-blue-800',
  amber: 'border-amber-200 bg-amber-100 text-amber-900',
  green: 'border-emerald-200 bg-emerald-100 text-emerald-800',
}
const BOOKMARK_ICON_STYLES: Record<BookmarkColor, string> = {
  rose: 'text-rose-300',
  blue: 'text-sky-300',
  amber: 'text-amber-300',
  green: 'text-emerald-300',
}

function readViewedCatalogues() {
  try {
    const stored = JSON.parse(window.localStorage.getItem('mcc:viewed-catalogues') ?? '[]')
    return new Set(Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function BoothNumberText({ value }: { value: string }) {
  const viewportRef = useRef<HTMLSpanElement>(null)
  const textRef = useRef<HTMLSpanElement>(null)
  const [scale, setScale] = useState(1)

  useEffect(() => {
    const viewport = viewportRef.current
    const text = textRef.current
    if (!viewport || !text) return
    const measure = () => {
      const textWidth = text.scrollWidth
      const availableWidth = viewport.clientWidth
      setScale(textWidth > availableWidth && textWidth > 0 ? availableWidth / textWidth : 1)
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(viewport)
    observer.observe(text)
    return () => observer.disconnect()
  }, [value])

  return (
    <span ref={viewportRef} title={value} className="block min-w-0 max-w-full overflow-hidden text-center">
      <span
        ref={textRef}
        style={{ transform: `scaleX(${scale})`, transformOrigin: 'center' }}
        className="inline-block w-max whitespace-nowrap text-[10px] sm:text-xs"
      >
        {value}
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

export function CatalogueBrowser({ entries, boothNumbers = [], stampRallies = [] }: { entries: readonly CatalogueEntry[]; boothNumbers?: readonly string[]; stampRallies?: readonly StampRallyEntry[] }) {
  const [catalogueType, setCatalogueType] = useState<CatalogueType | 'stamp_rally'>('booth_catalogue')
  const [query, setQuery] = useState('')
  const [fandoms, setFandoms] = useState<Set<string>>(new Set())
  const [merch, setMerch] = useState<Set<string>>(new Set())
  const [stampRally, setStampRally] = useState<Set<string>>(new Set())
  const [stampRallyFandoms, setStampRallyFandoms] = useState<Set<string>>(new Set())
  const [page, setPage] = useState(1)
  const [bookmarks, setBookmarks] = useState<Set<string>>(new Set())
  const [bookmarksLoaded, setBookmarksLoaded] = useState(false)
  const [bookmarkLabels, setBookmarkLabels] = useState<Record<string, BookmarkLabel>>({})
  const [bookmarkLabelsLoaded, setBookmarkLabelsLoaded] = useState(false)
  const [bookmarkMemos, setBookmarkMemos] = useState<Record<string, string>>({})
  const [bookmarkMemosLoaded, setBookmarkMemosLoaded] = useState(false)
  const [viewedCatalogues, setViewedCatalogues] = useState<Set<string>>(new Set())
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)
  const storageKey = entries[0]?.eventSlug ? `mcc:catalogue-filters:${entries[0].eventSlug}` : null
  const bookmarkStorageKey = 'mcc:bookmarked-catalogues'
  const bookmarkLabelsStorageKey = 'mcc:bookmark-labels'
  const bookmarkMemoStorageKey = 'mcc:bookmark-memos'
  const [restoredStorageKey, setRestoredStorageKey] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const previousPage = useRef<number | null>(null)

  useEffect(() => {
    // Ask supported browsers not to evict this site's saved data automatically.
    // This is best-effort and does not prevent a viewer from clearing site data.
    try {
      const persistStorage = window.navigator.storage?.persist
      if (persistStorage) void persistStorage.call(window.navigator.storage).catch(() => false)
    } catch {
      // Some browsers do not expose persistent storage.
    }

    try {
      const saved = JSON.parse(window.localStorage.getItem(bookmarkStorageKey) ?? '[]')
      if (Array.isArray(saved)) setBookmarks(new Set(saved.filter((item): item is string => typeof item === 'string')))
    } catch {
      // Bookmarks are an enhancement; catalogue browsing remains available without storage.
    } finally {
      setBookmarksLoaded(true)
    }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(bookmarkLabelsStorageKey) ?? '{}')
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        const validLabels = Object.fromEntries(
          Object.entries(saved).filter((item): item is [string, BookmarkLabel] => {
            const value = item[1]
            return Boolean(value && typeof value === 'object' && typeof value.name === 'string' &&
              ['rose', 'blue', 'amber', 'green'].includes(value.color))
          }),
        )
        setBookmarkLabels(validLabels)
      }
    } catch {
      // Default labels are used if stored label data is unavailable or invalid.
    } finally {
      setBookmarkLabelsLoaded(true)
    }
  }, [])

  useEffect(() => {
    const syncViewed = () => setViewedCatalogues(readViewedCatalogues())
    syncViewed()
    window.addEventListener('storage', syncViewed)
    window.addEventListener('pageshow', syncViewed)
    window.addEventListener('focus', syncViewed)
    window.addEventListener('mcc:viewed-catalogues-updated', syncViewed)
    return () => {
      window.removeEventListener('storage', syncViewed)
      window.removeEventListener('pageshow', syncViewed)
      window.removeEventListener('focus', syncViewed)
      window.removeEventListener('mcc:viewed-catalogues-updated', syncViewed)
    }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(bookmarkMemoStorageKey) ?? '{}')
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        setBookmarkMemos(Object.fromEntries(
          Object.entries(saved).filter((item): item is [string, string] => typeof item[1] === 'string'),
        ))
      }
    } catch {
      // Memos are optional; bookmark browsing remains available without them.
    } finally {
      setBookmarkMemosLoaded(true)
    }
  }, [])

  useEffect(() => {
    if (!bookmarksLoaded) return
    try {
      window.localStorage.setItem(bookmarkStorageKey, JSON.stringify([...bookmarks]))
    } catch {
      // The current page still reflects bookmark changes if local storage is unavailable.
    }
  }, [bookmarks, bookmarksLoaded])

  useEffect(() => {
    if (!bookmarkLabelsLoaded) return
    try {
      window.localStorage.setItem(bookmarkLabelsStorageKey, JSON.stringify(bookmarkLabels))
    } catch {
      // Saved items keep their default label in the current page if storage is unavailable.
    }
  }, [bookmarkLabels, bookmarkLabelsLoaded])

  useEffect(() => {
    if (!bookmarkMemosLoaded) return
    try {
      window.localStorage.setItem(bookmarkMemoStorageKey, JSON.stringify(bookmarkMemos))
    } catch {
      // The current page still reflects memo edits if browser storage is unavailable.
    }
  }, [bookmarkMemos, bookmarkMemosLoaded])

  useEffect(() => {
    if (!storageKey) return

    // Keep each event's catalogue filters when the visitor opens a booth and
    // returns to the event page in this tab.
    setCatalogueType('booth_catalogue')
    setQuery('')
    setFandoms(new Set())
    setMerch(new Set())
    setStampRally(new Set())
    setStampRallyFandoms(new Set())
    setPage(1)

    try {
      const savedValue = window.sessionStorage.getItem(storageKey)
      if (savedValue) {
        const saved = JSON.parse(savedValue) as SavedCatalogueFilters
        if (saved.catalogueType === 'booth_catalogue' || saved.catalogueType === 'pickup_only' || saved.catalogueType === 'stamp_rally') setCatalogueType(saved.catalogueType)
        if (typeof saved.query === 'string') setQuery(saved.query)
        setFandoms(storedStringSet(saved.fandoms))
        setMerch(storedStringSet(saved.merch))
        setStampRally(storedStringSet(saved.stampRally))
        setStampRallyFandoms(storedStringSet(saved.stampRallyFandoms))
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
        stampRallyFandoms: [...stampRallyFandoms],
        page,
      } satisfies SavedCatalogueFilters))
    } catch {
      // The catalogue still works normally if session storage is unavailable.
    }
  }, [catalogueType, query, fandoms, merch, stampRally, stampRallyFandoms, page, restoredStorageKey, storageKey])

  const dataType: CatalogueType = catalogueType === 'stamp_rally' ? 'booth_catalogue' : catalogueType
  const typeEntries = entries.filter((entry) => entry.catalogueType === dataType)
  const boothCatalogueEntries = entries.filter((entry) => entry.catalogueType === 'booth_catalogue')
  const pickupEntries = entries.filter((entry) => entry.catalogueType === 'pickup_only')
  const fandomOptions = useMemo(() => uniqueSorted(typeEntries.map((e) => e.fandoms)), [typeEntries])
  const merchOptions = useMemo(() => uniqueSorted(typeEntries.map((e) => e.merchTypes)), [typeEntries])
  const stampRallyFandomOptions = useMemo(
    () => uniqueSorted(stampRallies.map((rally) => cleanFandomTags(rally.fandom))),
    [stampRallies],
  )

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
    if (showBookmarkedOnly && !bookmarks.has(`${e.eventSlug}:${e.id}`)) return false
    const q = query.trim().toLowerCase()
    if (q && !e.artistName.toLowerCase().includes(q) && !(e.booth ?? '').toLowerCase().includes(q)) return false
    if (fandoms.size > 0 && !e.fandoms.some((f) => fandoms.has(f))) return false
    if (merch.size > 0 && !e.merchTypes.some((m) => merch.has(m))) return false
    if (stampRally.size > 0 && !stampRally.has(e.stampRally ? 'Yes' : 'No')) return false
    return true
  })
  const filteredStampRallies = stampRallies.filter((rally) =>
    stampRallyFandoms.size === 0 || cleanFandomTags(rally.fandom).some((fandom) => stampRallyFandoms.has(fandom)),
  )

  const hasFilters = query !== '' || fandoms.size > 0 || merch.size > 0 || stampRally.size > 0 || stampRallyFandoms.size > 0 || showBookmarkedOnly
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

  useEffect(() => {
    if (previousPage.current !== null && previousPage.current !== currentPage) {
      resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
    previousPage.current = currentPage
  }, [currentPage])

  const toggleBookmark = (entry: CatalogueEntry) => {
    const key = `${entry.eventSlug}:${entry.id}`
    const removing = bookmarks.has(key)
    setBookmarks((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    if (removing) {
      setBookmarkLabels((current) => {
        if (!(key in current)) return current
        const next = { ...current }
        delete next[key]
        return next
      })
      setBookmarkMemos((current) => {
        if (!(key in current)) return current
        const next = { ...current }
        delete next[key]
        return next
      })
    } else {
      setBookmarkLabels((current) => ({ ...current, [key]: current[key] ?? { ...DEFAULT_BOOKMARK_LABEL } }))
    }
  }

  const updateBookmarkLabel = (entry: CatalogueEntry, update: Partial<BookmarkLabel>) => {
    const key = `${entry.eventSlug}:${entry.id}`
    setBookmarkLabels((current) => ({
      ...current,
      [key]: { ...(current[key] ?? DEFAULT_BOOKMARK_LABEL), ...update },
    }))
  }

  const updateBookmarkMemo = (entry: CatalogueEntry, memo: string) => {
    const key = `${entry.eventSlug}:${entry.id}`
    setBookmarkMemos((current) => ({ ...current, [key]: memo }))
  }

  const savedCount = typeEntries.filter((entry) => bookmarks.has(`${entry.eventSlug}:${entry.id}`)).length
  const catalogueByBoothLower = new Map<string, CatalogueEntry>()
  for (const entry of boothCatalogueEntries) {
    if (entry.booth?.trim()) catalogueByBoothLower.set(normalizeBooth(entry.booth), entry)
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4 sm:p-5">
        <div role="group" aria-label="Catalogue type" className="flex flex-wrap gap-2">
          {([
            { value: 'booth_catalogue', label: 'Booth Catalogue', count: boothCatalogueEntries.length },
            { value: 'pickup_only', label: 'Pick-Up Only', count: pickupEntries.length },
            { value: 'stamp_rally', label: 'Stamp Rally', count: stampRallies.length },
          ] as const).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={catalogueType === option.value}
              onClick={() => {
                setCatalogueType(option.value)
                if (option.value !== 'stamp_rally' || catalogueType !== 'stamp_rally') {
                  setQuery('')
                  setFandoms(new Set())
                  setMerch(new Set())
                  setStampRally(new Set())
                }
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
        {catalogueType !== 'stamp_rally' && <div className="relative">
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
        </div>}
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
                      <Link aria-label={`View catalogue for booth ${booth}`} href={`/events/${catalogue.eventSlug}/catalogues/${catalogue.id}`} className="flex h-9 w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-accent px-1.5 py-1 text-xs font-semibold leading-tight text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground sm:px-2 sm:text-sm">
                        <BoothNumberText value={booth} />
                      </Link>
                    ) : (
                      <span aria-label={`${booth}, catalogue not listed`} className="flex h-9 w-full min-w-0 cursor-not-allowed items-center justify-center overflow-hidden rounded-md border border-border bg-muted px-1.5 py-1 text-xs font-medium leading-tight text-muted-foreground/60 sm:px-2 sm:text-sm">
                        <BoothNumberText value={booth} />
                      </span>
                    )}
                  </li>
                )
              })}
            </ul>
          </section>
        )}
        {catalogueType === 'stamp_rally' ? (
          <>
            <div className="flex flex-wrap gap-2">
              <FilterDropdown label="Fandom" options={stampRallyFandomOptions} selected={stampRallyFandoms} onToggle={toggle(setStampRallyFandoms)} searchable={stampRallyFandomOptions.length > 8} />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-border pt-4 text-sm">
              <p aria-live="polite">Showing <strong>{filteredStampRallies.length}</strong> of {stampRallies.length} stamp rallies</p>
              {stampRallyFandoms.size > 0 && (
                <button type="button" onClick={() => setStampRallyFandoms(new Set())} className="inline-flex items-center gap-1 font-semibold text-primary">
                  <X className="size-4" aria-hidden="true" /> Clear filter
                </button>
              )}
            </div>
          </>
        ) : <>
        <div className="flex flex-col items-start gap-1.5">
          <button type="button" aria-pressed={showBookmarkedOnly} onClick={() => { setShowBookmarkedOnly((value) => !value); setPage(1) }} className={cn('inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold', showBookmarkedOnly ? 'border-foreground bg-foreground text-background' : 'border-input bg-background hover:bg-secondary')}>
            <Bookmark className="size-4" aria-hidden="true" /> {showBookmarkedOnly ? 'Showing saved catalogues' : 'Show saved catalogues'} ({savedCount})
          </button>
          <p className="text-xs leading-relaxed text-muted-foreground">
            Saved to this browser and device only; bookmarks don’t sync across browsers or devices. Clearing site data or ending a private session may remove them.
          </p>
        </div>
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
                setShowBookmarkedOnly(false)
                setPage(1)
              }}
              className="inline-flex items-center gap-1 font-semibold text-primary"
            >
              <X className="size-4" aria-hidden="true" /> Clear filters
            </button>
          )}
        </div>
        </>}
      </div>

      {catalogueType === 'stamp_rally' ? (
        stampRallies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No stamp rallies have been added for this event yet.</p>
        ) : filteredStampRallies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No stamp rallies match this fandom filter.</p>
        ) : (
          <ul className="grid gap-6 sm:grid-cols-2">
            {filteredStampRallies.map((rally) => (
              <li key={rally.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
                <h3 className="text-xl font-bold leading-tight">{rally.title}</h3>
                {rally.socialPostUrl?.trim() && <SocialPostEmbed postUrl={rally.socialPostUrl} title={`${rally.title} stamp rally post`} />}
                {cleanFandomTags(rally.fandom).length > 0 && (
                  <div>
                    <p className="text-xs font-bold">Fandom:</p>
                    <TagList tags={cleanFandomTags(rally.fandom)} label={`${rally.title} fandoms`} maxRows={3} />
                  </div>
                )}
                {rally.participants.length > 0 && (
                  <div>
                    <h4 className="text-sm font-bold">Participating booths</h4>
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {rally.participants.map((participant) => {
                        const [boothValue, submittedArtistName] = participant.split('|').map((part) => part.trim())
                        const booth = boothValue || participant.trim()
                        const entry = catalogueByBoothLower.get(normalizeBooth(booth))
                        const artistName = entry?.artistName ?? submittedArtistName
                        const label = artistName ? `${booth} · ${artistName}` : participant
                        return <li key={participant}>{entry ? <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} className="inline-flex rounded-full border border-primary/30 bg-accent px-3 py-1.5 text-sm font-semibold text-primary hover:border-primary">{label}</Link> : <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">{label}</span>}</li>
                      })}
                    </ul>
                  </div>
                )}
                {rally.description?.trim() && <p className="whitespace-pre-line text-sm leading-relaxed"><span className="font-bold">Description: </span>{rally.description}</p>}
                {rally.prizes?.trim() && <p className="whitespace-pre-line text-sm leading-relaxed"><span className="font-bold">Prizes: </span>{rally.prizes}</p>}
              </li>
            ))}
          </ul>
        )
      ) : filtered.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
          {typeEntries.length === 0
            ? catalogueType === 'pickup_only' ? 'No pick-up catalogues archived for this event yet.' : 'No booth catalogues archived for this event yet.'
            : 'No catalogues match these filters.'}
        </p>
      ) : (
        <div ref={resultsRef} id="catalogue-results" className="scroll-mt-24">
        <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {visibleEntries.map((entry) => {
            const hasCatalogueMaterial = entry.instagramPosts.length > 0 || entry.catalogueLinks.length > 0 || entry.catalogueFileUrls.length > 0
            const entryKey = `${entry.eventSlug}:${entry.id}`
            const isBookmarked = bookmarks.has(entryKey)
            const bookmarkLabel = bookmarkLabels[entryKey] ?? DEFAULT_BOOKMARK_LABEL
            const isViewed = viewedCatalogues.has(entryKey)
            return (
            <li key={entry.id} className="flex flex-col overflow-hidden rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between bg-foreground px-4 py-3 text-background">
                <span className="text-xs font-bold uppercase tracking-wider">Booth number</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-accent px-3 py-1 font-heading text-lg font-extrabold text-accent-foreground">{entry.booth}</span>
                  <button type="button" onClick={() => toggleBookmark(entry)} aria-pressed={isBookmarked} aria-label={`${isBookmarked ? 'Remove' : 'Save'} booth ${entry.booth}`} title={isBookmarked ? 'Remove saved booth' : 'Save booth'} className="rounded-md p-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent">
                    <Bookmark className={cn('size-5', isBookmarked && 'fill-current', isBookmarked && BOOKMARK_ICON_STYLES[bookmarkLabel.color])} aria-hidden="true" />
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-2 border-b border-border bg-muted text-center text-sm font-semibold">
                <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} className="px-3 py-3 text-primary transition-colors hover:bg-accent/50">
                  Open full page
                </Link>
                <CataloguePreview entry={entry} hasCatalogueMaterial={hasCatalogueMaterial} />
              </div>
              {isBookmarked && (
                <details className="border-b border-border bg-accent/20 px-4 py-2.5">
                  <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                    <span className={cn('rounded-full border px-2.5 py-0.5 text-xs', BOOKMARK_COLOR_STYLES[bookmarkLabel.color])}>{bookmarkLabel.name || 'Saved'}</span>
                    <span className="text-muted-foreground">Edit bookmark and memo</span>
                  </summary>
                  <label htmlFor={`bookmark-label-${entry.eventSlug}-${entry.id}`} className="mt-3 block text-xs font-medium text-muted-foreground">
                    Your bookmark label
                  </label>
                  <input
                    id={`bookmark-label-${entry.eventSlug}-${entry.id}`}
                    value={bookmarkLabel.name}
                    onChange={(event) => updateBookmarkLabel(entry, { name: event.target.value.slice(0, 32) })}
                    maxLength={32}
                    placeholder="e.g. Priority, Interested, Maybe"
                    className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <label htmlFor={`bookmark-color-${entry.eventSlug}-${entry.id}`} className="mt-2 block text-xs font-medium text-muted-foreground">
                    Bookmark color
                  </label>
                  <select
                    id={`bookmark-color-${entry.eventSlug}-${entry.id}`}
                    value={bookmarkLabel.color}
                    onChange={(event) => updateBookmarkLabel(entry, { color: event.target.value as BookmarkColor })}
                    className="mt-1.5 h-9 rounded-md border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="rose">Rose</option>
                    <option value="blue">Blue</option>
                    <option value="amber">Amber</option>
                    <option value="green">Green</option>
                  </select>
                  <label htmlFor={`bookmark-memo-${entry.eventSlug}-${entry.id}`} className="mt-2 block text-xs font-medium text-muted-foreground">
                    Visit memo
                  </label>
                  <textarea
                    id={`bookmark-memo-${entry.eventSlug}-${entry.id}`}
                    value={bookmarkMemos[entryKey] ?? ''}
                    onChange={(event) => updateBookmarkMemo(entry, event.target.value)}
                    rows={2}
                    maxLength={500}
                    placeholder="e.g. Visit early to buy the new keychains"
                    className="mt-1.5 w-full resize-y rounded-md border border-input bg-background px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </details>
              )}
              {entry.catalogueType === 'pickup_only' && (entry.pickupNote?.trim() || entry.orderCutoff?.trim()) && (
                <div className="border-b border-border bg-accent/60 px-4 py-3 text-sm leading-relaxed text-foreground">
                  {entry.orderCutoff?.trim() && <p><span className="font-bold">Order cutoff: </span>{entry.orderCutoff}</p>}
                  {entry.pickupNote?.trim() && <p><span className="font-bold">Pick-up note: </span>{entry.pickupNote}</p>}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="text-lg font-bold leading-tight">
                    <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} className="hover:text-primary">{entry.artistName}</Link>
                  </h3>
                  {isViewed && <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><Check className="size-3.5" aria-hidden="true" />Viewed</span>}
                </div>
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
                {entry.stampRally && entry.stampRallyNote?.trim() && (
                  <p className="whitespace-pre-line break-words text-xs leading-relaxed text-emerald-900">{entry.stampRallyNote}</p>
                )}
              </div>
            </li>
            )
          })}
        </ul>
        </div>
      )}
      {catalogueType !== 'stamp_rally' && filtered.length > CATALOGUES_PER_PAGE && (
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
