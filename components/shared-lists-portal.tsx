'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, Copy, Users } from 'lucide-react'
import {
  createBookmarkGroup,
  deleteBookmarkGroup,
  getAccountOverview,
  joinBookmarkGroup,
  leaveBookmarkGroup,
} from '@/app/actions/bookmark-accounts'

type Overview = Awaited<ReturnType<typeof getAccountOverview>>

export function SharedListsPortal() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loadError, setLoadError] = useState('')
  const [groupName, setGroupName] = useState('')
  const [eventSlug, setEventSlug] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copiedGroup, setCopiedGroup] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoadError('')
    try {
      const data = await getAccountOverview()
      setOverview(data)
      if ('error' in data && data.error) setLoadError(data.error)
    } catch {
      setLoadError('We couldn’t load shared lists right now. Please try again in a moment.')
    }
  }, [])
  useEffect(() => { void refresh() }, [refresh])

  const submitCreate = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const result = await createBookmarkGroup(groupName, eventSlug)
      setMessage(result.message)
      if (result.ok) { setGroupName(''); await refresh() }
    } catch { setMessage('Could not create the list. Please try again.') }
    setBusy(false)
  }

  const submitJoin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const result = await joinBookmarkGroup(inviteCode)
      setMessage(result.message)
      if (result.ok) { setInviteCode(''); await refresh() }
    } catch { setMessage('Could not join the list. Please try again.') }
    setBusy(false)
  }

  const groupAction = async (groupId: string, owner: boolean) => {
    if (owner && !window.confirm('Delete this shared list for everyone?')) return
    setBusy(true)
    try {
      const result = owner ? await deleteBookmarkGroup(groupId) : await leaveBookmarkGroup(groupId)
      setMessage(result.message)
      await refresh()
    } catch { setMessage('Could not update this shared list. Please try again.') }
    setBusy(false)
  }

  const copyCode = async (groupId: string, code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedGroup(groupId)
      window.setTimeout(() => setCopiedGroup(''), 1800)
    } catch { setMessage('Clipboard access is unavailable. You can select and copy the invite code manually.') }
  }

  if (!overview && !loadError) return <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Loading shared lists…</p>
  if (loadError) return <div role="alert" className="rounded-2xl border border-amber-300 bg-amber-50 p-5"><h2 className="font-extrabold">We couldn’t load shared lists</h2><p className="mt-2 text-sm leading-relaxed">{loadError}</p><button type="button" onClick={() => void refresh()} className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">Try again</button></div>
  if (!overview || !overview.signedIn) return <section className="rounded-2xl border border-border bg-card p-6 text-center"><h2 className="text-xl font-extrabold">Log in to manage shared lists</h2><p className="mt-2 text-sm text-muted-foreground">Sign in to create or join an event list.</p><Link href="/account" className="mt-4 inline-flex rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background">Go to account login</Link></section>

  return <div className="flex flex-col gap-6">
    <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <Link href="/account" className="text-sm font-semibold text-primary underline">← Account</Link>
      <div className="mt-4 flex items-center gap-2"><Users className="size-5 text-primary" /><h2 className="text-xl font-extrabold">Shared event lists</h2></div>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Create one list for an event and invite friends with its code. Members’ saved catalogues, labels, and visit notes appear together. You can edit only your own bookmarks.</p>
      <p className="mt-2 text-sm text-muted-foreground">Signed in as <strong>@{overview.username}</strong></p>
    </section>

    <div className="grid gap-5 md:grid-cols-2">
      <form onSubmit={submitCreate} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-extrabold">Create a shared list</h3>
        <label className="text-sm font-medium">List name<input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={60} required placeholder="Saturday plans" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3" /></label>
        <label className="text-sm font-medium">Event<select value={eventSlug} onChange={(event) => setEventSlug(event.target.value)} required className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3"><option value="">Choose an event…</option>{[...new Set(overview.events.map((event) => event.year))].map((year) => <optgroup key={year} label={String(year)}>{overview.events.filter((event) => event.year === year).map((event) => <option key={event.slug} value={event.slug}>{event.name}</option>)}</optgroup>)}</select></label>
        <button disabled={busy} className="mt-auto rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60">Create list</button>
      </form>
      <form onSubmit={submitJoin} className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-5 sm:p-6">
        <h3 className="font-extrabold">Join a shared list</h3>
        <label className="text-sm font-medium">Invite code<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} maxLength={8} minLength={8} required placeholder="8 characters" className="mt-1 h-10 w-full rounded-md border border-input bg-background px-3 uppercase tracking-widest" /></label>
        <p className="text-xs text-muted-foreground">Ask a group member to send you their invite code.</p>
        <button disabled={busy} className="mt-auto rounded-full border border-foreground px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">Join list</button>
      </form>
    </div>

    <section className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      <h3 className="font-extrabold">Your shared lists</h3>
      {overview.groups.length === 0 ? <p className="mt-3 rounded-lg border border-dashed border-border p-5 text-sm text-muted-foreground">You haven’t joined a shared list yet.</p> : <ul className="mt-3 flex flex-col gap-3">{overview.groups.map((group) => <li key={group.id} className="rounded-xl border border-border bg-background p-4">
        <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/account/groups/${group.id}`} className="font-bold text-primary underline underline-offset-2">{group.name}</Link><p className="mt-1 text-sm text-muted-foreground">{group.eventName} · {group.year} · {group.role}</p></div><button type="button" disabled={busy} onClick={() => void groupAction(group.id, group.role === 'owner')} className="text-sm font-semibold text-rose-700 underline disabled:opacity-60">{group.role === 'owner' ? 'Delete list' : 'Leave list'}</button></div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span>Invite code:</span><code className="rounded bg-muted px-2 py-1 font-bold tracking-widest">{group.inviteCode}</code><button type="button" onClick={() => void copyCode(group.id, group.inviteCode)} className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs font-semibold"><Copy className="size-3.5" />{copiedGroup === group.id ? <><Check className="size-3.5" />Copied</> : 'Copy'}</button></div>
      </li>)}</ul>}
    </section>
    {message && <p aria-live="polite" className="rounded-lg border border-primary/20 bg-accent/40 p-3 text-sm font-semibold">{message}</p>}
  </div>
}
