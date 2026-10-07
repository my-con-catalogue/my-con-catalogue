import type { Metadata } from 'next'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = {
  title: 'Disclaimer',
  description:
    'my.concatalogue is an independent, community-run archive of Artist Alleys and conventions in Malaysia. Read our disclaimer on ownership, copyright and listings.',
}

const contactLink = (
  <Link href="/contact" className="font-semibold text-primary underline underline-offset-4">
    Submit / Contact
  </Link>
)

const artistRequests = [
  'Correct your information',
  'Update your social media links',
  'Add a missing catalogue',
  'Update your booth information',
  'Request changes to your listing',
  'Request removal of your information or materials',
]

const sections: { title: string; content: ReactNode }[] = [
  {
    title: 'Ownership & Copyright',
    content: (
      <>
        <p>
          We do not claim ownership of any event names, logos, artwork, artist catalogues, Artist Alley maps,
          photographs, or other materials featured on this website.
        </p>
        <p>
          All rights to these materials remain with their respective owners, artists, organizers, creators, or
          copyright holders.
        </p>
        <p>
          Materials are included <strong className="text-foreground">free of charge</strong> for{' '}
          <strong className="text-foreground">archival, informational, and directory purposes</strong>{' '}
          to help convention attendees discover artists and revisit Artist Alley information from Malaysian events.
        </p>
        <p>
          Where possible, we provide links to the original artist, event organizer, or source so that users can access
          and support the original creators.
        </p>
      </>
    ),
  },
  {
    title: 'Artist Information',
    content: (
      <>
        <p>
          Artist names, booth numbers, social media accounts, catalogue information, and other details are collected
          from publicly available sources or submitted by artists and members of the community.
        </p>
        <p>
          We do our best to keep information accurate, but some information may be incomplete, outdated, or incorrect.
        </p>
        <p>If you are an artist and would like to:</p>
        <ul className="flex list-disc flex-col gap-1 pl-5">
          {artistRequests.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
        <p>please contact us through our {contactLink} form.</p>
      </>
    ),
  },
  {
    title: 'Event Information',
    content: (
      <>
        <p>
          Event dates, venues, booth layouts, Artist Alley maps, and other event-related information may change over
          time.
        </p>
        <p>
          Archived information represents the information available to us at the time of collection and may not
          reflect the latest information provided by the event organizer.
        </p>
        <p>
          For current event dates, rules, schedules, venue information, and other official announcements, please refer
          to the event organizer&apos;s official channels.
        </p>
      </>
    ),
  },
  {
    title: 'Catalogue & Artwork',
    content: (
      <>
        <p>
          my.concatalogue does not sell or <strong className="text-foreground">claim ownership</strong> of the artist catalogues or artwork displayed or linked through
          this website. The archive is provided <strong className="text-foreground">free of charge</strong>.
        </p>
        <p>
          Our goal is to help users{' '}
          <strong className="text-foreground">discover and navigate to the original artists and sources</strong>, not to
          replace the original catalogue, artist page, or event website.
        </p>
        <p>
          If you are the copyright holder of material featured on this website and believe it has been included
          incorrectly or would like it removed or updated, contact us through{' '}
          <a href="https://discord.gg/F5nT5nxW3e" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">Discord</a>{' '}
          or <a href="https://www.instagram.com/my_concatalogue/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">Instagram</a>, or{' '}
          <Link href="/contact" className="font-semibold text-primary underline underline-offset-4">submit a suggestion</Link>.{' '}
          Provide the relevant information and we will review the request.
        </p>
      </>
    ),
  },
  {
    title: 'Independent Archive',
    content: (
      <>
        <p>
          my.concatalogue is intended as an independent community archive and directory. Inclusion of an event, artist, or
          catalogue does not constitute an endorsement, sponsorship, partnership, or official affiliation.
        </p>
        <p>
          The purpose of this website is simply to make Malaysian convention and Artist Alley information{' '}
          <strong className="text-foreground">easier to discover, browse, and preserve for the community.</strong>
        </p>
      </>
    ),
  },
]

export default function DisclaimerPage() {
  return (
    <>
      <PageHeader eyebrow="Disclaimer" title="Disclaimer" />
      <div className="mx-auto max-w-3xl px-4 py-14">
        <div className="flex flex-col gap-4 rounded-xl bg-secondary p-6 leading-relaxed">
          <p className="font-semibold">
            my.concatalogue is an independent, community-run archive created to collect and organize information about
            Artist Alleys and conventions in Malaysia.
          </p>
          <p className="text-muted-foreground">
            my.concatalogue is{' '}
            <strong className="text-foreground">
              not affiliated with, owned by, sponsored by, or officially associated with any convention, event
              organizer, artist, artist collective, or other organization featured on this website unless explicitly
              stated otherwise.
            </strong>
          </p>
        </div>

        <ol className="mt-12 flex flex-col gap-10">
          {sections.map((s, i) => (
            <li key={s.title} className="flex gap-4">
              <span className="font-heading text-2xl font-extrabold text-primary">{String(i + 1).padStart(2, '0')}</span>
              <div className="flex-1">
                <h2 className="text-xl font-bold">{s.title}</h2>
                <div className="mt-3 flex flex-col gap-3 leading-relaxed text-muted-foreground">{s.content}</div>
              </div>
            </li>
          ))}
        </ol>

        <p className="mt-12 border-t border-border pt-6 text-sm font-semibold">Last updated: October 2026</p>
      </div>
    </>
  )
}
