'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Check, Copy, LogOut, Users } from 'lucide-react'
import {
  createBookmarkGroup,
  createRecoveryCodeForCurrentUser,
  createUsernameAccount,
  deleteBookmarkGroup,
  getAccountOverview,
  joinBookmarkGroup,
  leaveBookmarkGroup,
  loginUsernameAccount,
  logoutUsernameAccount,
  resetPasswordWithRecoveryCode,
  getCloudBookmarks,
  syncCloudBookmarks,
} from '@/app/actions/bookmark-accounts'

type Overview = Awaited<ReturnType<typeof getAccountOverview>>

export function AccountPortal() {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [mode, setMode] = useState<'login' | 'create' | 'recover'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [recoveryInput, setRecoveryInput] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [remember, setRemember] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [groupName, setGroupName] = useState('')
  const [eventSlug, setEventSlug] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [copiedGroup, setCopiedGroup] = useState('')
  const [syncedUsername, setSyncedUsername] = useState('')

  const refresh = useCallback(async () => setOverview(await getAccountOverview()), [])
  useEffect(() => { void refresh() }, [refresh])

  useEffect(() => {
    if (!overview) return
    if (!overview.signedIn) { setSyncedUsername(''); return }
    if (syncedUsername === overview.username) return
    let active = true
    void getCloudBookmarks().then(async (cloud) => {
      if (!cloud || !active) return
      try {
        const parse = (key: string, fallback: unknown) => {
          try { return JSON.parse(window.localStorage.getItem(key) ?? JSON.stringify(fallback)) as unknown } catch { return fallback }
        }
        const storedKeys = parse('mcc:bookmarked-catalogues', [])
        const storedLabels = parse('mcc:bookmark-labels', {})
        const storedMemos = parse('mcc:bookmark-memos', {})
        const localKeys = Array.isArray(storedKeys) ? storedKeys.filter((value): value is string => typeof value === 'string') : []
        const labels = storedLabels && typeof storedLabels === 'object' && !Array.isArray(storedLabels) ? { ...storedLabels as Record<string, { name: string; color: 'rose' | 'blue' | 'amber' | 'green' }> } : {}
        const memos = storedMemos && typeof storedMemos === 'object' && !Array.isArray(storedMemos) ? { ...storedMemos as Record<string, string> } : {}
        const keys = new Set(localKeys)
        for (const item of cloud.bookmarks) {
          keys.add(item.key)
          if (!Object.hasOwn(labels, item.key)) labels[item.key] = { name: item.labelName, color: item.labelColor }
          if (!Object.hasOwn(memos, item.key)) memos[item.key] = item.memo
        }
        if (!active) return
        window.localStorage.setItem('mcc:bookmarked-catalogues', JSON.stringify([...keys]))
        window.localStorage.setItem('mcc:bookmark-labels', JSON.stringify(labels))
        window.localStorage.setItem('mcc:bookmark-memos', JSON.stringify(memos))
        await syncCloudBookmarks([...keys].map((key) => ({ key, labelName: labels[key]?.name ?? '', labelColor: labels[key]?.color ?? 'blue', memo: memos[key] ?? '' })))
        setSyncedUsername(overview.username)
      } catch {
        // Keep account controls usable if local browser storage is unavailable.
      }
    }).catch(() => undefined)
    return () => { active = false }
  }, [overview, syncedUsername])

  const submitCredentials = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    const result = mode === 'create'
      ? await createUsernameAccount(username, password, remember)
      : mode === 'recover'
        ? await resetPasswordWithRecoveryCode(username, recoveryInput, password)
        : await loginUsernameAccount(username, password, remember)
    setMessage(result.message)
    if (result.recoveryCode) setRecoveryCode(result.recoveryCode)
    if (result.ok) {
      setPassword('')
      setRecoveryInput('')
      await refresh()
    }
    setBusy(false)
  }

  const submitCreateGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    const result = await createBookmarkGroup(groupName, eventSlug)
    setMessage(result.message)
    if (result.ok) { setGroupName(''); await refresh() }
    setBusy(false)
  }

  const submitJoinGroup = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setBusy(true)
    const result = await joinBookmarkGroup(inviteCode)
    setMessage(result.message)
    if (result.ok) { setInviteCode(''); await refresh() }
    setBusy(false)
  }

  const groupAction = async (groupId: string, owner: boolean) => {
    if (owner && !window.confirm('Delete this shared list for everyone?')) return
    setBusy(true)
    const result = owner ? await deleteBookmarkGroup(groupId) : await leaveBookmarkGroup(groupId)
    setMessage(result.message)
    await refresh()
    setBusy(false)
  }

  const copyCode = async (groupId: string, code: string) => {
    await navigator.clipboard.writeText(code)
    setCopiedGroup(groupId)
    window.setTimeout(() => setCopiedGroup(''), 1800)
  }

  const generateRecoveryCode = async () => {
    if (overview?.signedIn && overview.hasRecoveryCode && !window.confirm('Replace your existing recovery code? The old code will stop working immediately.')) return
    setBusy(true)
    const result = await createRecoveryCodeForCurrentUser()
    setMessage(result.message)
    if (result.recoveryCode) setRecoveryCode(result.recoveryCode)
    if (result.ok) await refresh()
    setBusy(false)
  }

  const recoveryCodeNotice = recoveryCode ? <aside className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-foreground">
    <p className="font-bold">Save this recovery code now</p>
    <p className="mt-1 text-sm leading-relaxed">It is shown only once. If you forget your password, this code lets you reset it without email. After a reset, you’ll receive a replacement code.</p>
    <code className="mt-3 block break-all rounded-lg border border-amber-300 bg-white p-3 text-center font-mono text-sm font-bold tracking-wide">{recoveryCode}</code>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={() => void navigator.clipboard.writeText(recoveryCode)} className="rounded-full border border-amber-700 px-3 py-1.5 text-sm font-semibold">Copy code</button>
      <button type="button" onClick={() => setRecoveryCode('')} className="rounded-full bg-foreground px-3 py-1.5 text-sm font-semibold text-background">I saved it</button>
    </div>
  </aside> : null

  if (!overview) return <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Loading account…</p>

  if (!overview.signedIn) return (
    <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-5 shadow-sm sm:p-7">
      {mode !== 'recover' ? <div className="flex gap-2 rounded-full border border-border bg-background p-1">
        <button type="button" onClick={() => { setMode('login'); setMessage('') }} aria-pressed={mode === 'login'} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'login' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>Log in</button>
        <button type="button" onClick={() => { setMode('create'); setMessage('') }} aria-pressed={mode === 'create'} className={`flex-1 rounded-full px-4 py-2 text-sm font-semibold ${mode === 'create' ? 'bg-foreground text-background' : 'hover:bg-muted'}`}>Create account</button>
      </div> : <div className="flex items-center justify-between"><h2 className="text-xl font-extrabold">Reset password</h2><button type="button" onClick={() => { setMode('login'); setMessage('') }} className="text-sm font-semibold text-primary underline">Back to login</button></div>}
      <form onSubmit={submitCredentials} className="mt-5 flex flex-col gap-4">
        <label className="text-sm font-semibold">Username
          <input value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" minLength={3} maxLength={24} pattern="[A-Za-z0-9_]{3,24}" required className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {mode === 'create' && <span className="mt-1 block text-xs font-normal text-muted-foreground">3–24 letters, numbers, or underscores. Usernames are not case-sensitive.</span>}
        </label>
        {mode === 'recover' && <label className="text-sm font-semibold">Recovery code
          <input value={recoveryInput} onChange={(event) => setRecoveryInput(event.target.value.toUpperCase())} autoComplete="off" placeholder="8-character groups separated by hyphens" required className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 font-mono text-sm font-normal uppercase outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </label>}
        <label className="text-sm font-semibold">{mode === 'recover' ? 'New password' : 'Password'}
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? undefined : 8} maxLength={128} required className="mt-1.5 h-11 w-full rounded-lg border border-input bg-background px-3 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
          {mode !== 'login' && <span className="mt-1 block text-xs font-normal text-muted-foreground">At least 8 characters. Use a password you do not use elsewhere.</span>}
        </label>
        {mode !== 'recover' && <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={remember} onChange={(event) => setRemember(event.target.checked)} className="size-4 accent-primary" />Remember me on this device</label>}
        <button disabled={busy} className="rounded-full bg-foreground px-5 py-3 font-semibold text-background disabled:opacity-60">{busy ? 'Please wait…' : mode === 'create' ? 'Create account' : mode === 'recover' ? 'Reset password' : 'Log in'}</button>
      </form>
      {mode === 'login' && <button type="button" onClick={() => { setMode('recover'); setMessage('') }} className="mt-3 text-sm font-semibold text-primary underline">Forgot password? Use your recovery code</button>}
      {mode === 'create' && <p className="mt-5 font-bold leading-relaxed text-red-700">Please SAVE THE ONE-TIME RECOVERY CODE shown when you create your account for future password resets</p>}
      <p className="mt-3 text-xs leading-relaxed text-muted-foreground">When you sign in on this browser, its existing bookmarks, labels, and notes merge into your account. On shared devices, this may include bookmarks left by another browser user.</p>
      {recoveryCodeNotice}
      {message && <p aria-live="polite" className="mt-3 text-sm font-semibold text-primary">{message}</p>}
    </div>
  )

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><p className="text-sm text-muted-foreground">Signed in as</p><h2 className="text-2xl font-extrabold">@{overview.username}</h2><p className="mt-1 text-sm text-muted-foreground">Your saved catalogues sync to this account. Bookmarks already on this browser are merged automatically.</p></div>
          <button type="button" onClick={async () => { await logoutUsernameAccount(); setMessage('You are logged out.'); await refresh() }} className="inline-flex items-center gap-2 rounded-full border border-input px-4 py-2 text-sm font-semibold hover:bg-muted"><LogOut className="size-4" />Log out</button>
        </div>
      </section>
      {recoveryCodeNotice}
      {!recoveryCode && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
        <h2 className="font-extrabold">Password recovery code</h2>
        <p className="mt-1 text-sm leading-relaxed">{overview.hasRecoveryCode ? 'A recovery code is already set. If you misplaced it, you can replace it here; the old code will stop working.' : 'Generate and save a recovery code so you can reset your password without email.'}</p>
        <button type="button" disabled={busy} onClick={() => void generateRecoveryCode()} className="mt-3 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60">{overview.hasRecoveryCode ? 'Replace recovery code' : 'Generate recovery code'}</button>
      </section>}
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex items-center gap-2"><Users className="size-5 text-primary" /><h2 className="text-xl font-extrabold">Shared event lists</h2></div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Create one shared list for an event and invite friends with its code. Members’ saved catalogues for that event, including their labels and visit notes, are visible to everyone in the group.</p>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          <form onSubmit={submitCreateGroup} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
            <h3 className="font-bold">Create a shared list</h3>
            <label className="text-sm font-medium">List name<input value={groupName} onChange={(event) => setGroupName(event.target.value)} maxLength={60} required placeholder="Saturday plans" className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3" /></label>
            <label className="text-sm font-medium">Event<select value={eventSlug} onChange={(event) => setEventSlug(event.target.value)} required className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3"><option value="">Choose an event…</option>{overview.events.map((event) => <option key={event.slug} value={event.slug}>{event.name}</option>)}</select></label>
            <button disabled={busy} className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background disabled:opacity-60">Create list</button>
          </form>
          <form onSubmit={submitJoinGroup} className="flex flex-col gap-3 rounded-xl border border-border bg-background p-4">
            <h3 className="font-bold">Join a shared list</h3>
            <label className="text-sm font-medium">Invite code<input value={inviteCode} onChange={(event) => setInviteCode(event.target.value.toUpperCase())} maxLength={8} minLength={8} required placeholder="8 characters" className="mt-1 h-10 w-full rounded-md border border-input bg-card px-3 uppercase tracking-widest" /></label>
            <p className="text-xs text-muted-foreground">Ask a group member to send you their invite code.</p>
            <button disabled={busy} className="mt-auto rounded-full border border-foreground px-4 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-60">Join list</button>
          </form>
        </div>
        <div className="mt-6">
          <h3 className="font-bold">Your shared lists</h3>
          {overview.groups.length === 0 ? <p className="mt-2 rounded-lg border border-dashed border-border p-4 text-sm text-muted-foreground">You haven’t joined a shared list yet.</p> : <ul className="mt-3 flex flex-col gap-3">{overview.groups.map((group) => <li key={group.id} className="rounded-xl border border-border bg-background p-4">
            <div className="flex flex-wrap items-start justify-between gap-3"><div><Link href={`/account/groups/${group.id}`} className="font-bold text-primary underline underline-offset-2">{group.name}</Link><p className="mt-1 text-sm text-muted-foreground">{group.eventName} · {group.year} · {group.role}</p></div><button type="button" onClick={() => void groupAction(group.id, group.role === 'owner')} className="text-sm font-semibold text-rose-700 underline">{group.role === 'owner' ? 'Delete list' : 'Leave list'}</button></div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-sm"><span>Invite code:</span><code className="rounded bg-muted px-2 py-1 font-bold tracking-widest">{group.inviteCode}</code><button type="button" onClick={() => void copyCode(group.id, group.inviteCode)} className="inline-flex items-center gap-1 rounded border border-input px-2 py-1 text-xs font-semibold"><Copy className="size-3.5" />{copiedGroup === group.id ? <><Check className="size-3.5" />Copied</> : 'Copy'}</button></div>
          </li>)}</ul>}
        </div>
      </section>
      {message && <p aria-live="polite" className="rounded-lg border border-primary/20 bg-accent/40 p-3 text-sm font-semibold">{message}</p>}
    </div>
  )
}
