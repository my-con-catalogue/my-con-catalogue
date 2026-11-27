'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Bell, BellRing } from 'lucide-react'
import { savePersonalCalendarEntries, type PersonalCalendarInput } from '@/app/actions/bookmark-accounts'

export function CalendarReminderButton({ entries, compact = false }: { entries: PersonalCalendarInput[]; compact?: boolean }) {
  const [saved, setSaved] = useState(false)
  const [busy, setBusy] = useState(false)
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [message, setMessage] = useState('')
  async function handleClick() {
    setBusy(true)
    setMessage('')
    try {
      const result = await savePersonalCalendarEntries(entries)
      if ('needsLogin' in result && result.needsLogin) setShowLoginPrompt(true)
      else if (result.ok) setSaved(true)
      else if ('message' in result) setMessage(result.message)
    } catch {
      setMessage('Could not update your calendar right now. Please try again.')
    }
    setBusy(false)
  }

  if (!entries.length) return null

  return <>
    <button type="button" onClick={() => void handleClick()} disabled={busy || saved} aria-pressed={saved} className={'inline-flex items-center justify-center gap-2 rounded-full border border-border bg-card font-semibold transition-colors hover:bg-accent disabled:opacity-60 ' + (compact ? 'px-3 py-1.5 text-xs' : 'px-3.5 py-2 text-sm')}>
      {saved ? <BellRing className="size-4" aria-hidden="true" /> : <Bell className="size-4" aria-hidden="true" />}
      {busy ? 'Saving…' : saved ? 'Added to calendar' : 'Add dates to calendar'}
    </button>
    {message && <p role="status" className="mt-2 text-xs text-destructive">{message}</p>}
    {showLoginPrompt && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowLoginPrompt(false) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="calendar-login-heading" className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl">
        <h2 id="calendar-login-heading" className="text-xl font-extrabold">Save dates to your MYCC account</h2>
        <p className="mt-3 leading-relaxed text-muted-foreground">Please create an account or log in to keep personal calendar reminders saved to your account.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/account?mode=create" className="rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background">Create account</Link>
          <Link href="/account?mode=login" className="rounded-full border border-border px-4 py-2.5 text-sm font-semibold">Log in</Link>
          <button type="button" onClick={() => setShowLoginPrompt(false)} className="ml-auto rounded-full px-4 py-2.5 text-sm font-semibold hover:bg-muted">Close</button>
        </div>
      </section>
    </div>}
  </>
}
