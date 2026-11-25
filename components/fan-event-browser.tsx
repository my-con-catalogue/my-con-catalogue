'use client'

import { useMemo, useState } from 'react'
import { CalendarDays, Clock3, MapPin, X } from 'lucide-react'
import { SocialPostEmbed } from '@/components/social-post-embed'
import { InstagramIcon } from '@/components/social-icons'
import { TagFilterDropdown } from '@/components/tag-filter-controls'
import { formatDateRange, instagramUrl } from '@/lib/format'
import { getEventStatus } from '@/lib/event-status'
import { hasSelectedTag, normalizedTag, uniqueSortedTags } from '@/lib/tag-utils'

export type FanEventListing = {
  id: number
  name: string
  fandom: string[]
  types: string[]
  location: string | null
  startDate: string | null
  endDate: string | null
  instagram: string | null
  instagramPostUrl: string | null
  socialPostUrl: string | null
  startTime: string | null
  endTime: string | null
  description: string | null
  registrationDeadline: string | null
}

function formatTime(value: string) {
  const match = value.match(/^([01]\d|2[0-3]):([0-5]\d)$/)
  if (!match) return value
  const date = new Date(Date.UTC(2020, 0, 1, Number(match[1]), Number(match[2])))
  return new Intl.DateTimeFormat('en-MY', { timeZone: 'UTC', hour: 'numeric', minute: '2-digit', hour12: true }).format(date)
}

export function FanEventBrowser({ cafes, initialYear }: { cafes: FanEventListing[]; initialYear: number | null }) {
  const [year, setYear] = useState<number | null>(initialYear)
  const [fandoms, setFandoms] = useState<Set<string>>(new Set())
  const [types, setTypes] = useState<Set<string>>(new Set())
  const fandomOptions = useMemo(() => uniqueSortedTags(cafes.map((cafe) => cafe.fandom)), [cafes])
  const typeOptions = useMemo(() => uniqueSortedTags(cafes.map((cafe) => cafe.types)), [cafes])
  const years = useMemo(() => [...new Set(cafes.flatMap((cafe) => cafe.startDate ? [Number(cafe.startDate.slice(0, 4))] : []))].sort((a, b) => a - b), [cafes])
  const filtered = useMemo(() => cafes.filter((cafe) => (!year || cafe.startDate?.startsWith(String(year)))
    && hasSelectedTag(cafe.fandom, fandoms)
    && hasSelectedTag(cafe.types, types)), [cafes, year, fandoms, types])
  const groups = new Map<string, FanEventListing[]>()
  for (const cafe of filtered) {
    const groupYear = cafe.startDate?.slice(0, 4) ?? 'TBA'
    groups.set(groupYear, [...(groups.get(groupYear) ?? []), cafe])
  }

  function toggle(setter: (next: Set<string>) => void, current: Set<string>, value: string) {
    const next = new Set(current)
    next.has(value) ? next.delete(value) : next.add(value)
    setter(next)
  }

  return (
    <>
      <nav aria-label="Filter fan events by year" className="flex flex-wrap gap-2">
        <button type="button" aria-pressed={year === null} onClick={() => setYear(null)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${year === null ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}>All Fan Events</button>
        {years.map((option) => <button key={option} type="button" aria-pressed={year === option} onClick={() => setYear(option)} className={`rounded-full border px-4 py-1.5 text-sm font-semibold ${year === option ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}>{option}</button>)}
      </nav>
      <div className="mt-6 flex flex-wrap gap-2">
        <TagFilterDropdown label="Fandom" options={fandomOptions} selected={fandoms} onToggle={(value) => toggle(setFandoms, fandoms, value)} />
        <TagFilterDropdown label="Type" options={typeOptions} selected={types} onToggle={(value) => toggle(setTypes, types, value)} />
        {(fandoms.size > 0 || types.size > 0) && <button type="button" onClick={() => { setFandoms(new Set()); setTypes(new Set()) }} className="inline-flex items-center gap-1 px-2 text-sm font-semibold text-primary"><X className="size-4" aria-hidden="true" />Clear tag filters</button>}
      </div>
      {cafes.length === 0 ? <p className="mt-8 rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No fan events archived yet.</p>
        : filtered.length === 0 ? <p className="mt-8 text-muted-foreground">No fan events match these filters.</p>
          : <div className="mt-10 flex flex-col gap-12">
            {[...groups.entries()].map(([groupYear, items]) => <section key={groupYear} aria-labelledby={`cafe-year-${groupYear}`}>
              <h2 id={`cafe-year-${groupYear}`} className="border-b-2 border-foreground pb-3 text-3xl font-extrabold">{groupYear}</h2>
              <ul className="mt-6 grid gap-6 md:grid-cols-2">
                {items.map((cafe) => {
                  const status = getEventStatus(cafe.startDate, cafe.endDate)
                  const style = status === 'ongoing' ? 'bg-emerald-700 text-white' : status === 'upcoming' ? 'bg-sky-100 text-sky-900' : 'bg-muted text-muted-foreground'
                  const time = cafe.startTime && cafe.endTime ? `${formatTime(cafe.startTime)} – ${formatTime(cafe.endTime)}` : cafe.startTime ? formatTime(cafe.startTime) : cafe.endTime ? formatTime(cafe.endTime) : 'TBA'
                  return <li key={cafe.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
                    <div className="flex flex-wrap items-start justify-between gap-3"><h3 className="text-xl font-bold leading-tight">{cafe.name}</h3><span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${style}`}>{cafe.startDate ? status : 'Date TBA'}</span></div>
                    {(cafe.socialPostUrl || cafe.instagramPostUrl) && <div className="mt-4"><SocialPostEmbed postUrl={cafe.socialPostUrl || cafe.instagramPostUrl!} title={`${cafe.name} social media post`} /></div>}
                    {cafe.types.length > 0 && <div className="mt-4"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</p><ul className="mt-1 flex flex-wrap gap-2">{cafe.types.map((tag) => <li key={normalizedTag(tag)} className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">{tag}</li>)}</ul></div>}
                    {cafe.fandom.length > 0 && <div className="mt-3"><p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fandom</p><ul className="mt-1 flex flex-wrap gap-2">{cafe.fandom.map((tag) => <li key={normalizedTag(tag)} className="inline-flex rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">{tag}</li>)}</ul></div>}
                    {cafe.instagram && <a href={/^https?:\/\//i.test(cafe.instagram) ? cafe.instagram : instagramUrl(cafe.instagram)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline"><InstagramIcon className="size-4" aria-hidden="true" />@{cafe.instagram.replace(/^@/, '').split('/').filter(Boolean).at(-1)}</a>}
                    {cafe.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cafe.description}</p>}
                    <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-sm">
                      <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</dt><dd className="mt-0.5">{formatDateRange(cafe.startDate, cafe.endDate)}</dd></div></div>
                      {cafe.registrationDeadline && <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Registration deadline</dt><dd className="mt-0.5">{formatDateRange(cafe.registrationDeadline, null)}</dd></div></div>}
                      <div className="flex items-start gap-2"><Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</dt><dd className="mt-0.5">{time}</dd></div></div>
                      <div className="flex items-start gap-2"><MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</dt><dd className="mt-0.5">{cafe.location ?? 'TBA'}</dd></div></div>
                    </dl>
                  </li>
                })}
              </ul>
            </section>)}
          </div>}
    </>
  )
}
