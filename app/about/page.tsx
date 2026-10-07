import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import Link from 'next/link'
import { PageHeader } from '@/components/page-header'

export const metadata: Metadata = {
  title: 'About MYConCatalogue',
  description: 'The story behind MYConCatalogue, a community-focused archive of Malaysian convention information.',
}

const siteSections = [
  ['01 — HOME', 'A quick look at the latest additions and what’s happening in the archive.'],
  ['02 — ABOUT', 'Learn more about MYConCatalogue and why this archive was created.'],
  ['03 — EVENTS', 'Browse conventions, Artist Alley catalogues, and Stamp Rally information.'],
  ['04 — FAN CAFES', 'Find and browse Fan Cafe information collected from Malaysian conventions.'],
  ['05 — ARTISTS', 'Discover artists and find their social media or convention appearances.'],
  ['06 — CONTACT', 'Submit missing information, corrections, catalogues, or other suggestions.'],
]

export default function AboutPage() {
  return (
    <>
      <PageHeader title="About MYConCatalogue" />
      <main className="mx-auto max-w-4xl px-4 py-12 md:py-16">
        <section aria-labelledby="whats-this" className="rounded-2xl border-2 border-foreground bg-card p-6 shadow-[6px_6px_0_0_var(--color-foreground)] md:p-9">
          <SectionHeading id="whats-this">So, What&apos;s This?</SectionHeading>
          <p className="mt-5 text-lg leading-relaxed"><strong>MYConCatalogue — Malaysia Convention Catalogue</strong> is an independent, community-focused archive created to make Malaysian convention information easier to browse and find.</p>
          <p className="mt-5 leading-relaxed">Here&apos;s what you can find around the website:</p>
          <ol className="mt-4 grid gap-3 sm:grid-cols-2">
            {siteSections.map(([title, text]) => (
              <li key={title} className="rounded-xl bg-secondary/70 p-4">
                <p className="text-xs font-bold tracking-wider text-primary">{title}</p>
                <p className="mt-1 text-sm">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-12 flex flex-col gap-10">
          <SectionDivider />
          <section aria-labelledby="how-started">
            <SectionHeading id="how-started">How It Started</SectionHeading>
            <div className="mt-5 flex flex-col gap-4 leading-relaxed text-muted-foreground">
              <p>The admin behind MYConCatalogue is actually a fairly recent convention-goer.</p>
              <p>I only started attending conventions around AniManGaki 2026 (AMG2026), and very quickly became interested in exploring Artist Alley and everything else that conventions have to offer.</p>
              <p>I started saving Artist Alley catalogues for myself before each event. Eventually, I began sharing them with friends who weren&apos;t attending and asking if there was anything they wanted me to pick up.</p>
              <p>Some of them mentioned that having all the catalogues together was actually really convenient. If you don&apos;t follow every artist individually, finding catalogues one by one across different social media accounts can be quite difficult — especially when you just want to casually browse and see what&apos;s available.</p>
              <p>That led to a simple thought:</p>
              <blockquote className="border-l-4 border-primary py-2 pl-5 font-heading text-xl font-bold text-foreground">Wouldn&apos;t it be nice to have somewhere to browse them all together?</blockquote>
              <p>Since I was already collecting the catalogues anyway, I decided to turn my personal collection into something that other convention-goers could use too.</p>
              <p>And that&apos;s how MYConCatalogue started.</p>
            </div>
          </section>

          <SectionDivider />
          <section aria-labelledby="collection-archive">
            <SectionHeading id="collection-archive">From a Personal Collection to an Archive</SectionHeading>
            <div className="mt-5 flex flex-col gap-4 leading-relaxed text-muted-foreground">
              <p>The website was originally intended to be ready before CosTime 7 and NijiFest, but there was quite a bit to figure out first.</p>
              <p>I consulted with friends about building the website, commissioned a friend to create the logo, set up the Discord community, and planned the social media posts alongside collecting suggestions and references.</p>
              <p>I wanted the website to be ready before Anime Fest! 2026 / 3. I did not want Comic Fiesta to be the first catalogue collection I covered out of the blue, because it is such a large event and deserved a more considered start for the archive.</p>
              <p>So, after quite a bit of planning, collecting, and coding, MYConCatalogue was put together in roughly one week before Anime Fest! 2026 / 3.</p>
              <p>It is still very much a work in progress. There is only one admin behind the project for now, so the archive will not be perfect from the beginning — and there will definitely be information that is missing, outdated, or needs correcting.</p>
              <p>But it has to start somewhere.</p>
            </div>
          </section>

          <SectionDivider />
          <section aria-labelledby="what-collect">
            <SectionHeading id="what-collect">What We Collect</SectionHeading>
            <p className="mt-5 leading-relaxed text-muted-foreground">MYConCatalogue currently focuses on information that can help convention-goers discover and revisit Malaysian conventions, including:</p>
            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <CollectionCard title="Artist Alley" items={['Artist catalogues', 'Booth numbers and layouts', 'Artist information and social links']} />
              <CollectionCard title="Conventions" items={['Convention information', 'Event editions and dates', 'Useful links and references']} />
              <CollectionCard title="Stamp Rally" items={['Stamp Rally information and participating locations']} />
              <CollectionCard title="Fan Cafes" items={['Fan Cafe listings and available event information']} />
            </div>
            <p className="mt-5 leading-relaxed text-muted-foreground">The archive will continue to grow as more conventions take place and more information becomes available.</p>
          </section>

          <SectionDivider />
          <section aria-labelledby="community">
            <SectionHeading id="community">Built for the Community</SectionHeading>
            <div className="mt-5 flex flex-col gap-4 leading-relaxed text-muted-foreground">
              <p>MYConCatalogue is a free, independent archive made simply to make convention information easier for fans to discover, browse, and revisit.</p>
              <p>It is not intended to replace official convention websites, artist pages, catalogues, or social media accounts. To help artists keep their credit and make their work easy to access, we try to embed the original Instagram posts directly wherever possible, alongside links to the artist and source.</p>
              <p>When browsing a catalogue, please support the artist by liking or resharing their post and following their account.</p>
              <p>The information is collected and organised for archival and informational purposes only.</p>
              <p>If you are an artist, organiser, or information owner and notice something that needs to be corrected, updated, credited, or removed, please contact us on <a href="https://www.instagram.com/my_concatalogue/" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Instagram</a> or <a href="https://discord.gg/F5nT5nxW3e" target="_blank" rel="noopener noreferrer" className="underline underline-offset-4">Discord</a>, or submit a suggestion through the <Link href="/contact" className="underline underline-offset-4">contact form</Link>.</p>
              <p>And if you have a catalogue, event, Stamp Rally, or Fan Cafe that isn&apos;t here yet — please feel free to submit it too!</p>
              <p><Link href="/contact" className="font-bold text-primary underline underline-offset-4">Contact us or send a submission ♡</Link></p>
            </div>
          </section>

          <SectionDivider />
          <section aria-labelledby="fan-cafes-ps">
            <SectionHeading id="fan-cafes-ps">A Small Note About Fan Cafes</SectionHeading>
            <div className="mt-5 flex flex-col gap-4 leading-relaxed text-muted-foreground">
              <p>P.S. The admin doesn&apos;t attend Fan Cafes as often as Artist Alleys, so this is one area where community help would be especially appreciated!</p>
              <p>If you attend a Fan Cafe and have information, catalogues, updates, or corrections that could help the archive, please consider using the <Link href="/fan-cafes#submit-fan-cafe" className="font-semibold text-primary underline underline-offset-4">Fan Cafe submission form</Link>. I&apos;ll do my best to keep everything updated on time.</p>
              <p>Meanwhile, I promise I&apos;m still trying my best to stalk convention catalogues religiously. ♡</p>
            </div>
          </section>

          <SectionDivider />
          <section aria-labelledby="credits-disclaimer">
            <SectionHeading id="credits-disclaimer">Credits &amp; Disclaimer</SectionHeading>
            <div className="mt-5 flex flex-col gap-4 leading-relaxed text-muted-foreground">
              <p>MYConCatalogue is an independent, non-official archive and is not affiliated with, sponsored by, endorsed by, or officially associated with any convention, organiser, artist, Fan Cafe, or other organisation unless explicitly stated.</p>
              <p>All event names, logos, artwork, catalogues, photographs, artist information, and other materials belong to their respective artists, creators, organisers, and copyright holders.</p>
              <p>MYConCatalogue <strong className="text-foreground">does not claim ownership</strong> of any of these materials.</p>
              <p>The website is provided <strong className="text-foreground">free of charge</strong> and is created solely to compile and organise publicly available and community-submitted information for the convenience of convention-goers and fans.</p>
              <p>Information on the website may be incomplete, outdated, or inaccurate. For current event information, please always refer to the official channels of the relevant convention, organiser, artist, or Fan Cafe.</p>
              <p>If anything needs to be taken down or corrected, please contact us through <a href="https://discord.gg/F5nT5nxW3e" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">Discord</a> or <a href="https://www.instagram.com/my_concatalogue/" target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">Instagram</a>, or <Link href="/contact" className="font-semibold text-primary underline underline-offset-4">submit a suggestion</Link>. We will review the request and update or remove the material where appropriate.</p>
              <p>For the full details, please see our <Link href="/disclaimer" className="font-semibold text-primary underline underline-offset-4">Disclaimer</Link> page.</p>
            </div>
          </section>

          <SectionDivider />
          <section aria-labelledby="closing-notes" className="rounded-2xl bg-primary p-6 text-primary-foreground md:p-8">
            <SectionHeading id="closing-notes">And That&apos;s MYConCatalogue!</SectionHeading>
            <div className="mt-5 flex flex-col gap-4 leading-relaxed text-primary-foreground/90">
              <p>This started because I wanted an easier way to browse convention catalogues for myself.</p>
              <p>Now, hopefully, it can be useful to someone else too.</p>
              <p>Whether you&apos;re looking for an artist you remember from a previous convention, casually browsing an upcoming Artist Alley, checking a Stamp Rally, or trying to find a Fan Cafe you heard about —</p>
              <p>I hope MYConCatalogue makes it just a little easier.</p>
              <p>Thank you for visiting, and happy browsing! ♡</p>
              <p className="font-bold">— Fois D Ciel</p>
              <p><em>Admin of MYConCatalogue</em></p>
            </div>
          </section>
        </div>
      </main>
    </>
  )
}

function CollectionCard({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <h3 className="font-bold text-foreground">{title}</h3>
      <ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-relaxed text-muted-foreground">
        {items.map((item) => <li key={item}>{item}</li>)}
      </ul>
    </div>
  )
}

function SectionHeading({ id, children }: { id: string; children: ReactNode }) {
  return <h2 id={id} className="text-2xl font-extrabold tracking-tight md:text-3xl">{children}</h2>
}

function SectionDivider() {
  return (
    <div aria-hidden="true" className="flex items-center gap-4 text-primary">
      <span className="h-px flex-1 bg-border" />
      <span className="text-lg">✧</span>
      <span className="h-px flex-1 bg-border" />
    </div>
  )
}
