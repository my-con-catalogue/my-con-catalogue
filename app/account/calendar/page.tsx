import type { Metadata } from 'next'
import { PageHeader } from '@/components/page-header'
import { PersonalCalendarView } from '@/components/personal-calendar-view'

export const metadata: Metadata = { title: 'My personal calendar' }

export default async function PersonalCalendarPage() {
  return <>
    <PageHeader eyebrow="Your account" title="Personal calendar" description="Keep important convention, fan event, interest check, and pick-up cutoff dates together." />
    <section className="mx-auto max-w-6xl px-4 py-10 md:py-14">
      <PersonalCalendarView />
    </section>
  </>
}
