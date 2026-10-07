import type { Metadata } from 'next'
import Link from 'next/link'
import { CalendarDays, Clock3, MapPin } from 'lucide-react'
import { PageHeader } from '@/components/page-header'
import { FanCafeSubmissionForm } from '@/components/fan-cafe-submission-form'
import { InstagramPostEmbed } from '@/components/instagram-post-embed'
import { InstagramIcon } from '@/components/social-icons'
import { formatDateRange, instagramUrl } from '@/lib/format'
import { getFanCafes } from '@/lib/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Fan Cafes',
  description: 'Birthday cafes, collab cafes and fan-run events around Malaysia.',
}

type Props = { searchParams: Promise<{ year?: string | string[] }> }

export default async function FanCafesPage({ searchParams }: Props) {
  const cafes = await getFanCafes()
  const { year: yearParam } = await searchParams
  const requestedYear = typeof yearParam === 'string' ? Number(yearParam) : null
  const availableYears = [...new Set(cafes.flatMap((cafe) => cafe.startDate ? [Number(cafe.startDate.slice(0, 4))] : []))].sort((a, b) => a - b)
  const selectedYear = requestedYear && availableYears.includes(requestedYear) ? requestedYear : null
  const visibleCafes = selectedYear
    ? cafes.filter((cafe) => cafe.startDate?.startsWith(String(selectedYear)))
    : cafes
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
  const cafesByYear = new Map<string, typeof cafes>()
  for (const cafe of visibleCafes) {
    const year = cafe.startDate?.slice(0, 4) ?? 'TBA'
    cafesByYear.set(year, [...(cafesByYear.get(year) ?? []), cafe])
  }
  // Preserve the archive's date-based event order, including past events and undated listings.
  const displayYears = [...cafesByYear.keys()]

  return (
    <>
      <PageHeader
        eyebrow="Fan cafes"
        title="Cup Sleeve Events, Fan Cafes, Collabs, & Character Birthday Events"
        description="Fan-organised events celebrating characters and series — with cup sleeves, freebies and plenty of photo spots."
      >
        <nav aria-label="Filter fan cafes by year" className="mt-6">
          <ul className="flex flex-wrap gap-2">
            <li>
              <Link
                href="/fan-cafes"
                aria-current={selectedYear === null ? 'page' : undefined}
                className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${selectedYear === null ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}
              >
                All Fan Cafes
              </Link>
            </li>
            {availableYears.map((year) => (
              <li key={year}>
                <Link
                  href={`/fan-cafes?year=${year}`}
                  aria-current={selectedYear === year ? 'page' : undefined}
                  className={`inline-flex rounded-full border px-4 py-1.5 text-sm font-semibold transition-colors ${selectedYear === year ? 'border-foreground bg-foreground text-background' : 'border-foreground bg-card hover:bg-foreground hover:text-background'}`}
                >
                  {year}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </PageHeader>
      <div className="mx-auto max-w-6xl px-4 py-14">
        {cafes.length === 0 ? (
          <p className="text-muted-foreground">No fan cafes archived yet.</p>
        ) : visibleCafes.length === 0 ? (
          <p className="text-muted-foreground">No fan cafes are listed for {selectedYear} yet.</p>
        ) : (
          <div className="flex flex-col gap-12">
            {displayYears.map((year) => (
              <section key={year} aria-labelledby={`cafe-year-${year}`}>
                <h2 id={`cafe-year-${year}`} className="border-b-2 border-foreground pb-3 text-3xl font-extrabold">{year}</h2>
                <ul className="mt-6 grid gap-6 md:grid-cols-2">
                  {cafesByYear.get(year)!.map((cafe) => (
                    <li key={cafe.id} className="flex flex-col rounded-xl border border-border bg-card p-5">
                      <h3 className="text-xl font-bold leading-tight">{cafe.name}</h3>
                      {cafe.instagramPostUrl && (
                        <div className="mt-4">
                          <InstagramPostEmbed postUrl={cafe.instagramPostUrl} title={`${cafe.name} Instagram post`} />
                        </div>
                      )}
                      <p className={`mt-4 inline-flex w-fit rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide ${cafe.startDate && (cafe.endDate ?? cafe.startDate) >= today ? 'bg-emerald-700 text-white' : cafe.startDate ? 'bg-muted text-muted-foreground' : 'border border-border text-muted-foreground'}`}>
                        {cafe.startDate ? ((cafe.endDate ?? cafe.startDate) >= today ? 'Upcoming' : 'Past') : 'Date TBA'}
                      </p>
                      {cafe.fandom && (
                        <div className="mt-4">
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Fandom</p>
                          <p className="mt-1 inline-flex rounded-full bg-accent px-3 py-1 text-sm font-semibold text-accent-foreground">{cafe.fandom}</p>
                        </div>
                      )}
                      {cafe.instagram && (
                        <a href={/^https?:\/\//i.test(cafe.instagram) ? cafe.instagram : instagramUrl(cafe.instagram)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-primary hover:underline">
                          <InstagramIcon className="size-4" aria-hidden="true" />
                          @{cafe.instagram.replace(/^@/, '').split('/').filter(Boolean).at(-1)}
                        </a>
                      )}
                      {cafe.description && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{cafe.description}</p>}
                      <dl className="mt-5 flex flex-col gap-3 border-t border-border pt-4 text-sm">
                        <div className="flex items-start gap-2">
                          <CalendarDays className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</dt><dd className="mt-0.5">{formatDateRange(cafe.startDate, cafe.endDate)}</dd></div>
                        </div>
                        <div className="flex items-start gap-2">
                          <Clock3 className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Time</dt><dd className="mt-0.5">{cafe.startTime && cafe.endTime ? `${cafe.startTime} – ${cafe.endTime}` : cafe.startTime ?? 'TBA'}</dd></div>
                        </div>
                        <div className="flex items-start gap-2">
                          <MapPin className="mt-0.5 size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                          <div><dt className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</dt><dd className="mt-0.5">{cafe.location ?? 'TBA'}</dd></div>
                        </div>
                      </dl>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
        <section aria-labelledby="submit-fan-cafe" className="mt-14 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--color-foreground)] md:p-8">
          <h2 id="submit-fan-cafe" className="text-2xl font-extrabold">Know a fan cafe or collab event?</h2>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Share its details with us and we&apos;ll review it for the directory. Please use the organiser&apos;s public social account.
          </p>
          <div className="mt-6">
            <FanCafeSubmissionForm />
          </div>
        </section>
      </div>
    </>
  )
}
