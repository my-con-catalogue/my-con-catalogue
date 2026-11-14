'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { getSharedBookmarkGroup } from '@/app/actions/bookmark-accounts'

type GroupResult = Awaited<ReturnType<typeof getSharedBookmarkGroup>>

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

export function SharedBookmarkGroup({ groupId }: { groupId: string }) {
  const [result, setResult] = useState<GroupResult | null>(null)
  const [query, setQuery] = useState('')
  const [fandoms, setFandoms] = useState<Set<string>>(new Set())
  const [merchTypes, setMerchTypes] = useState<Set<string>>(new Set())
  const [rally, setRally] = useState<Set<string>>(new Set())
  const [bookmarkColors, setBookmarkColors] = useState<Set<string>>(new Set())

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
      (!q || item.artistName.toLowerCase().includes(q) || item.booth.toLowerCase().includes(q) || item.username.toLowerCase().includes(q)) &&
      (!fandoms.size || item.fandoms.some((tag) => fandoms.has(tag))) && (!merchTypes.size || item.merchTypes.some((tag) => merchTypes.has(tag))) &&
      (!rally.size || rally.has(item.stampRally ? 'Yes' : 'No')) && (!bookmarkColors.size || bookmarkColors.has(item.labelColor)),
    )
  }, [result, query, fandoms, merchTypes, rally, bookmarkColors])

  if (!result) return <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Loading shared list…</p>
  if (!result.ok) return <div className="rounded-xl border border-border bg-card p-6"><p>{result.message}</p><Link href="/account" className="mt-3 inline-block font-semibold text-primary underline">Go to account</Link></div>

  const { group, members } = result
  return <div className="flex flex-col gap-6">
    <header className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <Link href="/account" className="text-sm font-semibold text-primary underline">← Account and shared lists</Link>
      <p className="mt-5 text-sm font-semibold uppercase tracking-wider text-primary">{group.eventName} · {group.year}</p>
      <h1 className="mt-1 text-3xl font-extrabold">{group.name}</h1>
      <p className="mt-2 text-sm text-muted-foreground">Shared with {members.length} {members.length === 1 ? 'member' : 'members'}: {members.map((member) => `@${member.username}`).join(', ')}</p>
      <p className="mt-2 text-sm text-muted-foreground">Each member’s saved catalogues from this event appear here. Labels and visit notes are shared with everyone in this list.</p>
    </header>
    <section className="rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap gap-2">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search artist, booth, member…" className="h-10 min-w-48 flex-1 rounded-lg border border-input bg-background px-3 text-sm" />
        <SharedFilter label="Fandom" options={fandomOptions.map((value) => ({ value, label: value }))} selected={fandoms} onToggle={toggleOption(setFandoms)} />
        <SharedFilter label="Merch type" options={merchOptions.map((value) => ({ value, label: value }))} selected={merchTypes} onToggle={toggleOption(setMerchTypes)} />
        <SharedFilter label="Stamp rally" options={[{ value: 'Yes', label: 'Yes' }, { value: 'No', label: 'No' }]} selected={rally} onToggle={toggleOption(setRally)} />
        <SharedFilter label="Bookmark color" options={[
          { value: 'rose', label: 'Rose', swatch: 'bg-rose-500' }, { value: 'blue', label: 'Blue', swatch: 'bg-sky-500' },
          { value: 'amber', label: 'Amber', swatch: 'bg-amber-500' }, { value: 'green', label: 'Green', swatch: 'bg-emerald-600' },
        ]} selected={bookmarkColors} onToggle={toggleOption(setBookmarkColors)} />
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-4 text-sm"><p>Showing <strong>{filtered.length}</strong> of {result.bookmarks.length} saved catalogues</p><button type="button" onClick={() => void refresh()} className="font-semibold text-primary underline">Refresh shared list</button></div>
    </section>
    {filtered.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No shared bookmarks match these filters yet.</p> : <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{filtered.map((item) => <li key={`${item.username}-${item.key}`} className="flex flex-col rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between rounded-t-xl bg-foreground px-4 py-3 text-background"><span className="text-xs font-bold uppercase tracking-wider">{item.username}&apos;s saved booth</span><span className="rounded-md bg-accent px-3 py-1 font-heading text-lg font-extrabold text-accent-foreground">{item.booth}</span></div>
      <Link href={`/events/${group.eventSlug}/catalogues/${item.catalogueId}`} className="border-b border-border bg-muted px-4 py-3 text-center text-base font-semibold text-primary underline-offset-2 hover:underline">{item.artistName}</Link>
      <div className="flex flex-col gap-3 p-4">
        {item.labelName && <span className={`w-fit rounded-full border px-2.5 py-1 text-xs font-semibold ${item.labelColor === 'rose' ? 'border-rose-200 bg-rose-100 text-rose-800' : item.labelColor === 'amber' ? 'border-amber-200 bg-amber-100 text-amber-900' : item.labelColor === 'green' ? 'border-emerald-200 bg-emerald-100 text-emerald-800' : 'border-blue-200 bg-blue-100 text-blue-800'}`}>{item.labelName}</span>}
        {item.memo && <p className="whitespace-pre-line break-words rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm leading-relaxed">{item.memo}</p>}
        <div><p className="text-xs font-bold">Fandom:</p><div className="mt-1 flex flex-wrap gap-1.5">{item.fandoms.map((tag) => <span key={tag} className="rounded-full bg-secondary px-2.5 py-1 text-xs">{tag}</span>)}</div></div>
        <div><p className="text-xs font-bold">Merch:</p><div className="mt-1 flex flex-wrap gap-1.5">{item.merchTypes.map((tag) => <span key={tag} className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground">{tag}</span>)}</div></div>
        <p className={`w-fit rounded-full border px-3 py-1 text-xs font-bold ${item.stampRally ? 'border-emerald-800 bg-emerald-700 text-white' : 'border-border bg-muted'}`}>Stamp Rally · {item.stampRally ? 'Yes' : 'No'}</p>
      </div>
    </li>)}</ul>}
  </div>
}
