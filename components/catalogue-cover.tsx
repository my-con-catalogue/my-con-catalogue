import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'
import { SocialPostEmbed, supportsSocialPostEmbed } from '@/components/social-post-embed'

function safeUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export function CatalogueCover({ entry }: { entry: CatalogueEntry }) {
  const sources = [...entry.instagramPosts, ...entry.catalogueFileUrls, ...entry.catalogueLinks]
  const source = sources.map((value) => ({ value, href: safeUrl(value) })).find((item) => item.href) ?? null
  const image = source && /\.(avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(source.href!)
  const pdf = source && /\.pdf(?:$|[?#])/i.test(source.href!)

  return <section aria-label={`${entry.artistName} catalogue cover`} className="overflow-hidden rounded-xl border border-border bg-card">
    {image ? <div className="relative aspect-[4/5] w-full bg-muted">
      <Image src={source!.href!} alt={`${entry.artistName} catalogue cover`} fill unoptimized className="object-contain" />
    </div> : source && supportsSocialPostEmbed(source.value) ? <SocialPostEmbed postUrl={source.value} title={`${entry.artistName} catalogue cover preview`} compact />
      : pdf ? <iframe src={source!.href!} title={`${entry.artistName} catalogue cover preview`} className="h-[min(540px,70vh)] w-full bg-white" />
        : <div className="flex aspect-[4/5] w-full items-center justify-center bg-muted px-5 text-center text-sm text-muted-foreground">Catalogue preview not available</div>}
  </section>
}
