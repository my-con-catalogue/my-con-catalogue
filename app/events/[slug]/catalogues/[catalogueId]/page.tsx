import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { getEventBySlug, getEventCatalogueById } from '@/lib/queries'
import { getArtistSocialAccounts } from '@/lib/artist-socials'
import { ArtistSocialLinks } from '@/components/artist-social-links'
import { InstagramPostEmbed } from '@/components/instagram-post-embed'
import { SocialPostEmbed } from '@/components/social-post-embed'
import { supportsSocialPostEmbed } from '@/lib/social-post-embed-utils'
import { CatalogueViewTracker } from '@/components/catalogue-view-tracker'
import { CatalogueBookmarkPanel } from '@/components/catalogue-bookmark-panel'
import { CatalogueCover } from '@/components/catalogue-cover'
import { CalendarReminderButton } from '@/components/calendar-reminder-button'
import { parsePickupCutoffDates } from '@/lib/pickup-cutoff-dates'

function displayTag(tag: string) {
  return tag.toLocaleLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

function externalLink(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:' ? url : null
  } catch {
    return null
  }
}

export const revalidate = 3600

type Props = { params: Promise<{ slug: string; catalogueId: string }> }

async function getCatalogue(params: Props['params']) {
  const { slug, catalogueId } = await params
  const id = Number(catalogueId)
  if (!Number.isInteger(id) || id < 1) return null
  const event = await getEventBySlug(slug)
  if (!event) return null
  const catalogue = await getEventCatalogueById(event.slug, id)
  return catalogue ? { event, catalogue } : null
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const data = await getCatalogue(params)
  if (!data) return { title: 'Catalogue not found' }
  return { title: `${data.catalogue.artistName} · ${data.catalogue.booth}` }
}

