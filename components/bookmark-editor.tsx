'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Bookmark } from 'lucide-react'
import { cn } from '@/lib/utils'

export type BookmarkColor = 'rose' | 'blue' | 'amber' | 'green'
export type BookmarkLabel = { name: string; color: BookmarkColor }

export const DEFAULT_BOOKMARK_LABEL: BookmarkLabel = { name: 'Interested', color: 'blue' }
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
const colorChoices: { value: BookmarkColor; label: string; swatch: string }[] = [
  { value: 'rose', label: 'Rose', swatch: 'bg-rose-500' },
  { value: 'blue', label: 'Blue', swatch: 'bg-sky-500' },
  { value: 'amber', label: 'Amber', swatch: 'bg-amber-500' },
  { value: 'green', label: 'Green', swatch: 'bg-emerald-600' },
]

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

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  const openEditor = () => {
    setDraftLabel(label)
    setDraftMemo(memo)
    setOpen(true)
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
          <label htmlFor={`bookmark-editor-label-${editorId}`} className="mt-5 block text-sm font-semibold">Label</label>
          <input
            id={`bookmark-editor-label-${editorId}`}
            value={draftLabel.name}
            onChange={(event) => setDraftLabel((current) => ({ ...current, name: event.target.value.slice(0, 32) }))}
            maxLength={32}
            placeholder="Priority, Interested, Maybe..."
            className="mt-1.5 h-10 w-full rounded-md border border-input bg-card px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <fieldset className="mt-4">
            <legend className="text-sm font-semibold">Bookmark color</legend>
            <div className="mt-2 grid grid-cols-4 gap-2">
              {colorChoices.map((choice) => (
                <button
                  key={choice.value}
                  type="button"
                  aria-pressed={draftLabel.color === choice.value}
                  onClick={() => setDraftLabel((current) => ({ ...current, color: choice.value }))}
                  className={cn('flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs font-medium', draftLabel.color === choice.value ? 'border-foreground bg-secondary ring-1 ring-foreground' : 'border-input hover:bg-secondary')}
                >
                  <span className={cn('size-5 rounded-full', choice.swatch)} aria-hidden="true" />{choice.label}
                </button>
              ))}
            </div>
          </fieldset>
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
              <button type="button" onClick={() => { onSave({ ...draftLabel, name: draftLabel.name.trim() || 'Saved' }, draftMemo.trim()); setOpen(false) }} className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">Save</button>
            </div>
          </div>
        </div>
      </dialog>
    </>
  )
}
