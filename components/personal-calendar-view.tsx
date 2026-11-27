'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { Bell, CalendarDays, ChevronLeft, ChevronRight, Trash2, X } from 'lucide-react'
import { getPersonalCalendarEntries, removePersonalCalendarEntry, type PersonalCalendarEntry } from '@/app/actions/bookmark-accounts'

const categoryLabels: Record<PersonalCalendarEntry['category'], string> = {
  event: 'Convention',
  fan_event: 'Fan event',
  interest_check: 'Interest check',
  pickup_cutoff: 'Pick-up cutoff',
}
const weekdayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const DAY_MS = 24 * 60 * 60 * 1000

function displayDate(value: string, options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short', year: 'numeric' }) {
  return new Intl.DateTimeFormat('en-MY', { ...options, timeZone: 'UTC' }).format(new Date(value + 'T00:00:00.000Z'))
}

function dateKey(date: Date) {
  return date.toISOString().slice(0, 10)
}

function reminderHref(sourceKey: string) {
  const parts = sourceKey.split(':')
  if (parts[0] === 'event' && parts[1]) return '/events/' + parts[1]
  if (parts[0] === 'fan-event' && parts[1]) return '/fan-events#fan-event-' + parts[1]
  if (parts[0] === 'interest-check' && parts[1]) return '/interest-check#interest-check-' + parts[1]
  if (parts[0] === 'pickup-cutoff' && parts[1] && parts[2]) return '/events/' + parts[1] + '/catalogues/' + parts[2]
  return null
}

