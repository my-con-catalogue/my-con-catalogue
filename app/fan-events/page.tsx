import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { FanCafeSubmissionForm } from '@/components/fan-cafe-submission-form'
import { FanEventBrowser } from '@/components/fan-event-browser'
import { getFanCafes } from '@/lib/queries'

export const revalidate = 3600

export const metadata: Metadata = {
  title: 'Fan Events',
  description: 'Cup sleeve events, collabs, character birthday events, and other fan-run events around Malaysia.',
}

type Props = { searchParams: Promise<{ year?: string | string[] }> }

export default async function FanEventsPage({ searchParams }: Props) {
  const cafes = await getFanCafes()
  const { year: yearParam } = await searchParams
  const requestedYear = typeof yearParam === 'string' ? Number(yearParam) : null
  const years = [...new Set(cafes.flatMap((cafe) => cafe.startDate ? [Number(cafe.startDate.slice(0, 4))] : []))]
  const initialYear = requestedYear && years.includes(requestedYear) ? requestedYear : null

  return <>
    <PageHeader eyebrow="Fan events" title="Cup Sleeve Events, Fan Events, Collabs, & Character Birthday Events" description="Fan-organised events celebrating characters and series — with cup sleeves, freebies and plenty of photo spots." />
    <div className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <FanEventBrowser cafes={cafes} initialYear={initialYear} />
      <section aria-labelledby="submit-fan-event" className="mt-14 rounded-2xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--color-foreground)] md:p-8">
        <h2 id="submit-fan-event" className="text-2xl font-extrabold">Know a fan event or collab?</h2>
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground">Share its details with us and we&apos;ll review it for the directory. Please use the organiser&apos;s public social account.</p>
        <div className="mt-6"><FanCafeSubmissionForm /></div>
      </section>
    </div>
  </>
}
