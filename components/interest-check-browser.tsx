'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, X } from 'lucide-react'
import { SocialPostEmbed } from '@/components/social-post-embed'
import { TagFilterDropdown } from '@/components/tag-filter-controls'
import { formatDateRange } from '@/lib/format'
import { hasSelectedTag, normalizedTag, uniqueSortedTags } from '@/lib/tag-utils'
import { CalendarReminderButton } from '@/components/calendar-reminder-button'

export type InterestCheckListing = {
  id: number
  title: string
  socialPostUrl: string | null
  type: string[]
  eventName: string
  fandom: string[]
  status: string | null
  year: number
  cutoffDate: string | null
}

function statusStyle(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'upcoming') return 'bg-sky-100 text-sky-900'
  if (normalized === 'ongoing' || normalized === 'open') return 'bg-emerald-700 text-white'
  if (normalized === 'closed' || normalized === 'past') return 'bg-muted text-muted-foreground'
  return 'bg-accent text-accent-foreground'
}

export function InterestCheckBrowser({ items, initialYear }: { items: InterestCheckListing[]; initialYear: number | null }) {
  const [year, setYear] = useState<number | null>(initialYear)
  const [fandoms, setFandoms] = useState<Set<string>>(new Set())
  const [types, setTypes] = useState<Set<string>>(new Set())
  const fandomOptions = useMemo(() => uniqueSortedTags(items.map((item) => item.fandom)), [items])
  const typeOptions = useMemo(() => uniqueSortedTags(items.map((item) => item.type)), [items])
  const years = useMemo(() => [...new Set(items.map((item) => item.year))].sort((a, b) => a - b), [items])
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const filtered = useMemo(() => items.filter((item) => (!year || item.year === year)
    && hasSelectedTag(item.fandom, fandoms)
    && hasSelectedTag(item.type, types)), [items, year, fandoms, types])
  const grouped = new Map<number, InterestCheckListing[]>()
  for (const item of filtered) grouped.set(item.year, [...(grouped.get(item.year) ?? []), item])

  function toggle(setter: (next: Set<string>) => void, current: Set<string>, value: string) {
    const next = new Set(current)
    next.has(value) ? next.delete(value) : next.add(value)
    setter(next)
  }

  return (
    <>
      <nav aria-label="Filter interest checks by year" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={year === null} onClick={() => setYear(null)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${year === null ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}>All Interest Checks</button>
        {years.map((option) => <button key={option} type="button" aria-pressed={year === option} onClick={() => setYear(option)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${year === option ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}>{option}</button>)}
      </nav>
      <div className="mt-6 flex flex-wrap gap-2">
        <TagFilterDropdown label="Fandom" options={fandomOptions} selected={fandoms} onToggle={(value) => toggle(setFandoms, fandoms, value)} />
        <TagFilterDropdown label="Type" options={typeOptions} selected={types} onToggle={(value) => toggle(setTypes, types, value)} />
        {(fandoms.size > 0 || types.size > 0) && <button type="button" onClick={() => { setFandoms(new Set()); setTypes(new Set()) }} className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-primary"><X className="size-4" aria-hidden="true" />Clear tag filters</button>}
      </div>
      {items.length === 0 ? <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No interest checks have been added yet.</p>
        : filtered.length === 0 ? <p className="mt-8 text-muted-foreground">No interest checks match these filters.</p>
          : <div className="mt-10 flex flex-col gap-12">
            {[...grouped.entries()].sort(([a], [b]) => a - b).map(([groupYear, yearItems]) => (
              <section key={groupYear} aria-labelledby={`interest-year-${groupYear}`}>
                <h2 id={`interest-year-${groupYear}`} className="border-b-2 border-foreground pb-3 text-3xl font-extrabold">{groupYear}</h2>
                <ul className="mt-6 grid gap-6 md:grid-cols-2">
                  {yearItems.map((item) => {
                    const past = Boolean(item.cutoffDate && item.cutoffDate < today) || ['past', 'closed'].includes(item.status?.trim().toLowerCase() ?? '')
                    const status = past ? 'Past' : item.status?.trim() || 'Ongoing'
                    return <li key={item.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
                      <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-xl font-bold leading-tight">{item.title}</h3><span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${statusStyle(status)}`}>{status}</span></div>
                      {item.socialPostUrl && <div className="mt-4"><SocialPostEmbed postUrl={item.socialPostUrl} title={`${item.title} social media post`} /></div>}
                      <dl className="mt-5 flex flex-col gap-4 border-t border-border pt-4 text-sm">
                        {item.type.length > 0 && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</dt><dd className="mt-1 flex flex-wrap gap-2">{item.type.map((tag) => <span key={normalizedTag(tag)} className="inline-flex rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">{tag}</span>)}</dd></div>}
                        {item.fandom.length > 0 && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fandom</dt><dd className="mt-1 flex flex-wrap gap-2">{item.fandom.map((tag) => <span key={normalizedTag(tag)} className="inline-flex rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">{tag}</span>)}</dd></div>}
                        <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</dt><dd className="mt-1">{item.eventName}</dd></div>
                        <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cutoff date</dt><dd className="mt-0.5">{item.cutoffDate ? formatDateRange(item.cutoffDate, item.cutoffDate) : 'No cutoff date'}</dd></div></div>
                      </dl>
                      {item.cutoffDate && <div className="mt-4"><CalendarReminderButton entries={[{ sourceKey: 'interest-check:' + item.id + ':cutoff', category: 'interest_check', title: item.title, detail: 'Closing date', date: item.cutoffDate }]} compact /></div>}
                    </li>
                  })}
                </ul>
              </section>
            ))}
          </div>}
    </>
  )
}
