'use client'

import { useEffect, useState } from 'react'
import { BookmarkEditor, BOOKMARK_COLOR_STYLES, DEFAULT_BOOKMARK_LABEL, isBookmarkLabel, type BookmarkLabel } from '@/components/bookmark-editor'

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
    <section aria-label="Catalogue bookmark" className="mt-5 rounded-xl border border-border bg-card p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <BookmarkEditor isBookmarked={bookmarked} label={label} memo={memo} onSave={save} onRemove={remove} itemName={itemName} />
        {bookmarked && <span className={`rounded-full border px-3 py-1 text-sm font-semibold ${BOOKMARK_COLOR_STYLES[label.color]}`}>{label.name || 'Saved'}</span>}
      </div>
      {bookmarked && memo.trim() && <p className="mt-3 whitespace-pre-line break-words rounded-lg border border-border bg-background px-3 py-2 text-sm leading-relaxed"><span className="font-semibold">Your note:</span> {memo}</p>}
      <p className="mt-2 text-xs text-muted-foreground">Saved on this browser and device only.</p>
    </section>
  )
}
