'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState, type FormEvent } from 'react'
import { Eye, EyeOff, LogOut, Users } from 'lucide-react'
import {
  createRecoveryCodeForCurrentUser,
  createUsernameAccount,
  getAccountOverview,
  loginUsernameAccount,
  logoutUsernameAccount,
  resetPasswordWithRecoveryCode,
  getCloudBookmarks,
  syncCloudBookmarks,
} from '@/app/actions/bookmark-accounts'

type Overview = Awaited<ReturnType<typeof getAccountOverview>>

export function AccountPortal({ initialMode = 'login' }: { initialMode?: 'login' | 'create' }) {
  const [overview, setOverview] = useState<Overview | null>(null)
  const [loadError, setLoadError] = useState('')
  const [mode, setMode] = useState<'login' | 'create' | 'recover'>(initialMode)
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [recoveryInput, setRecoveryInput] = useState('')
  const [recoveryCode, setRecoveryCode] = useState('')
  const [remember, setRemember] = useState(false)
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [syncedUsername, setSyncedUsername] = useState('')

  const refresh = useCallback(async () => {
    setLoadError('')
    try {
      const data = await getAccountOverview()
      setOverview(data)
      if ('error' in data && data.error) setLoadError(data.error)
    } catch {
      setLoadError('We couldn’t load your account details right now. Please try again in a moment. Your saved bookmarks have not been deleted.')
    }
  }, [])
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
  const passwordRequirements = [
    { label: 'At least 8 characters', met: password.length >= 8 },
    { label: 'One uppercase letter (A–Z)', met: /[A-Z]/.test(password) },
    { label: 'One number (0–9)', met: /[0-9]/.test(password) },
    { label: 'One special character (e.g. !, @, #)', met: /[^A-Za-z0-9]/.test(password) },
  ]

  if (loadError) return <div role="alert" className="mx-auto max-w-xl rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm sm:p-7">
    <h2 className="font-extrabold">We couldn’t load your account</h2>
    <p className="mt-2 text-sm leading-relaxed">{loadError}</p>
    <button type="button" onClick={() => void refresh()} className="mt-4 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">Try again</button>
  </div>
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
          <span className="relative mt-1.5 block">
            <input id="account-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} minLength={mode === 'login' ? undefined : 8} maxLength={128} required className="h-11 w-full rounded-lg border border-input bg-background px-3 pr-12 font-normal outline-none focus-visible:ring-2 focus-visible:ring-ring" />
            <button type="button" onClick={() => setShowPassword((visible) => !visible)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword} className="absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              {showPassword ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
            </button>
          </span>
          {mode !== 'login' && <ul className="mt-2 flex flex-col gap-1 text-xs" aria-label="Password requirements">
            {passwordRequirements.map((requirement) => <li key={requirement.label} className={requirement.met ? 'font-medium text-emerald-700' : 'text-muted-foreground'}><span aria-hidden="true" className="mr-2">{requirement.met ? '✓' : '○'}</span>{requirement.label}</li>)}
          </ul>}
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
      <section className="rounded-2xl border border-border bg-card p-5 sm:p-7">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><div className="flex items-center gap-2"><Users className="size-5 text-primary" /><h2 className="text-xl font-extrabold">Shared event lists</h2></div><p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Create a list for an event, invite friends, and manage everyone’s saved booths on a separate page.</p></div>
          <Link href="/account/shared-lists" className="inline-flex shrink-0 items-center rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background">Open shared lists <span className="ml-2" aria-hidden="true">↗</span></Link>
        </div>
      </section>
      {recoveryCodeNotice}
      {!recoveryCode && <section className="rounded-2xl border border-amber-300 bg-amber-50 p-5 sm:p-6">
        <h2 className="font-extrabold">Password recovery code</h2>
        <p className="mt-1 text-sm leading-relaxed">{overview.hasRecoveryCode ? 'A recovery code is already set. If you misplaced it, you can replace it here; the old code will stop working.' : 'Generate and save a recovery code so you can reset your password without email.'}</p>
        <button type="button" disabled={busy} onClick={() => void generateRecoveryCode()} className="mt-3 rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background disabled:opacity-60">{overview.hasRecoveryCode ? 'Replace recovery code' : 'Generate recovery code'}</button>
      </section>}
      {message && <p aria-live="polite" className="rounded-lg border border-primary/20 bg-accent/40 p-3 text-sm font-semibold">{message}</p>}
    </div>
  )
}
