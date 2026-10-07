import type { Metadata } from 'next'
import Link from 'next/link'
import { EventCard } from '@/components/event-card'
import { PageHeader } from '@/components/page-header'
import { getEvents, type EventWithCount } from '@/lib/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Events',
  description: 'Anime conventions in Malaysia, organised by year, with artist alley catalogues and stamp rallies.',
}

type Props = { searchParams: Promise<{ year?: string }> }

export default async function EventsPage({ searchParams }: Props) {
  const events = await getEvents()
  const { year: yearParam } = await searchParams
  const requestedYear = yearParam ? Number(yearParam) : null
  const years = [...new Set(events.map((event) => event.year))].sort((a, b) => a - b)
  const selectedYear = requestedYear && years.includes(requestedYear) ? requestedYear : null
  const visibleEvents = selectedYear ? events.filter((event) => event.year === selectedYear) : events

  const byYear = new Map<number, EventWithCount[]>()
  for (const event of visibleEvents) {
    const list = byYear.get(event.year) ?? []
    list.push(event)
    byYear.set(event.year, list)
  }
  const visibleYears = [...byYear.keys()].sort((a, b) => a - b)

  return (
    <>
      <PageHeader
        eyebrow="Events"
        title="Conventions by year"
        description="Browse all listed events or choose a year to narrow the list."
      >
        {years.length > 0 && (
          <nav aria-label="Filter events by year" className="mt-6">
            <ul className="flex flex-wrap gap-2">
              <li>
                <Link
                  href="/events"
                  aria-current={selectedYear === null ? 'page' : undefined}
                  className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${selectedYear === null ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}
                >
                  All Events
                </Link>
              </li>
              {years.map((year) => (
                <li key={year}>
                  <Link
                    href={`/events?year=${year}`}
                    aria-current={selectedYear === year ? 'page' : undefined}
                    className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${selectedYear === year ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}
                  >
                    {year}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        )}
      </PageHeader>

      <div className="mx-auto flex max-w-6xl flex-col gap-14 px-4 py-14">
        {events.length === 0 && <p className="text-muted-foreground">No events listed yet.</p>}
        {events.length > 0 && visibleEvents.length === 0 && <p className="text-muted-foreground">No events are listed for {selectedYear} yet.</p>}
        {visibleYears.map((year) => (
          <section key={year} id={`year-${year}`} aria-labelledby={`heading-${year}`} className="scroll-mt-24">
            <div className="flex items-baseline gap-4 border-b-2 border-foreground pb-3">
              <h2 id={`heading-${year}`} className="text-4xl font-extrabold tracking-tight">
                {year}
              </h2>
              <span className="text-sm text-muted-foreground">
                {byYear.get(year)!.length} {byYear.get(year)!.length === 1 ? 'event' : 'events'}
              </span>
            </div>
            <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {byYear.get(year)!.map((event) => (
                <li key={event.id}>
                  <EventCard event={event} />
                </li>
              ))}
            </ul>
          </section>
        ))}
        <section className="rounded-2xl bg-primary p-7 text-primary-foreground md:flex md:items-center md:justify-between md:gap-8 md:p-9">
          <div>
            <h2 className="text-2xl font-extrabold">Want to see another event here?</h2>
            <p className="mt-2 max-w-2xl leading-relaxed text-primary-foreground/85">
              If there&apos;s an event you&apos;d like us to collect catalogues for but it isn&apos;t on this list, please send us a suggestion.
            </p>
          </div>
          <Link href="/contact#suggestion-form" className="mt-5 inline-flex shrink-0 rounded-full bg-background px-5 py-3 font-semibold text-foreground transition-transform hover:-translate-y-0.5 md:mt-0">
            Suggest an event <span className="ml-3" aria-hidden="true">↗</span>
          </Link>
        </section>
      </div>
    </>
  )
}
