'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Bell, CalendarDays, Trash2 } from 'lucide-react'
import { getPersonalCalendarEntries, removePersonalCalendarEntry, type PersonalCalendarEntry } from '@/app/actions/bookmark-accounts'

const categoryLabels: Record<PersonalCalendarEntry['category'], string> = {
  event: 'Convention',
  fan_event: 'Fan event',
  interest_check: 'Interest check',
  pickup_cutoff: 'Pick-up cutoff',
}

function displayDate(value: string) {
  const date = new Date(value + 'T00:00:00.000Z')
  return new Intl.DateTimeFormat('en-MY', { timeZone: 'UTC', day: 'numeric', month: 'short', year: 'numeric' }).format(date)
}

export function PersonalCalendarView() {
  const [entries, setEntries] = useState<PersonalCalendarEntry[]>([])
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    void getPersonalCalendarEntries().then((result) => {
      if (!active) return
      setSignedIn(result.signedIn)
      setEntries(result.entries)
    }).catch(() => {
      if (active) setError('We could not load your personal calendar. Please try again later.')
    }).finally(() => {
      if (active) setLoading(false)
    })
    return () => { active = false }
  }, [])

  async function remove(id: number) {
    setBusyId(id)
    setError('')
    try {
      const result = await removePersonalCalendarEntry(id)
      if (result.ok) setEntries((current) => current.filter((entry) => entry.id !== id))
      else setError('Could not remove that reminder. Please try again.')
    } catch {
      setError('Could not remove that reminder. Please try again.')
    }
    setBusyId(null)
  }

  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const upcoming = entries.filter((entry) => entry.date >= today)
  const past = entries.filter((entry) => entry.date < today).reverse()

  function section(title: string, items: PersonalCalendarEntry[]) {
    return <section aria-label={title}>
      <h2 className="text-xl font-extrabold">{title}</h2>
      {items.length === 0 ? <p className="mt-3 text-sm text-muted-foreground">Nothing here yet.</p> : <ul className="mt-4 flex flex-col gap-3">
        {items.map((entry) => <li key={entry.id} className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-card p-4">
          <div className="flex min-w-0 items-start gap-3">
            <CalendarDays className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
            <div className="min-w-0">
              <p className="font-bold">{entry.title}</p>
              <p className="mt-0.5 text-sm text-muted-foreground">{displayDate(entry.date)}{entry.detail ? ' · ' + entry.detail : ''}</p>
              <span className="mt-2 inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{categoryLabels[entry.category]}</span>
            </div>
          </div>
          <button type="button" onClick={() => void remove(entry.id)} disabled={busyId === entry.id} aria-label={'Remove reminder for ' + entry.title} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60">
            <Trash2 className="size-4" aria-hidden="true" />{busyId === entry.id ? 'Removing…' : 'Remove'}
          </button>
        </li>)}
      </ul>}
    </section>
  }

  if (loading) return <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Loading your personal calendar…</p>
  if (signedIn === false) return <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center">
    <h2 className="text-xl font-extrabold">Log in to view your personal calendar</h2>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your saved dates are available after you sign in to your MYCC account.</p>
    <Link href="/account?mode=login" className="mt-4 inline-flex rounded-full bg-foreground px-5 py-2.5 font-semibold text-background">Log in</Link>
  </div>

  return <div className="mx-auto max-w-4xl space-y-10">
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-accent"><Bell className="size-5" aria-hidden="true" /></span><div><h2 className="text-xl font-extrabold">Your saved dates</h2><p className="text-sm text-muted-foreground">Dates you add are saved to your MYCC account and available when you log in on another device.</p></div></div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">These are reminders inside your MYCC account. They do not send push notifications to your device.</p>
      <Link href="/events" className="mt-4 inline-flex font-semibold text-primary underline underline-offset-4">Browse events to add dates</Link>
    </div>
    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">{error}<button type="button" onClick={() => { setLoading(true); setError(''); void getPersonalCalendarEntries().then((result) => { setSignedIn(result.signedIn); setEntries(result.entries) }).catch(() => setError('We could not load your personal calendar. Please try again later.')).finally(() => setLoading(false)) }} className="ml-2 font-semibold underline">Try again</button></p>}
    {entries.length === 0 ? <div className="rounded-2xl border border-dashed border-border p-10 text-center"><p className="text-lg font-bold">Your personal calendar is empty</p><p className="mt-2 text-sm text-muted-foreground">Use the bell button on an event, fan event, interest check, or dated pick-up cutoff to save its dates here.</p></div> : <>
      {section('Upcoming reminders', upcoming)}
      {section('Past dates', past)}
    </>}
  </div>
}
