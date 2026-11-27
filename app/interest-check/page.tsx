import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'
import { InterestCheckBrowser } from '@/components/interest-check-browser'
import { getInterestChecks } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Interest Check',
  description: 'Find ongoing and upcoming interest checks for fan events, Stamp Rallies, and other fan-organised events in Malaysia.',
}

type Props = { searchParams: Promise<{ year?: string | string[] }> }

export default async function InterestCheckPage({ searchParams }: Props) {
  const items = await getInterestChecks()
  const { year: yearParam } = await searchParams
  const requestedYear = typeof yearParam === 'string' ? Number(yearParam) : null
  const years = [...new Set(items.map((item) => item.year))]
  const initialYear = requestedYear && years.includes(requestedYear) ? requestedYear : null
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())
  const sortedItems = [...items].sort((a, b) => {
    if (a.year !== b.year) return a.year - b.year
    const past = (item: typeof a) => ['past', 'closed'].includes(item.status?.trim().toLocaleLowerCase() ?? '') || Boolean(item.cutoffDate && item.cutoffDate < today)
    const aPast = past(a)
    const bPast = past(b)
    if (aPast !== bPast) return aPast ? 1 : -1
    if (aPast) return (b.cutoffDate ?? '').localeCompare(a.cutoffDate ?? '') || a.title.localeCompare(b.title)
    return (a.cutoffDate ?? '9999-12-31').localeCompare(b.cutoffDate ?? '9999-12-31') || a.title.localeCompare(b.title)
  })

  return <>
    <PageHeader eyebrow="Interest check" title="Interest Checks" description="Browse interest checks for Stamp Rallies, fan events, collabs, and other fan-organised events. Social posts and shared files are embedded where possible." />
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <InterestCheckBrowser items={sortedItems} initialYear={initialYear} />
      <section aria-labelledby="submit-interest-check" className="mt-14 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--color-foreground)] md:p-8">
        <h2 id="submit-interest-check" className="text-2xl font-extrabold">Share an event with us</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Have a Stamp Rally or fan event interest check to add? Send it through the matching submission form.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Link href="/contact#stamp-rally-form" className="rounded-full bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90">Submit a Stamp Rally</Link>
          <Link href="/contact#fan-cafe-form" className="rounded-full border border-foreground px-5 py-3 text-sm font-semibold hover:bg-foreground hover:text-background">Submit a Fan Event</Link>
        </div>
      </section>
    </div>
  </>
}
