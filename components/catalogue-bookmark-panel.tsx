'use client'

import { useEffect, useState } from 'react'
import { BookmarkEditor, BOOKMARK_COLOR_STYLES, BOOKMARK_COLORS, DEFAULT_BOOKMARK_LABEL, isBookmarkLabel, type BookmarkLabel } from '@/components/bookmark-editor'

const BOOKMARKS_KEY = 'mcc:bookmarked-catalogues'
const LABELS_KEY = 'mcc:bookmark-labels'
const MEMOS_KEY = 'mcc:bookmark-memos'
const SYNC_EVENT = 'mcc:bookmarks-updated'

function readArray(key: string) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '[]')
    return new Set(Array.isArray(value) ? value.filter((item): item is string => typeof item === 'string') : [])
  } catch {
    return new Set<string>()
  }
}

function readObject<T>(key: string, validate: (value: unknown) => value is T): Record<string, T> {
  try {
    const value = JSON.parse(window.localStorage.getItem(key) ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {}
    return Object.fromEntries(Object.entries(value).filter((entry): entry is [string, T] => validate(entry[1])))
  } catch {
    return {}
  }
}

function isString(value: unknown): value is string {
  return typeof value === 'string'
}

export function CatalogueBookmarkPanel({ catalogueKey, itemName }: { catalogueKey: string; itemName: string }) {
  const [bookmarked, setBookmarked] = useState(false)
  const [label, setLabel] = useState<BookmarkLabel>(DEFAULT_BOOKMARK_LABEL)
  const [memo, setMemo] = useState('')

  useEffect(() => {
    const sync = () => {
      setBookmarked(readArray(BOOKMARKS_KEY).has(catalogueKey))
      setLabel(readObject<BookmarkLabel>(LABELS_KEY, isBookmarkLabel)[catalogueKey] ?? DEFAULT_BOOKMARK_LABEL)
      setMemo(readObject<string>(MEMOS_KEY, isString)[catalogueKey] ?? '')
    }
    sync()
    window.addEventListener('storage', sync)
    window.addEventListener(SYNC_EVENT, sync)
    return () => {
      window.removeEventListener('storage', sync)
      window.removeEventListener(SYNC_EVENT, sync)
    }
  }, [catalogueKey])

  const save = (nextLabel: BookmarkLabel, nextMemo: string) => {
    const saved = readArray(BOOKMARKS_KEY)
    saved.add(catalogueKey)
    const labels = readObject<BookmarkLabel>(LABELS_KEY, isBookmarkLabel)
    labels[catalogueKey] = nextLabel
    const memos = readObject<string>(MEMOS_KEY, isString)
    memos[catalogueKey] = nextMemo
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...saved]))
    window.localStorage.setItem(LABELS_KEY, JSON.stringify(labels))
    window.localStorage.setItem(MEMOS_KEY, JSON.stringify(memos))
    setBookmarked(true)
    setLabel(nextLabel)
    setMemo(nextMemo)
    window.dispatchEvent(new Event(SYNC_EVENT))
  }

  const remove = () => {
    const saved = readArray(BOOKMARKS_KEY)
    saved.delete(catalogueKey)
    const labels = readObject<BookmarkLabel>(LABELS_KEY, isBookmarkLabel)
    const memos = readObject<string>(MEMOS_KEY, isString)
    delete labels[catalogueKey]
    delete memos[catalogueKey]
    window.localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...saved]))
    window.localStorage.setItem(LABELS_KEY, JSON.stringify(labels))
    window.localStorage.setItem(MEMOS_KEY, JSON.stringify(memos))
    setBookmarked(false)
    setLabel(DEFAULT_BOOKMARK_LABEL)
    setMemo('')
    window.dispatchEvent(new Event(SYNC_EVENT))
  }

  return (
    <section aria-label="Catalogue bookmark" className="mt-5 overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 p-4">
        <BookmarkEditor isBookmarked={bookmarked} label={label} memo={memo} onSave={save} onRemove={remove} itemName={itemName} />
        {bookmarked && label.name && <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${BOOKMARK_COLOR_STYLES[label.color]}`}>{label.name}</span>}
      </div>
      {bookmarked ? <details open={Boolean(memo.trim())} className="group border-t border-amber-200 bg-amber-50/80 text-foreground">
        <summary className="flex cursor-pointer list-none items-center gap-2 px-4 py-3 font-semibold [&::-webkit-details-marker]:hidden">
          <span className={`size-3.5 shrink-0 rounded-full border ${BOOKMARK_COLORS.find((color) => color.value === label.color)?.swatch}`} aria-hidden="true" />
          <span>{label.name || 'Add a visit memo'}</span>
          <span className="ml-auto text-lg leading-none transition-transform group-open:rotate-90" aria-hidden="true">›</span>
        </summary>
        <div className="border-t border-amber-200 px-4 py-3 text-sm leading-relaxed">
          {memo.trim() ? <p className="whitespace-pre-line break-words">{memo}</p> : <p className="text-muted-foreground">No visit memo added.</p>}
          <p className="mt-2 text-xs text-muted-foreground">Use the bookmark control above to edit this label or memo.</p>
        </div>
      </details> : null}
      <p className="px-4 pb-3 text-xs text-muted-foreground">Saved on this browser and device only.</p>
    </section>
  )
}
