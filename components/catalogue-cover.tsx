'use client'

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

export function CatalogueCover({ entry, compact = false }: { entry: CatalogueEntry; compact?: boolean }) {
  const sources = [...entry.instagramPosts, ...entry.catalogueFileUrls, ...entry.catalogueLinks]
  const source = sources.map((value) => ({ value, href: safeUrl(value) })).find((item) => item.href) ?? null
  const image = source && /\.(avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(source.href!)
  const pdf = source && /\.pdf(?:$|[?#])/i.test(source.href!)

  const frame = compact ? 'aspect-[4/3]' : 'aspect-[4/5]'
  return <section aria-label={`${entry.artistName} catalogue cover`} className="overflow-hidden bg-card">
    {image ? <div className={`relative ${frame} w-full bg-muted`}>
      <Image src={source!.href!} alt={`${entry.artistName} catalogue cover`} fill unoptimized className="object-contain" />
    </div> : source && supportsSocialPostEmbed(source.value) ? compact
      ? <div className={`relative ${frame} w-full overflow-hidden`}><SocialPostEmbed postUrl={source.value} title={`${entry.artistName} catalogue cover preview`} compact /></div>
      : <SocialPostEmbed postUrl={source.value} title={`${entry.artistName} catalogue cover preview`} />
      : pdf ? <div className={`relative ${frame} w-full`}><iframe src={source!.href!} title={`${entry.artistName} catalogue cover preview`} className="absolute inset-0 size-full bg-white" /></div>
        : <div className={`flex ${frame} w-full items-center justify-center bg-muted px-5 text-center text-sm text-muted-foreground`}>Preview not available</div>}
  </section>
}
