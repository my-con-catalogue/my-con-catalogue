import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, ExternalLink } from 'lucide-react'
import { InstagramPostEmbed } from '@/components/instagram-post-embed'
import { PageHeader } from '@/components/page-header'
import { formatDateRange } from '@/lib/format'
import { getInterestChecks } from '@/lib/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Interest Check',
  description: 'Find ongoing and upcoming interest checks for Fan Cafes, Stamp Rallies, and other fan-organised events in Malaysia.',
}

type Props = { searchParams: Promise<{ year?: string | string[] }> }

function validHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

function isInstagramPost(value: string) {
  const url = validHttpUrl(value)
  return Boolean(url && ['instagram.com', 'www.instagram.com'].includes(url.hostname) && /^\/(p|reel|tv)\/[A-Za-z0-9_-]+\/?$/.test(url.pathname))
}

function getStatusStyle(status: string) {
  const normalized = status.trim().toLowerCase()
  if (normalized === 'upcoming') return 'bg-sky-100 text-sky-900'
  if (normalized === 'ongoing' || normalized === 'open') return 'bg-emerald-700 text-white'
  if (normalized === 'closed' || normalized === 'past') return 'bg-muted text-muted-foreground'
  return 'bg-accent text-accent-foreground'
}

export default async function InterestCheckPage({ searchParams }: Props) {
  const items = await getInterestChecks()
  const { year: yearParam } = await searchParams
  const requestedYear = typeof yearParam === 'string' ? Number(yearParam) : null
  const availableYears = [...new Set(items.map((item) => item.year))].sort((a, b) => a - b)
  const selectedYear = requestedYear && availableYears.includes(requestedYear) ? requestedYear : null
  const visibleItems = selectedYear ? items.filter((item) => item.year === selectedYear) : items
  const grouped = new Map<number, typeof items>()
  for (const item of visibleItems) grouped.set(item.year, [...(grouped.get(item.year) ?? []), item])

  return (
    <>
      <PageHeader
        eyebrow="Interest check"
        title="Interest Checks"
        description="Browse interest checks for Stamp Rallies, Fan Cafes, collabs, and other fan-organised events. Instagram posts are embedded where possible; posts on other platforms link to the original."
      >
        <nav aria-label="Filter interest checks by year" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link href="/interest-check" aria-current={selectedYear === null ? 'page' : undefined} className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${selectedYear === null ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}>
                All Interest Checks
              </Link>
            </li>
            {availableYears.map((year) => (
              <li key={year}>
                <Link href={`/interest-check?year=${year}`} aria-current={selectedYear === year ? 'page' : undefined} className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${selectedYear === year ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}>
                  {year}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>

      <div className="mx-auto max-w-6xl px-4 py-14">
        {items.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">No interest checks have been added yet.</p>
        ) : visibleItems.length === 0 ? (
          <p className="text-muted-foreground">No interest checks are listed for {selectedYear} yet.</p>
        ) : (
          <div className="flex flex-col gap-12">
            {[...grouped.entries()].map(([year, yearItems]) => (
              <section key={year} aria-labelledby={`interest-year-${year}`}>
                <h2 id={`interest-year-${year}`} className="border-b-2 border-foreground pb-3 text-3xl font-extrabold">{year}</h2>
                <ul className="mt-6 grid gap-6 md:grid-cols-2">
                  {yearItems.map((item) => {
                    const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
                    const automaticStatus = item.cutoffDate && item.cutoffDate < today ? 'Past' : 'Ongoing'
                    // A non-empty status entered in Supabase takes precedence over date-based status.
                    const status = item.status?.trim() || automaticStatus
                    const postUrl = item.socialPostUrl ? validHttpUrl(item.socialPostUrl) : null
                    return (
                      <li key={item.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
                        <div className="flex flex-wrap items-start justify-between gap-3">
                          <h3 className="text-xl font-bold leading-tight">{item.title}</h3>
                          <span className={`inline-flex shrink-0 rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${getStatusStyle(status)}`}>{status}</span>
                        </div>
                        {item.socialPostUrl && (isInstagramPost(item.socialPostUrl) ? (
                          <div className="mt-4">
                            <InstagramPostEmbed postUrl={item.socialPostUrl} title={`${item.title} social media post`} />
                          </div>
                        ) : postUrl ? (
                          <a href={postUrl.href} target="_blank" rel="noopener noreferrer" className="mt-4 flex min-h-28 items-center justify-between gap-4 rounded-xl border border-border bg-secondary/50 p-5 font-semibold hover:border-primary hover:text-primary">
                            <span>View the original social media post</span><ExternalLink className="size-5 shrink-0" aria-hidden="true" />
                          </a>
                        ) : null)}
                        <dl className="mt-5 flex flex-col gap-4 border-t border-border pt-4 text-sm">
                          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Type</dt><dd className="mt-1 inline-flex rounded-full bg-accent px-3 py-1 font-semibold text-accent-foreground">{item.type}</dd></div>
                          {item.fandom?.trim() && <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fandom</dt><dd className="mt-1">{item.fandom}</dd></div>}
                          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Event</dt><dd className="mt-1">{item.eventName}</dd></div>
                          <div className="flex items-start gap-2"><CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" /><div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Cutoff date</dt><dd className="mt-0.5">{item.cutoffDate ? formatDateRange(item.cutoffDate, item.cutoffDate) : 'No cutoff date'}</dd></div></div>
                        </dl>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ))}
          </div>
        )}

        <section aria-labelledby="submit-interest-check" className="mt-14 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--color-foreground)] md:p-8">
          <h2 id="submit-interest-check" className="text-2xl font-extrabold">Share an event with us</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Have a Stamp Rally or Fan Cafe interest check to add? Send it through the matching submission form.</p>
          <div className="mt-5 flex flex-wrap gap-3">
            <Link href="/contact#stamp-rally-form" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Submit a Stamp Rally</Link>
            <Link href="/contact#fan-cafe-form" className="rounded-full border border-foreground px-5 py-3 text-sm font-semibold hover:bg-foreground hover:text-background">Submit a Fan Cafe</Link>
          </div>
        </section>
      </div>
    </>
  )
}
