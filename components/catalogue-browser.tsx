'use client'

import Link from 'next/link'
import { useEffect, useId, useMemo, useRef, useState } from 'react'
import { Bookmark, Check, ChevronDown, Search, X } from 'lucide-react'
import { ArtistSocialLinks } from '@/components/artist-social-links'
import { SocialPostEmbed } from '@/components/social-post-embed'
import { CataloguePreview } from '@/components/catalogue-preview'
import { CatalogueCover } from '@/components/catalogue-cover'
import { BookmarkEditor, BOOKMARK_COLORS, DEFAULT_BOOKMARK_LABEL, isBookmarkLabel, type BookmarkLabel, type BookmarkColor } from '@/components/bookmark-editor'
import { getArtistSocialAccounts } from '@/lib/artist-socials'
import type { CatalogueEntry, CatalogueType } from '@/lib/queries'
import { cn } from '@/lib/utils'
import { normalizedTag, uniqueSortedTags } from '@/lib/tag-utils'
import { getCloudBookmarks, removeCloudBookmark, saveCloudBookmark, syncCloudBookmarks } from '@/app/actions/bookmark-accounts'
import { CalendarReminderButton } from '@/components/calendar-reminder-button'
import { parsePickupCutoffDates } from '@/lib/pickup-cutoff-dates'

