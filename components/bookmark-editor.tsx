'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Bookmark, Check, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BookmarkColor = 'rose' | 'blue' | 'amber' | 'green'
export type BookmarkLabel = { name: string; color: BookmarkColor }

export const DEFAULT_BOOKMARK_LABEL: BookmarkLabel = { name: '', color: 'blue' }
const COLOR_LABELS_STORAGE_KEY = 'mcc:bookmark-color-labels'
export const BOOKMARK_COLOR_STYLES: Record<BookmarkColor, string> = {
  rose: 'border-rose-200 bg-rose-100 text-rose-800',
  blue: 'border-blue-200 bg-blue-100 text-blue-800',
  amber: 'border-amber-200 bg-amber-100 text-amber-900',
  green: 'border-emerald-200 bg-emerald-100 text-emerald-800',
}
export function isBookmarkLabel(value: unknown): value is BookmarkLabel {
  if (!value || typeof value !== 'object') return false
  const candidate = value as Record<string, unknown>
  return typeof candidate.name === 'string' && typeof candidate.color === 'string' &&
    ['rose', 'blue', 'amber', 'green'].includes(candidate.color)
}
const BOOKMARK_ICON_STYLES: Record<BookmarkColor, string> = {
  rose: 'text-rose-300',
  blue: 'text-sky-300',
  amber: 'text-amber-300',
  green: 'text-emerald-300',
}
export const BOOKMARK_COLORS: { value: BookmarkColor; label: string; swatch: string }[] = [
  { value: 'rose', label: 'Rose', swatch: 'bg-rose-500' },
  { value: 'blue', label: 'Blue', swatch: 'bg-sky-500' },
  { value: 'amber', label: 'Amber', swatch: 'bg-amber-500' },
  { value: 'green', label: 'Green', swatch: 'bg-emerald-600' },
]

function rememberedColorLabel(color: BookmarkColor) {
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(COLOR_LABELS_STORAGE_KEY) ?? '{}')
    if (!value || typeof value !== 'object' || Array.isArray(value)) return ''
    const name = (value as Record<string, unknown>)[color]
    return typeof name === 'string' ? name : ''
  } catch {
    return ''
  }
}

