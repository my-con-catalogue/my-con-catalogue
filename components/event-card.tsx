import Link from 'next/link'
import Image from 'next/image'
import { ArrowUpRight, CalendarDays, MapPin } from 'lucide-react'
import { InstagramIcon } from '@/components/social-icons'
import { EventEntryBadge } from '@/components/event-entry-badge'
import { formatDateRange } from '@/lib/format'
import type { EventWithCount } from '@/lib/queries'

export function EventCard({ event }: { event: EventWithCount }) {
  return (
    <article className="group relative flex h-full flex-col rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-foreground hover:shadow-[4px_4px_0_0_var(--color-foreground)]">
      <div className="mb-4 flex aspect-square w-full items-center justify-center overflow-hidden rounded-lg border border-dashed border-border bg-secondary/40 p-4">
        {event.logoUrl ? (
          <Link href={`/events/${event.slug}`} aria-label={`Browse ${event.name} catalogues`} className="flex h-full w-full items-center justify-center">
            <Image src={event.logoUrl} alt={`${event.name} logo`} width={220} height={100} className="h-full w-full object-contain" unoptimized />
          </Link>
        ) : (
          <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Event logo</span>
        )}
      </div>
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-xl font-bold leading-tight">
          <Link href={`/events/${event.slug}`} className="hover:text-primary">
            {event.name}
          </Link>
        </h3>
        <ArrowUpRight className="size-5 shrink-0 text-muted-foreground transition-colors group-hover:text-primary" aria-hidden="true" />
      </div>
      {event.isUpcoming && (
        <span className="mt-3 self-start rounded-full border border-red-800 bg-red-700 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white shadow-sm">Upcoming</span>
      )}
      <dl className="mt-4 flex flex-col gap-2 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <dt className="sr-only">Entry</dt>
          <dd><EventEntryBadge status={event.entryStatus} /></dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Date</dt>
          <CalendarDays className="size-4 shrink-0" aria-hidden="true" />
          <dd>{formatDateRange(event.startDate, event.endDate)}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Location</dt>
          <MapPin className="size-4 shrink-0" aria-hidden="true" />
          <dd>{event.location ?? 'Location TBA'}</dd>
        </div>
        <div className="flex items-center gap-2">
          <dt className="sr-only">Social media account</dt>
          <InstagramIcon className="size-4 shrink-0" />
          <dd>
            {event.instagram ? (
              <a href={`https://www.instagram.com/${event.instagram.replace(/^@/, '')}`} target="_blank" rel="noopener noreferrer" className="relative z-10 font-medium text-foreground underline-offset-2 hover:underline">
                @{event.instagram.replace(/^@/, '')}
              </a>
            ) : 'Social account TBA'}
          </dd>
        </div>
      </dl>
      <p className="mt-auto pt-5">
        <span className="inline-flex rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
          {event.catalogueCount} {event.catalogueCount === 1 ? 'catalogue' : 'catalogues'}
        </span>
      </p>
    </article>
  )
}