export function PersonalCalendarView() {
  const [entries, setEntries] = useState<PersonalCalendarEntry[]>([])
  const [signedIn, setSignedIn] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [mode, setMode] = useState<'calendar' | 'list'>('calendar')
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const [visibleMonth, setVisibleMonth] = useState(() => {
    const now = new Date()
    const key = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now)
    return new Date(key.slice(0, 4) + '-' + key.slice(5, 7) + '-01T00:00:00.000Z')
  })

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

  const entriesByDate = useMemo(() => {
    const grouped = new Map<string, PersonalCalendarEntry[]>()
    for (const entry of entries) grouped.set(entry.date, [...(grouped.get(entry.date) ?? []), entry])
    return grouped
  }, [entries])
  const monthStart = Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth(), 1)
  const monthLength = new Date(Date.UTC(visibleMonth.getUTCFullYear(), visibleMonth.getUTCMonth() + 1, 0)).getUTCDate()
  const leadingDays = (new Date(monthStart).getUTCDay() + 6) % 7
  const cellCount = Math.ceil((leadingDays + monthLength) / 7) * 7
  const calendarDays = Array.from({ length: cellCount }, (_, index) => new Date(monthStart + (index - leadingDays) * DAY_MS))
  const monthLabel = new Intl.DateTimeFormat('en-MY', { timeZone: 'UTC', month: 'long', year: 'numeric' }).format(visibleMonth)
  const monthPrefix = visibleMonth.toISOString().slice(0, 7)
  const monthEntries = entries.filter((entry) => entry.date.startsWith(monthPrefix))
  const selectedEntries = selectedDate ? entriesByDate.get(selectedDate) ?? [] : []
  const groupedMonthEntries = [...new Set(monthEntries.map((entry) => entry.date))].sort().map((date) => ({ date, entries: entriesByDate.get(date) ?? [] }))

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

  function reminderRow(entry: PersonalCalendarEntry, showDate = false) {
    const href = reminderHref(entry.sourceKey)
    return <li key={entry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4">
      <div className="flex min-w-0 items-start gap-3">
        <CalendarDays className="mt-1 size-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0">
          {href ? <Link href={href} className="font-bold underline decoration-transparent underline-offset-4 hover:text-primary hover:decoration-current">{entry.title}</Link> : <p className="font-bold">{entry.title}</p>}
          <p className="mt-0.5 text-sm text-muted-foreground">{showDate ? displayDate(entry.date) + ' · ' : ''}{entry.detail || categoryLabels[entry.category]}</p>
          <span className="mt-2 inline-flex rounded-full bg-accent px-2.5 py-1 text-xs font-semibold text-accent-foreground">{categoryLabels[entry.category]}</span>
          {href && <Link href={href} className="ml-2 text-xs font-semibold text-primary underline underline-offset-2">Open page</Link>}
        </div>
      </div>
      <button type="button" onClick={() => void remove(entry.id)} disabled={busyId === entry.id} aria-label={'Remove reminder for ' + entry.title} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-border px-3 py-2 text-sm font-semibold hover:bg-muted disabled:opacity-60">
        <Trash2 className="size-4" aria-hidden="true" />{busyId === entry.id ? 'Removing…' : 'Remove'}
      </button>
    </li>
  }

  if (loading) return <p className="rounded-xl border border-border bg-card p-6 text-muted-foreground">Loading your personal calendar…</p>
  if (signedIn === false) return <div className="mx-auto max-w-xl rounded-2xl border border-border bg-card p-6 text-center">
    <h2 className="text-xl font-extrabold">Log in to view your personal calendar</h2>
    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">Your saved dates are available after you sign in to your MYCC account.</p>
    <Link href="/account?mode=login" className="mt-4 inline-flex rounded-full bg-foreground px-5 py-2.5 font-semibold text-background">Log in</Link>
  </div>

  return <div className="mx-auto max-w-5xl space-y-6">
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-7">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3"><span className="flex size-11 items-center justify-center rounded-full bg-accent"><Bell className="size-5" aria-hidden="true" /></span><div><h2 className="text-xl font-extrabold">Your saved dates</h2><p className="text-sm text-muted-foreground">Saved to your MYCC account and available when you log in on another device.</p></div></div>
        <div role="group" aria-label="Calendar display mode" className="flex rounded-full border border-border bg-background p-1">
          <button type="button" aria-pressed={mode === 'calendar'} onClick={() => setMode('calendar')} className={'rounded-full px-4 py-2 text-sm font-semibold ' + (mode === 'calendar' ? 'bg-foreground text-background' : 'hover:bg-muted')}>Monthly calendar</button>
          <button type="button" aria-pressed={mode === 'list'} onClick={() => setMode('list')} className={'rounded-full px-4 py-2 text-sm font-semibold ' + (mode === 'list' ? 'bg-foreground text-background' : 'hover:bg-muted')}>Monthly list</button>
        </div>
      </div>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">These are reminders inside your MYCC account. They do not send push notifications to your device.</p>
    </div>

    {error && <p role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm">{error}<button type="button" onClick={() => { setLoading(true); setError(''); void getPersonalCalendarEntries().then((result) => { setSignedIn(result.signedIn); setEntries(result.entries) }).catch(() => setError('We could not load your personal calendar. Please try again later.')).finally(() => setLoading(false)) }} className="ml-2 font-semibold underline">Try again</button></p>}

    <section className="rounded-2xl border border-border bg-card p-4 sm:p-6" aria-label={mode === 'calendar' ? 'Monthly calendar' : 'Monthly list'}>
      <div className="mb-5 flex items-center justify-between gap-3">
        <button type="button" onClick={() => setVisibleMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - 1, 1)))} aria-label="Previous month" className="flex size-10 items-center justify-center rounded-full border border-border hover:bg-muted"><ChevronLeft className="size-5" aria-hidden="true" /></button>
        <div className="text-center"><h2 className="text-xl font-extrabold">{monthLabel}</h2><button type="button" onClick={() => setVisibleMonth(new Date(today.slice(0, 4) + '-' + today.slice(5, 7) + '-01T00:00:00.000Z'))} className="mt-1 text-xs font-semibold text-primary underline underline-offset-2">Go to this month</button></div>
        <button type="button" onClick={() => setVisibleMonth((current) => new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() + 1, 1)))} aria-label="Next month" className="flex size-10 items-center justify-center rounded-full border border-border hover:bg-muted"><ChevronRight className="size-5" aria-hidden="true" /></button>
      </div>

      {entries.length === 0 ? <div className="rounded-xl border border-dashed border-border p-8 text-center"><p className="font-bold">Your personal calendar is empty</p><p className="mt-2 text-sm text-muted-foreground">Use the yellow bell beside a date to save it here.</p><Link href="/events" className="mt-3 inline-flex font-semibold text-primary underline underline-offset-4">Browse events to add dates</Link></div>
        : mode === 'calendar' ? <>
          <div className="grid grid-cols-7 border-l border-t border-border">
            {weekdayLabels.map((day) => <div key={day} className="border-b border-r border-border bg-secondary/60 px-1 py-2 text-center text-xs font-bold sm:px-3">{day}</div>)}
            {calendarDays.map((date) => {
              const key = dateKey(date)
              const dayEntries = entriesByDate.get(key) ?? []
              const inMonth = date.getUTCMonth() === visibleMonth.getUTCMonth()
              return <button key={key} type="button" onClick={() => setSelectedDate(key)} aria-label={displayDate(key, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) + (dayEntries.length ? ', ' + dayEntries.length + ' reminders' : '')} className={'min-h-20 border-b border-r border-border p-1 text-left transition-colors hover:bg-accent/50 sm:min-h-28 sm:p-2 ' + (inMonth ? 'bg-card' : 'bg-muted/40 text-muted-foreground') + (key === today ? ' ring-2 ring-inset ring-primary' : '')}>
                <span className="flex items-center justify-between text-xs font-bold sm:text-sm">{date.getUTCDate()}{dayEntries.length > 0 && <span className="rounded-full bg-accent px-1.5 py-0.5 text-[10px] text-accent-foreground sm:px-2 sm:text-xs">{dayEntries.length}</span>}</span>
                <span className="mt-1 hidden flex-col gap-1 sm:flex">{dayEntries.slice(0, 2).map((entry) => <span key={entry.id} className="block truncate rounded bg-accent/80 px-1.5 py-1 text-[11px] font-medium text-accent-foreground">{entry.title}</span>)}{dayEntries.length > 2 && <span className="px-1 text-[10px] font-semibold text-muted-foreground">+{dayEntries.length - 2} more</span>}</span>
                {dayEntries.length > 0 && <span className="mt-2 flex gap-1 sm:hidden">{dayEntries.slice(0, 3).map((entry) => <span key={entry.id} className="size-1.5 rounded-full bg-primary" />)}</span>}
              </button>
            })}
          </div>
          <p className="mt-3 text-xs text-muted-foreground">Select a date to view its reminders. Dates with a count have saved items.</p>
        </> : monthEntries.length === 0 ? <p className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">No reminders saved for {monthLabel}.</p>
          : <div className="space-y-6">{groupedMonthEntries.map(({ date, entries: dayEntries }) => <section key={date} aria-label={displayDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}>
            <h3 className="mb-3 border-b border-border pb-2 text-lg font-extrabold">{displayDate(date, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
            <ul className="flex flex-col gap-3">{dayEntries.map((entry) => reminderRow(entry))}</ul>
          </section>)}</div>}
    </section>

    {selectedDate && <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 p-4" onMouseDown={(event) => { if (event.target === event.currentTarget) setSelectedDate(null) }}>
      <section role="dialog" aria-modal="true" aria-labelledby="calendar-day-heading" className="max-h-[85vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div><p className="text-sm font-semibold uppercase tracking-wider text-primary">Selected date</p><h2 id="calendar-day-heading" className="mt-1 text-2xl font-extrabold">{displayDate(selectedDate, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h2></div>
          <button type="button" onClick={() => setSelectedDate(null)} aria-label="Close date details" className="flex size-10 shrink-0 items-center justify-center rounded-full border border-border hover:bg-muted"><X className="size-5" aria-hidden="true" /></button>
        </div>
        {selectedEntries.length ? <ul className="mt-5 flex flex-col gap-3">{selectedEntries.map((entry) => reminderRow(entry))}</ul> : <p className="mt-5 rounded-xl border border-dashed border-border p-5 text-sm text-muted-foreground">No reminders saved for this date.</p>}
      </section>
    </div>}
  </div>
}
