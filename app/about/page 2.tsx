import type { Metadata } from 'next'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = {
  title: 'About',
  description: 'What is myconarchive and Malaysia Convention Catalogues?',
}

const steps = [
  {
    n: '01',
    title: 'We collect',
    text: 'Before and after each convention, we gather artist alley catalogues shared publicly by artists and official event accounts.',
  },
  {
    n: '02',
    title: 'We organise',
    text: 'Catalogues are sorted by year and event, listed alphabetically, and tagged by fandom and merch type.',
  },
  {
    n: '03',
    title: 'You discover',
    text: 'Plan your route, find artists for your favourite series, and revisit past events long after they end.',
  },
]

export default function AboutPage() {
  return (
    <>
      <PageHeader
        eyebrow="About"
        title="What is myconarchive?"
        description="myconarchive is the fan-run project behind Malaysia Convention Catalogues — a searchable home for artist alley catalogues from anime conventions across Malaysia."
      />
      <div className="mx-auto grid max-w-6xl gap-12 px-4 py-14 md:grid-cols-[1.2fr_1fr]">
        <div className="flex flex-col gap-5 text-lg leading-relaxed">
          <p>
            Every convention season, hundreds of local artists share their catalogues on Instagram, X and
            event pages. They&apos;re amazing — but they&apos;re also scattered, buried in feeds, and often
            disappear once the event is over.
          </p>
          <p>
            myconarchive started as a simple idea: put them all in one place. Whether you&apos;re hunting
            for Genshin keychains at Comic Fiesta or trying to remember which artist sold that print you
            loved two years ago, the archive is here to help.
          </p>
          <p>
            We also track stamp rallies and fan cafes, because the community is so much more than the
            artist alley.
          </p>
          <p>
            This is a community project. If you spot something missing or wrong, please{' '}
            <Link href="/contact" className="font-semibold text-primary underline underline-offset-4">
              let us know
            </Link>
            .
          </p>
        </div>
        <ol className="flex flex-col gap-4">
          {steps.map((s) => (
            <li key={s.n} className="rounded-xl border border-border bg-card p-5">
              <span className="font-heading text-sm font-bold text-primary">{s.n}</span>
              <h2 className="mt-1 text-xl font-bold">{s.title}</h2>
              <p className="mt-2 text-muted-foreground">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </>
  )
}
