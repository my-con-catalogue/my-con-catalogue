import type { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { InstagramIcon } from '@/components/social-icons'
import { getEventBySlug, getEventCatalogueById } from '@/lib/queries'
import { instagramUrl } from '@/lib/format'
import { InstagramPostEmbed } from '@/components/instagram-post-embed'

function displayTag(tag: string) {
  return tag.toLocaleLowerCase().replace(/\b\p{L}/gu, (letter) => letter.toLocaleUpperCase())
}

export const revalidate = 300

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

  return (
    <div className="mx-auto max-w-5xl px-4 py-10 md:py-14">
      <Link href={`/events/${event.slug}`} className="inline-flex items-center gap-2 font-semibold hover:text-primary">
        <ArrowLeft className="size-4" aria-hidden="true" /> Back to {event.name} catalogues
      </Link>
      <header className="mt-8 flex flex-wrap items-start justify-between gap-5 border-b border-border pb-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-primary">{event.name} · {event.year}</p>
          <h1 className="mt-2 text-3xl font-extrabold tracking-tight md:text-4xl">{catalogue.artistName}</h1>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-2">
            {catalogue.artistInstagrams.map((handle) => (
              <a key={handle} href={instagramUrl(handle)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground hover:text-primary">
                <InstagramIcon className="size-4" aria-hidden="true" />@{handle.replace(/^@/, '')}
              </a>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-start gap-2">
          <span className="rounded-md bg-foreground px-3 py-1.5 text-sm font-bold text-background">Booth {catalogue.booth}</span>
          <span className={`inline-flex items-center gap-2 rounded-xl border-2 px-4 py-2 text-sm font-extrabold shadow-sm ${catalogue.stampRally ? 'border-emerald-800 bg-emerald-700 text-white' : 'border-border bg-muted text-foreground'}`}>
            <span aria-hidden="true">{catalogue.stampRally ? '✦' : '♡'}</span>
            Stamp Rally · {catalogue.stampRally ? 'Yes' : 'No'}
          </span>
        </div>
      </header>
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
        {catalogue.artistInstagrams.length > 0 ? (
          <>Please check out {catalogue.artistName}&apos;s account{catalogue.artistInstagrams.length === 1 ? '' : 's'}: {catalogue.artistInstagrams.map((handle, index) => <span key={handle}>{index > 0 ? ', ' : ''}<a href={instagramUrl(handle)} target="_blank" rel="noopener noreferrer" className="font-bold underline underline-offset-2">@{handle.replace(/^@/, '')}</a></span>)}. Support them by following, liking, or resharing their work.</>
        ) : (
          <>Please look up {catalogue.artistName}&apos;s social accounts and support them by following, liking, or resharing their work.</>
        )}
      </p>
      <section aria-labelledby="catalogue-posts-heading" className="mt-8">
        <h2 id="catalogue-posts-heading" className="mb-5 text-2xl font-extrabold">{catalogue.instagramPosts.length > 0 ? 'Catalogue posts on Instagram' : 'Catalogue files'}</h2>
        {catalogue.instagramPosts.length > 0 ? (
          <div className="mx-auto flex max-w-2xl flex-col gap-8">
            {catalogue.instagramPosts.slice(0, 3).map((postUrl, index) => (
              <InstagramPostEmbed key={postUrl} postUrl={postUrl} title={`${catalogue.artistName} catalogue post ${index + 1}`} />
            ))}
          </div>
        ) : catalogue.catalogueFileUrls.length > 0 ? (
          <div className="mx-auto flex max-w-3xl flex-col gap-6">
            {catalogue.catalogueFileUrls.map((fileUrl, index) => {
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
                  ) : null}
                  <div className="border-t border-border p-3 text-right">
                    <a href={fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm font-semibold text-primary underline underline-offset-4">Open catalogue file {index + 1}</a>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">The artist&apos;s Instagram catalogue posts haven&apos;t been added yet.</p>
        )}
      </section>
    </div>
  )
}
