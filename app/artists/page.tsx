import type { Metadata } from 'next'
import { ArtistDirectory } from '@/components/artist-directory'
import { PageHeader } from '@/components/page-header'
import { getArtistsWithAppearances } from '@/lib/queries'

export const revalidate = 300

export const metadata: Metadata = {
  title: 'Artists',
  description: 'Alphabetical directory of artist alley artists and the Malaysian conventions they have appeared at.',
}

export default async function ArtistsPage() {
  const artists = await getArtistsWithAppearances()

  return (
    <>
      <PageHeader
        eyebrow="Artists"
        title="Artist directory"
        description="Every artist in the archive, A–Z, with the years and events they've tabled at."
      />
      <div className="mx-auto max-w-6xl px-4 py-12">
        <p className="mb-6 rounded-lg border border-primary/30 bg-accent/60 p-4 text-sm font-medium leading-relaxed">
          Found an artist you like? Visit their linked account and support their work by following, liking, or resharing.
        </p>
        <ArtistDirectory artists={artists} />
      </div>
    </>
  )
}