export function BookmarkEditor({
  isBookmarked,
  label,
  memo,
  onSave,
  onRemove,
  itemName,
  iconOnly = false,
}: {
  isBookmarked: boolean
  label: BookmarkLabel
  memo: string
  onSave: (label: BookmarkLabel, memo: string) => void
  onRemove: () => void
  itemName: string
  iconOnly?: boolean
}) {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const editorId = useId()
  const [open, setOpen] = useState(false)
  const [draftLabel, setDraftLabel] = useState(label)
  const [draftMemo, setDraftMemo] = useState(memo)
  const [colorMenuOpen, setColorMenuOpen] = useState(false)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const openEditor = () => {
    setDraftLabel(isBookmarked || label.name ? label : { ...label, name: rememberedColorLabel(label.color) })
    setDraftMemo(memo)
    setOpen(true)
  }

  const save = () => {
    const cleanLabel = draftLabel.name.trim()
    onSave({ ...draftLabel, name: cleanLabel }, draftMemo.trim())
    if (cleanLabel) {
      try {
        const current: unknown = JSON.parse(window.localStorage.getItem(COLOR_LABELS_STORAGE_KEY) ?? '{}')
        const labels = current && typeof current === 'object' && !Array.isArray(current) ? current as Record<string, string> : {}
        labels[draftLabel.color] = cleanLabel
        window.localStorage.setItem(COLOR_LABELS_STORAGE_KEY, JSON.stringify(labels))
      } catch {
        // The bookmark itself can still be saved when browser storage is unavailable.
      }
    }
    setOpen(false)
  }

  return (
    <>
      <button
        type="button"
        onClick={openEditor}
        aria-label={`${isBookmarked ? 'Edit bookmark for' : 'Bookmark'} ${itemName}`}
        aria-pressed={isBookmarked}
        title={isBookmarked ? 'Edit bookmark' : 'Save bookmark'}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-md p-2 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent',
          !iconOnly && 'rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary',
        )}
      >
        <Bookmark className={cn('size-5', isBookmarked && 'fill-current', isBookmarked && BOOKMARK_ICON_STYLES[label.color])} aria-hidden="true" />
        {!iconOnly && (isBookmarked ? 'Edit saved bookmark' : 'Save this catalogue')}
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`bookmark-editor-title-${editorId}`}
        onClose={() => setOpen(false)}
        className="m-auto w-[min(92vw,28rem)] rounded-2xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60"
      >
        <div className="p-5 sm:p-6">
          <h2 id={`bookmark-editor-title-${editorId}`} className="text-xl font-extrabold">{isBookmarked ? 'Edit saved bookmark' : 'Save this catalogue'}</h2>
          <p className="mt-1 text-sm text-muted-foreground">{itemName}</p>
          <div className="mt-5 grid grid-cols-[7.5rem_minmax(0,1fr)] items-end gap-3">
            <div className="relative text-sm font-semibold">
              <span className="mb-1.5 block">Color</span>
              <button type="button" aria-label="Choose bookmark color" aria-expanded={colorMenuOpen} onClick={() => setColorMenuOpen((value) => !value)} className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-card px-3 outline-none focus-visible:ring-2 focus-visible:ring-ring">
                <span className={cn('size-5 rounded-full border border-black/10', BOOKMARK_COLORS.find((choice) => choice.value === draftLabel.color)?.swatch)} aria-hidden="true" />
                <ChevronDown className={cn('size-4 transition-transform', colorMenuOpen && 'rotate-180')} aria-hidden="true" />
              </button>
              {colorMenuOpen && <div className="absolute left-0 top-full z-40 mt-1 flex w-full flex-col gap-1 rounded-md border border-input bg-card p-1.5 shadow-lg" role="listbox" aria-label="Bookmark colors">
                {BOOKMARK_COLORS.map((choice) => <button key={choice.value} type="button" role="option" aria-selected={draftLabel.color === choice.value} aria-label={choice.label} title={choice.label} onClick={() => {
                  setDraftLabel((current) => ({ ...current, color: choice.value, name: rememberedColorLabel(choice.value) }))
                  setColorMenuOpen(false)
                }} className="relative flex h-9 items-center justify-center rounded hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  <span className={cn('size-5 rounded-full border border-black/10', choice.swatch)} aria-hidden="true" />
                  {draftLabel.color === choice.value && <Check className="absolute right-3 size-4" aria-hidden="true" />}
                </button>)}
              </div>}
            </div>
            <label htmlFor={`bookmark-editor-label-${editorId}`} className="block text-sm font-semibold">
              <span className="mb-1.5 block">Label</span>
              <input
                id={`bookmark-editor-label-${editorId}`}
                value={draftLabel.name}
                onChange={(event) => setDraftLabel((current) => ({ ...current, name: event.target.value.slice(0, 32) }))}
                maxLength={32}
                placeholder=""
                className="h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </label>
          </div>
          <label htmlFor={`bookmark-editor-memo-${editorId}`} className="mt-4 block text-sm font-semibold">Note <span className="font-normal text-muted-foreground">(optional)</span></label>
          <textarea
            id={`bookmark-editor-memo-${editorId}`}
            value={draftMemo}
            onChange={(event) => setDraftMemo(event.target.value)}
            rows={3}
            maxLength={500}
            placeholder="A reminder for your visit..."
            className="mt-1.5 w-full resize-y rounded-md border border-input bg-card px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
            {isBookmarked ? (
              <button type="button" onClick={() => { onRemove(); setOpen(false) }} className="rounded-full px-3 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50">Remove bookmark</button>
            ) : <span />}
            <div className="ml-auto flex gap-2">
              <button type="button" onClick={() => setOpen(false)} className="rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-secondary">Cancel</button>
              <button type="button" onClick={save} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">Save</button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
