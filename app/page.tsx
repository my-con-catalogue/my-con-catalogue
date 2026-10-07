import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, BookOpen, Coffee, MessageCircle, Palette, Stamp } from 'lucide-react'
import { EventCard } from '@/components/event-card'
import { InstagramIcon } from '@/components/social-icons'
import { getEvents, getStats } from '@/lib/queries'

export const revalidate = 300

const features = [
  {
    icon: BookOpen,
    title: 'Artist alley catalogues',
    text: 'Browse every booth catalogue by event, sorted A–Z and filterable by fandom and merch type.',
  },
  {
    icon: Stamp,
    title: 'Stamp rallies',
    text: 'Find out which booths are joining each stamp rally and what you can collect.',
  },
  {
    icon: Coffee,
    title: 'Fan cafes',
    text: 'Keep track of birthday cafes, collab cafes and fan-run events around Malaysia.',
  },
  {
    icon: Palette,
    title: 'Artist directory',
    text: 'See which years and events your favourite artists have tabled at.',
  },
]

export default async function HomePage() {
  const [events, stats] = await Promise.all([getEvents(), getStats()])
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
  const upcoming = events
    .filter((event) => event.isUpcoming && (!event.startDate || event.startDate >= today))
    .sort((a, b) => {
      if (a.startDate && b.startDate) return a.startDate.localeCompare(b.startDate)
      if (a.startDate) return -1
      if (b.startDate) return 1
      return a.year - b.year || a.displayOrder - b.displayOrder
    })
    .slice(0, 3)

  const statItems = [
    { label: 'Events', value: stats.events },
    { label: 'Artists', value: stats.artists },
    { label: 'Fan cafes', value: stats.fanCafes },
  ]

  return (
    <>
      <section className="border-b border-border">
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 md:grid-cols-2 md:py-20">
          <div>
            <ul aria-label="Archive categories" className="flex flex-wrap gap-2">
              {[
                'Malaysia Convention Catalogues',
                'Artist Alley Catalogues',
                'Stamp Rally',
                'Fan Cafes · Cupsleeve · Birthday Events · etc.',
              ].map((label) => (
                <li key={label} className="rounded-full border border-foreground bg-card px-3 py-1 text-xs font-semibold tracking-wide">
                  {label}
                </li>
              ))}
            </ul>
            <h1 className="mt-6 text-5xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">
              All the catalogues, all in one place.
            </h1>
            <p className="mt-5 max-w-lg text-pretty text-lg leading-relaxed text-muted-foreground">
              Discover Artist Alley catalogues, Stamp Rallies, Fan Cafes, and more from conventions across Malaysia — all collected together so you can browse, discover, and find your favourites a little easier.
            </p>
            <p className="mt-5 font-heading text-xl font-bold text-primary">୨୧ <strong>Browse. Discover. Archive.</strong></p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-6 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"
              >
                Browse events
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
              <Link
                href="/contact#artist-form"
                className="inline-flex items-center gap-2 rounded-full border border-foreground px-6 py-3 font-semibold transition-colors hover:bg-foreground hover:text-background"
              >
                Submit your catalogue
              </Link>
            </div>
          </div>
          <div className="relative">
            <div className="overflow-hidden rounded-2xl border-2 border-foreground shadow-[8px_8px_0_0_var(--color-foreground)]">
              <Image
                src="/community/convention-artist-alley.jpg"
                alt="A crowded indoor convention with visitors exploring vendor stalls"
                width={1200}
                height={800}
                priority
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
            <p className="mt-3 text-right text-xs text-muted-foreground">
              Photo by <a className="underline underline-offset-2" href="https://unsplash.com/@diggdomino?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Aaron Douglas</a> on <a className="underline underline-offset-2" href="https://unsplash.com/photos/a-crowded-indoor-convention-with-many-people-and-vendor-stalls-bOwyyNGwv5Q?utm_source=unsplash&utm_medium=referral&utm_content=creditCopyText" target="_blank" rel="noopener noreferrer">Unsplash</a>
            </p>
          </div>
        </div>
      </section>

      <section aria-label="Archive statistics" className="border-b border-border bg-foreground text-background">
        <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 md:grid-cols-4">
          {statItems.map((s) => (
            <div key={s.label}>
              <dt className="text-sm text-background/70">{s.label}</dt>
              <dd className="font-heading text-4xl font-extrabold text-accent">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-label="Archive coverage note" className="mx-auto max-w-6xl px-4 pt-8">
        <p className="rounded-xl border border-primary/30 bg-accent/40 px-5 py-4 text-sm leading-relaxed">
          <strong>A little note:</strong> MYConCatalogue officially started in mid-October 2026, so some earlier 2026 events aren&apos;t in the archive. Thank you for understanding! If you have catalogues from a missing event, <Link href="/contact" className="font-semibold text-primary underline underline-offset-4">send us a suggestion</Link>.
        </p>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Upcoming events</p>
            <h2 className="mt-1 text-3xl font-extrabold tracking-tight">See you at the next convention</h2>
          </div>
          <Link href="/events" className="inline-flex items-center gap-1 font-semibold hover:text-primary">
            All events <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
        {upcoming.length > 0 ? (
          <ul className="mt-8 grid gap-5 md:grid-cols-3">
            {upcoming.map((event) => (
              <li key={event.id}>
                <EventCard event={event} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-8 text-muted-foreground">No upcoming events listed right now.</p>
        )}
      </section>

      <section className="border-y border-border bg-secondary/60">
        <div className="mx-auto max-w-6xl px-4 py-16">
          <h2 className="text-3xl font-extrabold tracking-tight">What you&apos;ll find here</h2>
          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, text }) => (
              <li key={title} className="rounded-xl border border-border bg-card p-5">
                <span className="flex size-10 items-center justify-center rounded-lg bg-accent">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <h3 className="mt-4 text-lg font-bold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pt-16">
        <div className="flex flex-col items-start gap-6 rounded-2xl bg-primary p-8 text-primary-foreground md:flex-row md:items-center md:justify-between md:p-12">
          <div>
            <h2 className="text-3xl font-extrabold tracking-tight">Are you an artist?</h2>
            <p className="mt-2 max-w-xl text-primary-foreground/85">
              Missing from an event, or need to update your info? Send us your catalogue and we&apos;ll add it to
              the archive.
            </p>
          </div>
          <Link
            href="/contact#artist-form"
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-background px-6 py-3 font-semibold text-foreground transition-transform hover:-translate-y-0.5"
          >
            Submit catalogue <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </section>

      <section aria-labelledby="join-community" className="mx-auto max-w-6xl px-4 py-12">
        <div className="rounded-2xl border-2 border-foreground bg-card p-7 shadow-[6px_6px_0_0_var(--color-foreground)] md:flex md:items-center md:justify-between md:gap-8 md:p-9">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wider text-primary">Stay in the loop</p>
            <h2 id="join-community" className="mt-1 text-3xl font-extrabold tracking-tight">Join the community ♡</h2>
            <p className="mt-2 max-w-xl leading-relaxed text-muted-foreground">Join our Discord or follow us on Instagram for more MYConCatalogue updates.</p>
          </div>
          <div className="mt-5 flex shrink-0 flex-wrap gap-3 md:mt-0">
            <a href="https://discord.gg/F5nT5nxW3e" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-3 font-semibold text-primary-foreground transition-transform hover:-translate-y-0.5"><MessageCircle className="size-4" aria-hidden="true" />Join Discord</a>
            <a href="https://www.instagram.com/my_concatalogue/" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 rounded-full border border-foreground px-5 py-3 font-semibold transition-colors hover:bg-foreground hover:text-background"><InstagramIcon className="size-4" />Follow on Instagram</a>
          </div>
        </div>
      </section>
    </>
  )
}
