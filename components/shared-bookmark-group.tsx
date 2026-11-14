'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { BookmarkEditor, BOOKMARK_COLOR_STYLES, BOOKMARK_COLORS, type BookmarkColor } from '@/components/bookmark-editor'
import { getSharedBookmarkGroup, removeOwnSharedBookmark, updateOwnSharedBookmark } from '@/app/actions/bookmark-accounts'

type GroupResult = Awaited<ReturnType<typeof getSharedBookmarkGroup>>
type LabelColor = 'rose' | 'blue' | 'amber' | 'green'

function SharedFilter({ label, options, selected, onToggle }: { label: string; options: { value: string; label: string; swatch?: string }[]; selected: Set<string>; onToggle: (value: string) => void }) {
  if (!options.length) return null
  return <details className="group relative">
    <summary className="flex h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-lg border border-input bg-background px-3 text-sm font-semibold [&::-webkit-details-marker]:hidden">{label}{selected.size > 0 ? ` · ${selected.size}` : ''}<span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180">⌄</span></summary>
    <div className="absolute left-0 z-20 mt-1 max-h-60 min-w-56 overflow-y-auto rounded-lg border border-border bg-card p-2 shadow-lg">
      {options.map((option) => <label key={option.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-2 text-sm hover:bg-muted">
        <input type="checkbox" checked={selected.has(option.value)} onChange={() => onToggle(option.value)} className="size-4 accent-primary" />
        {option.swatch && <span className={`size-3.5 rounded-full border ${option.swatch}`} aria-hidden="true" />}
        <span className="min-w-0">{option.label}</span>
      </label>)}
    </div>
  </details>
}

function TagList({ title, values, merch = false }: { title: string; values: string[]; merch?: boolean }) {
  return <div><p className="text-xs font-bold">{title}:</p><div className="mt-1 flex flex-wrap gap-1.5">{values.length ? values.map((tag) => <span key={tag} className={`rounded-full px-2.5 py-1 text-xs ${merch ? 'border border-border text-muted-foreground' : 'bg-secondary'}`}>{tag}</span>) : <span className="text-xs text-muted-foreground">None listed</span>}</div></div>
}

export function SharedBookmarkGroup({ groupId }: { groupId: string }) {
  const [result, setResult] = useState<GroupResult | null>(null)
  const [query, setQuery] = useState('')
  const [fandoms, setFandoms] = useState<Set<string>>(new Set())
  const [merchTypes, setMerchTypes] = useState<Set<string>>(new Set())
  const [rally, setRally] = useState<Set<string>>(new Set())
  const [bookmarkColors, setBookmarkColors] = useState<Set<string>>(new Set())
  const [notice, setNotice] = useState('')

  const refresh = async () => setResult(await getSharedBookmarkGroup(groupId))
  useEffect(() => { void refresh() }, [groupId])

  const fandomOptions = useMemo(() => result?.ok ? [...new Set(result.bookmarks.flatMap((item) => item.fandoms))].sort((a, b) => a.localeCompare(b)) : [], [result])
  const merchOptions = useMemo(() => result?.ok ? [...new Set(result.bookmarks.flatMap((item) => item.merchTypes))].sort((a, b) => a.localeCompare(b)) : [], [result])
  const toggleOption = (setter: (update: (current: Set<string>) => Set<string>) => void) => (value: string) => setter((current) => {
    const next = new Set(current)
    if (next.has(value)) next.delete(value)
    else next.add(value)
    return next
  })
  const filtered = useMemo(() => {
    if (!result?.ok) return []
    const q = query.trim().toLowerCase()
    return result.bookmarks.filter((item) =>
      (!q || item.artistName.toLowerCase().includes(q) || item.booth.toLowerCase().includes(q) || item.annotations.some((annotation) => annotation.username.toLowerCase().includes(q))) &&
      (!fandoms.size || item.fandoms.some((tag) => fandoms.has(tag))) && (!merchTypes.size || item.merchTypes.some((tag) => merchTypes.has(tag))) &&
      (!rally.size || rally.has(item.stampRally ? 'Yes' : 'No')) && (!bookmarkColors.size || item.annotations.some((annotation) => bookmarkColors.has(annotation.labelColor))),
    )
  }, [result, query, fandoms, merchTypes, rally, bookmarkColors])

  if (!result) return <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Loading shared list…</p>
  if (!result.ok) return <div className="rounded-xl border border-border bg-card p-6"><p>{result.message}</p><Link href="/account" className="mt-3 inline-block font-semibold text-primary underline">Go to account</Link></div>

  const { group, members } = result
  const eventHeading = group.eventName.trim().match(new RegExp(`(?:\\s*[·–—-]\\s*|\\s+)${group.year}$`)) ? group.eventName : `${group.eventName} · ${group.year}`
  const changeBookmark = async (key: string, label: { name: string; color: BookmarkColor }, memo: string) => {
    const updated = await updateOwnSharedBookmark(groupId, { key, labelName: label.name, labelColor: label.color, memo })
    setNotice(updated.message)
    if (updated.ok) await refresh()
  }
  const deleteBookmark = async (key: string) => {
    const removed = await removeOwnSharedBookmark(groupId, key)
    setNotice(removed.message)
    if (removed.ok) await refresh()
  }

  return <div className="flex flex-col gap-6">
    <header className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <Link href="/account" className="text-sm font-semibold text-primary underline">← Account and shared lists</Link>
      <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">{eventHeading}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{group.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Shared with {members.length} {members.length === 1 ? 'member' : 'members'}: {members.map((member) => `@${member.username}`).join(', ')}</p>
      <p className="mt-2 text-sm text-muted-foreground">Each booth appears once. Labels and visit notes are shown by member; you can edit or remove only your own bookmark.</p>
    </header>
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artist, booth, member…" className="h-10 min-w-48 flex-1 rounded-lg border border-input bg-background px-3 text-sm" />
        <SharedFilter label="Fandom" options={fandomOptions.map((value) => ({ value, label: value }))} selected={fandoms} onToggle={toggleOption(setFandoms)} />
        <SharedFilter label="Merch type" options={merchOptions.map((value) => ({ value, label: value }))} selected={merchTypes} onToggle={toggleOption(setMerchTypes)} />
        <SharedFilter label="Stamp rally" options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} selected={rally} onToggle={toggleOption(setRally)} />
        <SharedFilter label="Bookmark color" options={BOOKMARK_COLORS.map((choice) => ({ value: choice.value, label: choice.label, swatch: choice.swatch }))} selected={bookmarkColors} onToggle={toggleOption(setBookmarkColors)} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm"><p>Showing <strong>{filtered.length}</strong> of {result.bookmarks.length} saved booths</p><button type="button" onClick={() => void refresh()} className="font-semibold text-primary underline">Refresh shared list</button></div>
      {notice && <p aria-live="polite" className="mt-3 text-sm font-semibold text-primary">{notice}</p>}
    </section>
    {filtered.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No shared bookmarks match these filters yet.</p> : <ul className="grid gap-4">{filtered.map((item) => <li key={item.key} className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(16rem,0.72fr)]">
        <article className="flex min-w-0 flex-col border-b border-border lg:border-b-0 lg:border-r">
          <div className="flex items-center justify-between gap-3 rounded-t-xl bg-foreground px-4 py-3 text-background"><span className="text-xs font-bold uppercase tracking-wider">Booth number</span><span className="max-w-[65%] truncate rounded-md bg-accent px-3 py-1 font-heading text-lg font-extrabold text-accent-foreground" title={item.booth}>{item.booth}</span></div>
          <Link href={`/events/${group.eventSlug}/catalogues/${item.catalogueId}`} className="border-b border-border bg-muted px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-muted/80">› Check catalogue material here ‹</Link>
          <div className="flex flex-1 flex-col gap-4 p-4">
            <h2 className="text-xl font-extrabold"><Link href={`/events/${group.eventSlug}/catalogues/${item.catalogueId}`} className="hover:text-primary">{item.artistName}</Link></h2>
            <div className="grid gap-3 sm:grid-cols-2"><TagList title="Fandom" values={item.fandoms} /><TagList title="Merch" values={item.merchTypes} merch /></div>
            <p className={`mt-auto w-fit rounded-full border px-3 py-1 text-xs font-bold ${item.stampRally ? 'border-emerald-800 bg-emerald-700 text-white' : 'border-border bg-muted'}`}>Stamp Rally · {item.stampRally ? 'Yes' : 'No'}</p>
          </div>
        </article>
        <aside className="bg-background p-4 sm:p-5">
          <h3 className="text-sm font-extrabold">Saved by members</h3>
          <ul className="mt-3 flex flex-col gap-3">{item.annotations.map((annotation) => <li key={annotation.username} className="rounded-lg border border-border bg-card p-3">
            <div className="flex flex-wrap items-center justify-between gap-2"><span className="text-sm font-bold">@{annotation.username}{annotation.isViewer ? ' · You' : ''}</span>{annotation.isViewer && <BookmarkEditor isBookmarked label={{ name: annotation.labelName, color: annotation.labelColor as LabelColor }} memo={annotation.memo} itemName={`${item.booth} · ${item.artistName}`} onSave={(label, memo) => { void changeBookmark(item.key, label, memo) }} onRemove={() => { void deleteBookmark(item.key) }} iconOnly />}</div>
            {annotation.labelName && <span className={`mt-2 inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${BOOKMARK_COLOR_STYLES[annotation.labelColor as LabelColor]}`}>{annotation.labelName}</span>}
            {annotation.memo ? <p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed">{annotation.memo}</p> : <p className="mt-2 text-xs text-muted-foreground">No visit note.</p>}
          </li>)}</ul>
        </aside>
      </div>
    </li>)}</ul>}
  </div>
}