function displayTag(tag: string) {
  return tag.toLocaleLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

function normalizeBooth(value: string) {
  return value.toLocaleLowerCase().replace(/[–—]/g, '-').replace(/\s+/g, '')
}

function uniqueSorted(values: readonly (readonly string[])[]) {
  return uniqueSortedTags(values)
}

function cleanFandomTags(values: readonly string[] | null) {
  return uniqueSortedTags([values])
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
  eventSlug: string
  title: string
  socialPostUrl: string | null
  fandom: readonly string[] | null
  participants: string[]
  description: string | null
  prizes: string | null
  method: string | null
}

function storedStringSet(value: unknown) {
  return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
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

export function TagList({ tags, label, maxRows = 3, outlined = false }: { tags: readonly string[]; label: string; maxRows?: number; outlined?: boolean }) {
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

function PageJump({ pageCount, onSelect }: { pageCount: number; onSelect: (page: number) => void }) {
  const [value, setValue] = useState('')
  const id = useId()
  const go = (page: number) => {
    if (Number.isInteger(page) && page >= 1 && page <= pageCount) onSelect(page)
  }
  return <details className="group relative">
    <summary aria-label="Jump to page" className="flex min-w-10 cursor-pointer list-none items-center justify-center rounded-lg border border-input bg-card px-3 py-2 text-sm font-semibold hover:bg-secondary [&::-webkit-details-marker]:hidden">…</summary>
    <div className="absolute left-1/2 z-20 mt-2 w-64 -translate-x-1/2 rounded-xl border border-border bg-card p-3 shadow-xl">
      <label className="block text-xs font-semibold" htmlFor={`${id}-number`}>Go to page</label>
      <form className="mt-2 flex gap-2" onSubmit={(event) => { event.preventDefault(); go(Number(value)); }}>
        <input id={`${id}-number`} type="number" min={1} max={pageCount} value={value} onChange={(event) => setValue(event.target.value)} placeholder={`1–${pageCount}`} className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm" />
        <button type="submit" className="rounded-lg bg-foreground px-3 text-sm font-semibold text-background">Go</button>
      </form>
      <label className="mt-3 block text-xs font-semibold" htmlFor={`${id}-select`}>Or choose a page</label>
      <select id={`${id}-select`} defaultValue="" onChange={(event) => { if (event.target.value) go(Number(event.target.value)); }} className="mt-2 h-10 w-full rounded-lg border border-input bg-background px-3 text-sm">
        <option value="" disabled>Select page…</option>
        {Array.from({ length: pageCount }, (_, index) => <option key={index + 1} value={index + 1}>Page {index + 1}</option>)}
      </select>
    </div>
  </details>
}

export function CatalogueBrowser({ entries, eventName, boothNumbers = [], stampRallies = [] }: { entries: readonly CatalogueEntry[]; eventName?: string; boothNumbers?: readonly string[]; stampRallies?: readonly StampRallyEntry[] }) {
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
  const [bookmarkColorFilters, setBookmarkColorFilters] = useState<Set<BookmarkColor>>(new Set())
  const [viewedCatalogues, setViewedCatalogues] = useState<Set<string>>(new Set())
  const [showBookmarkedOnly, setShowBookmarkedOnly] = useState(false)
  const [accountUsername, setAccountUsername] = useState('')
  const storageKey = entries[0]?.eventSlug ? `mcc:catalogue-filters:${entries[0].eventSlug}` : null
  const scrollPositionKey = storageKey ? `${storageKey}:return-scroll` : null
  const rememberCatalogueListPosition = () => {
    if (!scrollPositionKey) return
    try { window.sessionStorage.setItem(scrollPositionKey, String(window.scrollY)) } catch { /* Scroll restoration is best-effort. */ }
  }
  const bookmarkStorageKey = 'mcc:bookmarked-catalogues'
  const bookmarkLabelsStorageKey = 'mcc:bookmark-labels'
  const bookmarkMemoStorageKey = 'mcc:bookmark-memos'
  const [restoredStorageKey, setRestoredStorageKey] = useState<string | null>(null)
  const resultsRef = useRef<HTMLDivElement>(null)
  const shouldScrollAfterPageChange = useRef(false)

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
    let active = true
    void getCloudBookmarks().then(async (cloud) => {
      if (!active || !cloud) return
      try {
        const localKeysValue: unknown = JSON.parse(window.localStorage.getItem(bookmarkStorageKey) ?? '[]')
        const localKeys = Array.isArray(localKeysValue) ? localKeysValue.filter((item): item is string => typeof item === 'string') : []
        const localLabelsValue: unknown = JSON.parse(window.localStorage.getItem(bookmarkLabelsStorageKey) ?? '{}')
        const localLabels = localLabelsValue && typeof localLabelsValue === 'object' && !Array.isArray(localLabelsValue) ? localLabelsValue as Record<string, BookmarkLabel> : {}
        const localMemosValue: unknown = JSON.parse(window.localStorage.getItem(bookmarkMemoStorageKey) ?? '{}')
        const localMemos = localMemosValue && typeof localMemosValue === 'object' && !Array.isArray(localMemosValue) ? localMemosValue as Record<string, string> : {}
        const cloudKeys = cloud.bookmarks.map((item) => item.key)
        const keys = [...new Set([...localKeys, ...cloudKeys])]
        const labels = { ...localLabels }
        const memos = { ...localMemos }
        for (const item of cloud.bookmarks) {
          if (!Object.hasOwn(labels, item.key)) labels[item.key] = { name: item.labelName, color: item.labelColor }
          if (!Object.hasOwn(memos, item.key)) memos[item.key] = item.memo
        }
        if (!active) return
        setAccountUsername(cloud.username)
        setBookmarks(new Set(keys))
        setBookmarkLabels(labels)
        setBookmarkMemos(memos)
        await syncCloudBookmarks(keys.map((key) => ({
          key,
          labelName: labels[key]?.name ?? '',
          labelColor: labels[key]?.color ?? 'blue',
          memo: memos[key] ?? '',
        })))
      } catch {
        // Keep using local bookmarks if account sync or browser storage is unavailable.
      }
    }).catch(() => undefined)
    return () => { active = false }
  }, [])

  useEffect(() => {
    try {
      const saved = JSON.parse(window.localStorage.getItem(bookmarkLabelsStorageKey) ?? '{}')
      if (saved && typeof saved === 'object' && !Array.isArray(saved)) {
        const validLabels = Object.fromEntries(
          Object.entries(saved).filter((item): item is [string, BookmarkLabel] => isBookmarkLabel(item[1])),
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
    const syncSaved = () => {
      try {
        const storedBookmarks = JSON.parse(window.localStorage.getItem(bookmarkStorageKey) ?? '[]')
        setBookmarks(new Set(Array.isArray(storedBookmarks) ? storedBookmarks.filter((item): item is string => typeof item === 'string') : []))
        const storedLabels = JSON.parse(window.localStorage.getItem(bookmarkLabelsStorageKey) ?? '{}')
        if (storedLabels && typeof storedLabels === 'object' && !Array.isArray(storedLabels)) {
          setBookmarkLabels(Object.fromEntries(Object.entries(storedLabels).filter((item): item is [string, BookmarkLabel] => isBookmarkLabel(item[1]))))
        }
        const storedMemos = JSON.parse(window.localStorage.getItem(bookmarkMemoStorageKey) ?? '{}')
        if (storedMemos && typeof storedMemos === 'object' && !Array.isArray(storedMemos)) {
          setBookmarkMemos(Object.fromEntries(Object.entries(storedMemos).filter((item): item is [string, string] => typeof item[1] === 'string')))
        }
      } catch {
        // Retain the current view if browser storage is unavailable or invalid.
      }
    }
    window.addEventListener('storage', syncSaved)
    window.addEventListener('pageshow', syncSaved)
    window.addEventListener('focus', syncSaved)
    window.addEventListener('mcc:bookmarks-updated', syncSaved)
    return () => {
      window.removeEventListener('storage', syncSaved)
      window.removeEventListener('pageshow', syncSaved)
      window.removeEventListener('focus', syncSaved)
      window.removeEventListener('mcc:bookmarks-updated', syncSaved)
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
    const entryKey = `${e.eventSlug}:${e.id}`
    if (showBookmarkedOnly && !bookmarks.has(entryKey)) return false
    if (showBookmarkedOnly && bookmarkColorFilters.size > 0 && !bookmarkColorFilters.has((bookmarkLabels[entryKey] ?? DEFAULT_BOOKMARK_LABEL).color)) return false
    const q = query.trim().toLowerCase()
    if (q && !e.artistName.toLowerCase().includes(q) && !(e.booth ?? '').toLowerCase().includes(q)) return false
    if (fandoms.size > 0 && !e.fandoms.some((f) => [...fandoms].some((selected) => normalizedTag(selected) === normalizedTag(f)))) return false
    if (merch.size > 0 && !e.merchTypes.some((m) => merch.has(m))) return false
    if (stampRally.size > 0 && !stampRally.has(e.stampRally ? 'Yes' : 'No')) return false
    return true
  })
  const filteredStampRallies = stampRallies.filter((rally) => {
    const key = `${rally.eventSlug}:sr-${rally.id}`
    return (!showBookmarkedOnly || bookmarks.has(key))
      && (bookmarkColorFilters.size === 0 || bookmarkColorFilters.has((bookmarkLabels[key] ?? DEFAULT_BOOKMARK_LABEL).color))
      && (stampRallyFandoms.size === 0 || cleanFandomTags(rally.fandom).some((fandom) => [...stampRallyFandoms].some((selected) => normalizedTag(selected) === normalizedTag(fandom))))
  })

  const hasFilters = query !== '' || fandoms.size > 0 || merch.size > 0 || stampRally.size > 0 || stampRallyFandoms.size > 0 || showBookmarkedOnly || bookmarkColorFilters.size > 0
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

  const goToPage = (nextPage: number) => {
    shouldScrollAfterPageChange.current = nextPage !== currentPage
    setPage(nextPage)
  }

  useEffect(() => {
    if (!shouldScrollAfterPageChange.current) return
    shouldScrollAfterPageChange.current = false
    resultsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [currentPage])

  const saveBookmark = (entry: CatalogueEntry, label: BookmarkLabel, memo: string) => {
    const key = `${entry.eventSlug}:${entry.id}`
    setBookmarks((current) => new Set(current).add(key))
    setBookmarkLabels((current) => ({ ...current, [key]: label }))
    setBookmarkMemos((current) => ({ ...current, [key]: memo }))
    void saveCloudBookmark({ key, labelName: label.name, labelColor: label.color, memo })
  }

  const saveStampRallyBookmark = (rally: StampRallyEntry, label: BookmarkLabel, memo: string) => {
    const key = `${rally.eventSlug}:sr-${rally.id}`
    setBookmarks((current) => new Set(current).add(key))
    setBookmarkLabels((current) => ({ ...current, [key]: label }))
    setBookmarkMemos((current) => ({ ...current, [key]: memo }))
    void saveCloudBookmark({ key, labelName: label.name, labelColor: label.color, memo })
  }

  const removeStampRallyBookmark = (rally: StampRallyEntry) => {
    const key = `${rally.eventSlug}:sr-${rally.id}`
    setBookmarks((current) => { const next = new Set(current); next.delete(key); return next })
    setBookmarkLabels((current) => { const next = { ...current }; delete next[key]; return next })
    setBookmarkMemos((current) => { const next = { ...current }; delete next[key]; return next })
    void removeCloudBookmark(key)
  }

  const removeBookmark = (entry: CatalogueEntry) => {
    const key = `${entry.eventSlug}:${entry.id}`
    setBookmarks((current) => {
      const next = new Set(current)
      next.delete(key)
      return next
    })
    setBookmarkLabels((current) => { const next = { ...current }; delete next[key]; return next })
    setBookmarkMemos((current) => { const next = { ...current }; delete next[key]; return next })
    void removeCloudBookmark(key)
  }

  const savedCount = typeEntries.filter((entry) => bookmarks.has(`${entry.eventSlug}:${entry.id}`)).length + stampRallies.filter((rally) => bookmarks.has(`${rally.eventSlug}:sr-${rally.id}`)).length
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
            { value: 'pickup_only', label: 'PO & Pick-Up', count: pickupEntries.length },
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
        {catalogueType === 'pickup_only' && <p className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm leading-relaxed text-red-800"><strong>PU XXX IS NOT THE FINAL BOOTH NUMBER</strong> — This is only a numbering system for pick-up catalogues on this website.</p>}
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
                      <Link aria-label={`View catalogue for booth ${booth}`} href={`/events/${catalogue.eventSlug}/catalogues/${catalogue.id}`} onClick={rememberCatalogueListPosition} className="flex h-9 w-full min-w-0 items-center justify-center overflow-hidden rounded-md border border-primary/30 bg-accent px-1.5 py-1 text-xs font-semibold leading-tight text-primary transition-colors hover:border-primary hover:bg-primary hover:text-primary-foreground sm:px-2 sm:text-sm">
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
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" aria-pressed={showBookmarkedOnly} onClick={() => setShowBookmarkedOnly((value) => !value)} className={cn('inline-flex w-fit items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold', showBookmarkedOnly ? 'border-foreground bg-foreground text-background' : 'border-input bg-background hover:bg-secondary')}><Bookmark className="size-4" aria-hidden="true" />{showBookmarkedOnly ? 'Showing saved stamp rallies' : 'Show saved stamp rallies'} ({savedCount})</button>
              {showBookmarkedOnly && <FilterDropdown label="Bookmark color" options={BOOKMARK_COLORS.map((color) => color.label)} selected={new Set(BOOKMARK_COLORS.filter((color) => bookmarkColorFilters.has(color.value)).map((color) => color.label))} onToggle={(label) => { const color = BOOKMARK_COLORS.find((choice) => choice.label === label); if (!color) return; setBookmarkColorFilters((current) => { const next = new Set(current); next.has(color.value) ? next.delete(color.value) : next.add(color.value); return next }) }} />}
            </div>
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
          {accountUsername ? <p className="text-xs font-semibold text-emerald-800">Signed in as @{accountUsername}; bookmarks sync to your account.</p> : <p className="text-xs leading-relaxed text-muted-foreground">
            Saved to this browser and device only; bookmarks don’t sync across browsers or devices. Clearing site data or ending a private session may remove them. <Link href="/account" className="font-semibold text-primary underline">Create an account to sync</Link>.
          </p>}
          {showBookmarkedOnly && <details className="group relative w-full sm:w-auto">
            <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-input bg-background px-3 py-2 text-sm font-semibold hover:border-foreground [&::-webkit-details-marker]:hidden">
              <span>Bookmark color{bookmarkColorFilters.size ? ` · ${bookmarkColorFilters.size}` : ''}</span>
              <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
            </summary>
            <div className="absolute left-0 z-30 mt-2 w-64 rounded-xl border border-border bg-card p-3 shadow-xl">
              <p className="px-1 pb-2 text-xs text-muted-foreground">Show saved catalogues by color</p>
              {BOOKMARK_COLORS.map((color) => <label key={color.value} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-2 text-sm hover:bg-secondary">
                <input type="checkbox" checked={bookmarkColorFilters.has(color.value)} onChange={() => {
                  setBookmarkColorFilters((current) => {
                    const next = new Set(current)
                    if (next.has(color.value)) next.delete(color.value)
                    else next.add(color.value)
                    return next
                  })
                  setPage(1)
                }} className="size-4 accent-primary" />
                <span className={cn('size-4 rounded-full border', color.swatch)} aria-hidden="true" />
                <span className="sr-only">{color.label}</span>
              </label>)}
              {bookmarkColorFilters.size > 0 && <button type="button" onClick={() => { setBookmarkColorFilters(new Set()); setPage(1) }} className="mt-2 px-2 text-xs font-semibold text-primary">Clear color filter</button>}
            </div>
          </details>}
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
                setBookmarkColorFilters(new Set())
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
            {filteredStampRallies.map((rally) => {
              const rallyKey = `${rally.eventSlug}:sr-${rally.id}`
              const rallyBookmarked = bookmarks.has(rallyKey)
              const rallyLabel = bookmarkLabels[rallyKey] ?? DEFAULT_BOOKMARK_LABEL
              return <li key={rally.id} className="flex flex-col gap-4 rounded-xl border border-border bg-card p-5">
                <div className="flex items-start justify-between gap-3"><h3 className="text-xl font-bold leading-tight">{rally.title}</h3><BookmarkEditor isBookmarked={rallyBookmarked} label={rallyLabel} memo={bookmarkMemos[rallyKey] ?? ''} onSave={(label, memo) => saveStampRallyBookmark(rally, label, memo)} onRemove={() => removeStampRallyBookmark(rally)} itemName={`${rally.title} · Stamp Rally`} iconOnly /></div>
                {rallyBookmarked && <details className="rounded-lg border border-amber-200 bg-amber-50/80 text-foreground"><summary className="group flex cursor-pointer list-none items-center gap-2 px-3 py-2 text-sm font-semibold [&::-webkit-details-marker]:hidden"><span className={cn('size-3.5 shrink-0 rounded-full border', BOOKMARK_COLORS.find((color) => color.value === rallyLabel.color)?.swatch)} aria-hidden="true" /><span className="min-w-0 truncate">{rallyLabel.name || 'Add a visit memo'}</span><ChevronDown className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" /></summary><div className="border-t border-amber-200 px-3 py-2 text-sm">{bookmarkMemos[rallyKey]?.trim() ? <p className="whitespace-pre-line break-words">{bookmarkMemos[rallyKey]}</p> : <p className="text-muted-foreground">No visit memo added.</p>}</div></details>}
                {rally.socialPostUrl?.trim() && <SocialPostEmbed postUrl={rally.socialPostUrl} title={`${rally.title} stamp rally post`} />}
                {cleanFandomTags(rally.fandom).length > 0 && (
                  <div>
                    <p className="text-xs font-bold">Fandom:</p>
                    <TagList tags={cleanFandomTags(rally.fandom)} label={`${rally.title} fandoms`} maxRows={2} />
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
                        return <li key={participant}>{entry ? <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} onClick={rememberCatalogueListPosition} className="inline-flex rounded-full border border-primary/30 bg-accent px-3 py-1.5 text-sm font-semibold text-primary hover:border-primary">{label}</Link> : <span className="inline-flex rounded-full border border-border bg-muted px-3 py-1.5 text-sm text-muted-foreground">{label}</span>}</li>
                      })}
                    </ul>
                  </div>
                )}
                {rally.description?.trim() && <p className="whitespace-pre-line text-sm leading-relaxed"><span className="font-bold">Description: </span>{rally.description}</p>}
                {rally.prizes?.trim() && <p className="whitespace-pre-line text-sm leading-relaxed"><span className="font-bold">Prizes: </span>{rally.prizes}</p>}
                {rally.method?.trim() && <p className="whitespace-pre-line text-sm leading-relaxed"><span className="font-bold">Method: </span>{rally.method}</p>}
              </li>
            })}
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
            const pickupCutoffDates = entry.catalogueType === 'pickup_only' ? parsePickupCutoffDates(entry.orderCutoff) : []
            const pickupCalendarEntries = pickupCutoffDates.map((cutoff, index) => ({
              sourceKey: 'pickup-cutoff:' + entry.eventSlug + ':' + entry.id + ':' + index + ':' + cutoff.date,
              category: 'pickup_cutoff' as const,
              title: entry.artistName + ' · Booth ' + entry.booth + ' · ' + (eventName || entry.eventSlug),
              detail: cutoff.note ? 'Order cutoff (' + cutoff.note + ')' : 'Order cutoff',
              date: cutoff.date,
            }))
            return (
            <li key={entry.id} className="relative z-0 flex flex-col rounded-xl border border-border bg-card hover:z-10">
              <div className="flex items-center justify-between rounded-t-xl bg-foreground px-4 py-3 text-background">
                <span className="text-xs font-bold uppercase tracking-wider">Booth number</span>
                <div className="flex items-center gap-2">
                  <span className="rounded-md bg-accent px-3 py-1 font-heading text-lg font-extrabold text-accent-foreground">{entry.booth}</span>
                  <BookmarkEditor
                    isBookmarked={isBookmarked}
                    label={bookmarkLabel}
                    memo={bookmarkMemos[entryKey] ?? ''}
                    onSave={(label, memo) => saveBookmark(entry, label, memo)}
                    onRemove={() => removeBookmark(entry)}
                    itemName={`${entry.artistName} · Booth ${entry.booth}`}
                    iconOnly
                  />
                </div>
              </div>
              <CataloguePreview entry={entry} hasCatalogueMaterial={hasCatalogueMaterial} onNavigate={rememberCatalogueListPosition} />
              {isBookmarked && <details className="border-b border-border bg-amber-50/80 text-foreground">
                <summary className="group flex cursor-pointer list-none items-center gap-2 px-4 py-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">
                  <span className={cn('size-3.5 shrink-0 rounded-full border', BOOKMARK_COLORS.find((color) => color.value === bookmarkLabel.color)?.swatch)} aria-hidden="true" />
                  <span className="min-w-0 truncate">{bookmarkLabel.name || 'Add a visit memo'}</span>
                  <ChevronDown className="ml-auto size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
                </summary>
                <div className="border-t border-amber-200 px-4 py-3 text-sm leading-relaxed">
                  {bookmarkMemos[entryKey]?.trim() ? <p className="whitespace-pre-line break-words">{bookmarkMemos[entryKey]}</p> : <p className="text-muted-foreground">No visit memo added.</p>}
                  <p className="mt-2 text-xs text-muted-foreground">Click the bookmark icon above to edit the label, color, or memo.</p>
                </div>
              </details>}
              {entry.catalogueType === 'pickup_only' && (entry.pickupNote?.trim() || entry.orderCutoff?.trim()) && (
                <div className="border-b border-border bg-accent/60 px-4 py-3 text-sm leading-relaxed text-foreground">
                  {entry.orderCutoff?.trim() && <p className="flex items-center justify-between gap-2"><span className="min-w-0 flex-1"><span className="font-bold">Order cutoff: </span>{entry.orderCutoff}</span>{pickupCalendarEntries.length > 0 && <CalendarReminderButton entries={pickupCalendarEntries} iconOnly />}</p>}
                  {entry.pickupNote?.trim() && <p><span className="font-bold">Pick-up note: </span>{entry.pickupNote}</p>}
                </div>
              )}
              <div className="flex flex-1 flex-col gap-3 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <h3 className="min-w-0 flex-1 text-lg font-bold leading-tight">
                    <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} onClick={rememberCatalogueListPosition} title={entry.artistName} className="block truncate hover:text-primary">{entry.artistName}</Link>
                  </h3>
                  {isViewed && <span className="inline-flex shrink-0 items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-800"><Check className="size-3.5" aria-hidden="true" />Viewed</span>}
                </div>
                {(() => {
                  const accounts = getArtistSocialAccounts(entry.artistInstagrams, entry.artistSocialLinks)
                  return (
                    <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-1.5">
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
                <div className="overflow-hidden rounded-lg border border-border bg-muted">
                  <CatalogueCover entry={entry} compact />
                </div>
                <p className={cn('text-xs font-semibold', hasCatalogueMaterial ? 'text-muted-foreground' : 'text-rose-700')}>
                  {hasCatalogueMaterial
                    ? `Catalogue available${entry.instagramPosts.length > 0 ? ` · ${entry.instagramPosts.length} Instagram post${entry.instagramPosts.length === 1 ? '' : 's'}` : ''}`
                    : 'Catalogue unavailable'}
                </p>
                <div>
                  <p className="text-xs font-bold">Fandom:</p>
                    <TagList tags={entry.fandoms} label="Fandoms" maxRows={2} />
                </div>
                <div className="mt-auto">
                  <p className="text-xs font-bold">Merch:</p>
                  <TagList tags={entry.merchTypes} label="Merch types" maxRows={2} outlined />
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
            onClick={() => goToPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-lg border border-input px-3 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>
          {pageNumbers.map((number, index) => (
            <span key={number} className="contents">
              {index > 0 && pageNumbers[index - 1] < number - 1 && <PageJump pageCount={pageCount} onSelect={goToPage} />}
              <button
                type="button"
                onClick={() => goToPage(number)}
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
            onClick={() => goToPage(Math.min(pageCount, currentPage + 1))}
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