export default async function CatalogueDetailPage({ params }: Props) {
  const data = await getCatalogue(params)
  if (!data) notFound()
  const { event, catalogue } = data
  const artistSocialAccounts = getArtistSocialAccounts(catalogue.artistInstagrams, catalogue.artistSocialLinks)
  const catalogueSources = [...catalogue.instagramPosts, ...catalogue.catalogueFileUrls, ...catalogue.catalogueLinks]
  const coverSource = catalogueSources.find((source) => externalLink(source))
  const withoutCoverSource = (sources: string[]) => {
    const index = coverSource ? sources.indexOf(coverSource) : -1
    return index < 0 ? sources : [...sources.slice(0, index), ...sources.slice(index + 1)]
  }
  const remainingInstagramPosts = withoutCoverSource(catalogue.instagramPosts)
  const remainingCatalogueFiles = withoutCoverSource(catalogue.catalogueFileUrls)
  const remainingCatalogueLinks = withoutCoverSource(catalogue.catalogueLinks)
  const pickupCalendarEntries = catalogue.catalogueType === 'pickup_only' ? parsePickupCutoffDates(catalogue.orderCutoff).map((cutoff, index) => ({
    sourceKey: 'pickup-cutoff:' + event.slug + ':' + catalogue.id + ':' + index + ':' + cutoff.date,
    category: 'pickup_cutoff' as const,
    title: catalogue.artistName + ' · Booth ' + catalogue.booth + ' · ' + event.name,
    detail: cutoff.note ? 'Order cutoff (' + cutoff.note + ')' : 'Order cutoff',
    date: cutoff.date,
  })) : []
  const eventNameWithoutRepeatedYear = event.name.replace(new RegExp(`\\s*\\b${event.year}\\b\\s*`, 'g'), ' ').replace(/\s+/g, ' ').trim()

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <CatalogueViewTracker catalogueKey={`${event.slug}:${catalogue.id}`} />
      <Link href={`/events/${event.slug}`} scroll={false} className="inline-flex items-center gap-2 font-semibold hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to {event.name} catalogues
      </Link>
      <header className="mt-8 flex flex-wrap items-start justify-between gap-5 border-b border-border pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{eventNameWithoutRepeatedYear} · {event.year}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{catalogue.artistName}</h1>
          <ArtistSocialLinks name={catalogue.artistName} instagrams={catalogue.artistInstagrams} links={catalogue.artistSocialLinks} className="mt-3 flex flex-wrap gap-x-4 gap-y-2" linkClassName="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary" />
        </div>
        <div className="flex flex-col items-start gap-2">
          <span className="rounded-md bg-foreground px-3 py-1.5 text-sm font-bold text-background">Booth {catalogue.booth}</span>
          <span className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-extrabold shadow-sm ${catalogue.stampRally ? 'border-emerald-800 bg-emerald-700 text-white' : 'border-border bg-muted text-foreground'}`}>
            <span aria-hidden="true">{catalogue.stampRally ? '✦' : '♡'}</span>
            Stamp Rally · {catalogue.stampRally ? 'Yes' : 'No'}
          </span>
        </div>
      </header>
      <CatalogueBookmarkPanel catalogueKey={`${event.slug}:${catalogue.id}`} itemName={`${catalogue.artistName} · Booth ${catalogue.booth}`} />
      {catalogue.stampRally && catalogue.stampRallyNote?.trim() && (
        <p className="mt-4 whitespace-pre-line break-words rounded-xl border border-emerald-800/25 bg-emerald-50 px-4 py-3 text-sm leading-relaxed text-emerald-950">
          <span className="font-bold">Stamp Rally: </span>{catalogue.stampRallyNote}
        </p>
      )}
      {catalogue.catalogueType === 'pickup_only' && (catalogue.orderCutoff?.trim() || catalogue.pickupNote?.trim()) && (
        <div className="mt-6 rounded-xl border border-primary/30 bg-accent/60 p-4 text-sm leading-relaxed text-foreground">
          {catalogue.orderCutoff?.trim() && <p className="flex items-center justify-between gap-2"><span className="min-w-0 flex-1"><span className="font-bold">Order cutoff: </span>{catalogue.orderCutoff}</span>{pickupCalendarEntries.length > 0 && <CalendarReminderButton entries={pickupCalendarEntries} iconOnly />}</p>}
          {catalogue.pickupNote?.trim() && <p><span className="font-bold">Pick-up note: </span>{catalogue.pickupNote}</p>}
        </div>
      )}
      <div className="mt-6 flex flex-col gap-4">
        <div>
          <h2 className="text-sm font-bold">Fandom:</h2>
          <ul className="mt-2 flex flex-wrap gap-2">{catalogue.fandoms.map((tag) => <li key={tag} className="rounded-full bg-secondary px-3 py-1 text-sm font-medium">{displayTag(tag)}</li>)}</ul>
        </div>
        <div>
          <h2 className="text-sm font-bold">Merch:</h2>
          <ul className="mt-2 flex flex-wrap gap-2">{catalogue.merchTypes.map((tag) => <li key={tag} className="rounded-full border border-border px-3 py-1 text-sm text-muted-foreground">{displayTag(tag)}</li>)}</ul>
        </div>
      </div>
      <p className="mt-5 rounded-lg border border-primary/30 bg-accent/60 p-4 text-sm font-medium leading-relaxed">
  {artistSocialAccounts.length > 0 ? (
    <>
      Please check out {catalogue.artistName}&apos;s social media accounts:{' '}
      {artistSocialAccounts.map((account, index) => (
        <span key={account.href}>
          {index > 0 ? ', ' : ''}
          <a
            href={account.href}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold underline underline-offset-2"
          >
            {account.label} ({account.platform})
          </a>
        </span>
      ))}
      . Support them by following, liking, or resharing their work.
    </>
  ) : (
    <>
      Please look up {catalogue.artistName}&apos;s social accounts and support
      them by following, liking, or resharing their work.
    </>
  )}
</p>
      <section aria-labelledby="catalogue-cover-heading" className="mt-8">
        <h2 id="catalogue-cover-heading" className="mb-4 text-2xl font-extrabold">Catalogue cover</h2>
        <div className="mx-auto max-w-2xl">
          <CatalogueCover entry={catalogue} />
        </div>
      </section>
      <section aria-labelledby="catalogue-posts-heading" className="mt-8">
        <h2 id="catalogue-posts-heading" className="mb-5 text-2xl font-extrabold">Catalogue material</h2>
        {remainingInstagramPosts.length > 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            {remainingInstagramPosts.slice(0, 10).map((postUrl, index) => (
              <InstagramPostEmbed key={postUrl} postUrl={postUrl} title={`${catalogue.artistName} catalogue post ${index + 1}`} />
            ))}
          </div>
        ) : null}
        {remainingCatalogueFiles.length > 0 && (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {remainingCatalogueFiles.map((fileUrl, index) => {
              const isImage = /\.(avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(fileUrl)
              const isPdf = /\.pdf(?:$|[?#])/i.test(fileUrl)
              return (
                <div key={fileUrl} className="overflow-hidden rounded-xl border border-border bg-card">
                  {isImage ? (
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" aria-label={`Open catalogue image ${index + 1} full size`}>
                      <Image src={fileUrl} alt={`${catalogue.artistName} catalogue ${index + 1}`} width={1200} height={1600} unoptimized className="h-auto max-h-[85vh] w-full object-contain" />
                    </a>
                  ) : isPdf ? (
                    <iframe src={fileUrl} title={`${catalogue.artistName} catalogue PDF ${index + 1}`} className="h-[80vh] w-full" />
                  ) : supportsSocialPostEmbed(fileUrl) ? (
                    <SocialPostEmbed postUrl={fileUrl} title={`${catalogue.artistName} catalogue file ${index + 1}`} />
                  ) : null}
                  <div className="border-t border-border p-3 text-right">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary underline underline-offset-4">Open catalogue file {index + 1}</a>
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {remainingCatalogueLinks.length > 0 && (
          <div className="mx-auto mt-6 flex max-w-3xl flex-col gap-5">
            <h3 className="font-bold">Catalogue links</h3>
            <ul className="flex flex-col gap-5">
              {remainingCatalogueLinks.map((link, index) => {
                const url = externalLink(link)
                return url ? (
                  <li key={link} className="min-w-0">
                    {supportsSocialPostEmbed(url.href) ? <SocialPostEmbed postUrl={url.href} title={`${catalogue.artistName} catalogue link ${index + 1}`} /> : (
                      <a href={url.href} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-border bg-background px-4 py-2 text-sm font-semibold text-primary underline underline-offset-2 hover:bg-accent">
                        Open catalogue link {index + 1} · {url.hostname.replace(/^www\./, '')} ↗
                      </a>
                    )}
                  </li>
                ) : null
              })}
            </ul>
          </div>
        )}
        {remainingInstagramPosts.length === 0 && remainingCatalogueFiles.length === 0 && remainingCatalogueLinks.length === 0 && (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center font-semibold text-muted-foreground">Catalogue unavailable for now. Please check back later.</p>
        )}
      </section>
    </div>
  )
}
