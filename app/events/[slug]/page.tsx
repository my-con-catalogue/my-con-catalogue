import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft, CalendarDays, MapPin } from 'lucide-react'
import { CatalogueBrowser } from '@/components/catalogue-browser'
import { AnimeFestFloorplan } from '@/components/anime-fest-floorplan'
import { OtakyunFloorplan } from '@/components/otakyun-floorplan'
import { EventEntryBadge } from '@/components/event-entry-badge'
import { EventStatusBadge } from '@/components/event-status-badge'
import { InstagramIcon } from '@/components/social-icons'
import { formatDateRange, instagramUrl } from '@/lib/format'
import { getEventBoothNumbers, getEventBySlug, getEventCatalogues } from '@/lib/queries'

export const revalidate = 300

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) return { title: 'Event not found' }
  return {
    title: `${event.name} catalogues`,
    description: `Artist alley catalogues for ${event.name}${event.location ? ` at ${event.location}` : ''}.`,
  }
}

export default async function EventPage({ params }: Props) {
  const { slug } = await params
  const event = await getEventBySlug(slug)
  if (!event) notFound()

  const [catalogues, boothNumbers] = await Promise.all([
    getEventCatalogues(event.slug),
    getEventBoothNumbers(event.slug),
  ])

  return (
    <>
      <section className="border-b border-border bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
          <Link href="/events" className="inline-flex items-center gap-1 text-sm font-semibold hover:text-primary">
            <ArrowLeft className="size-4" aria-hidden="true" /> All events
          </Link>
          <p className="mt-6 text-sm font-semibold uppercase tracking-wider text-primary">{event.year}</p>
          <h1 className="mt-1 text-4xl font-extrabold tracking-tight md:text-5xl">{event.name}</h1>
          <div className="mt-5 flex aspect-square w-full max-w-xs items-center justify-center rounded-xl border border-dashed border-border bg-card/70 p-5">
            {event.logoUrl ? (
              <Image src={event.logoUrl} alt={`${event.name} logo`} width={320} height={130} className="h-full w-full object-contain" unoptimized />
            ) : (
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Event logo</span>
            )}
          </div>
          <div className="mt-4"><EventStatusBadge startDate={event.startDate} endDate={event.endDate} /></div>
          {event.description && (
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-muted-foreground">{event.description}</p>
          )}
          <dl className="mt-6 flex flex-wrap gap-3 text-sm">
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
              <dt className="sr-only">Entry</dt>
              <dd><EventEntryBadge status={event.entryStatus} /></dd>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
              <dt className="sr-only">Date</dt>
              <CalendarDays className="size-4" aria-hidden="true" />
              <dd>{formatDateRange(event.startDate, event.endDate)}</dd>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
              <dt className="sr-only">Location</dt>
              <MapPin className="size-4" aria-hidden="true" />
              <dd>{event.location ?? 'Location TBA'}</dd>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
              <dt className="sr-only">Official social media account</dt>
              <InstagramIcon className="size-4" />
              <dd>
                {event.instagram ? (
                  <a
                    href={instagramUrl(event.instagram)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold hover:text-primary"
                  >
                    @{event.instagram}
                  </a>
                ) : (
                  'Social account TBA'
                )}
              </dd>
            </div>
          </dl>
          <nav aria-label="Event sections" className="mt-8 flex flex-wrap gap-2">
            {event.slug === 'anime-fest-2026' && (
              <a href="#interactive-map" className="rounded-full border border-foreground bg-card px-4 py-2 text-sm font-semibold hover:bg-foreground hover:text-background">
                Interactive map
              </a>
            )}
            {event.slug === 'otakyun-2026' && (
              <a href="#interactive-map" className="rounded-full border border-foreground bg-card px-4 py-2 text-sm font-semibold hover:bg-foreground hover:text-background">
                Interactive map
              </a>
            )}
            <a href="#catalogue" className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background">
              Catalogue ({catalogues.length})
            </a>
          </nav>
        </div>
      </section>

      {event.slug === 'anime-fest-2026' && (
        <section id="interactive-map" aria-labelledby="interactive-map-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 id="interactive-map-heading" className="text-3xl font-extrabold tracking-tight">Anime Fest! 2026 floor plan</h2>
              <p className="mt-1 text-sm text-muted-foreground">Select a highlighted booth to open its catalogue. More booths become clickable as catalogue entries are added.</p>
            </div>
          </div>
          <AnimeFestFloorplan entries={catalogues.filter((entry) => entry.catalogueType === 'booth_catalogue')} />
        </section>
      )}

      {event.slug === 'otakyun-2026' && (
        <section id="interactive-map" aria-labelledby="interactive-map-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 pt-10">
          <div className="mb-4">
            <h2 id="interactive-map-heading" className="text-3xl font-extrabold tracking-tight">Otakyun 2026 floor plan</h2>
            <p className="mt-1 text-sm text-muted-foreground">CR booths open their catalogue when one is listed. EX (Exhibitor) and CO (Community) booths are outside this catalogue and shown in gray.</p>
          </div>
          <OtakyunFloorplan entries={catalogues.filter((entry) => entry.catalogueType === 'booth_catalogue')} />
        </section>
      )}

      <section id="catalogue" aria-labelledby="catalogue-heading" className="mx-auto max-w-6xl scroll-mt-20 px-4 py-12">
        <h2 id="catalogue-heading" className="text-3xl font-extrabold tracking-tight">
          Artist alley catalogue
        </h2>
        <p className="mt-1 text-muted-foreground">Sorted by booth number A–Z. Filter by fandom, merch type, or stamp rally participation.</p>
        <p className="mt-3 rounded-lg border border-primary/30 bg-accent/60 p-4 text-sm font-medium leading-relaxed">
          Found something you love? Check the artist&apos;s account and show them some support by following, liking, or resharing their work.
        </p>
        <p className="mt-3 rounded-lg border border-border bg-card p-4 text-sm leading-relaxed text-muted-foreground">
          Notice a missing booth number or catalogue? <Link href="/contact#artist-form" className="font-semibold text-primary underline underline-offset-2">Submit the catalogue here</Link>. If you are looking for fellow artists interested in a Stamp Rally, tag us on <a href="https://www.instagram.com/my_concatalogue/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-2">Instagram</a> and we&apos;ll repost it. An interest check page will also be available on this website.
        </p>
        <div className="mt-6">
          <CatalogueBrowser entries={catalogues} boothNumbers={boothNumbers} />
        </div>
      </section>

    </>
  )
}
