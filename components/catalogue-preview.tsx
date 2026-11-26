'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { CatalogueEntry } from '@/lib/queries'
import { SocialPostEmbed } from '@/components/social-post-embed'

const DESKTOP_HOVER_QUERY = '(hover: hover) and (pointer: fine)'

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

export function CataloguePreview({ entry, hasCatalogueMaterial, onNavigate }: { entry: CatalogueEntry; hasCatalogueMaterial: boolean; onNavigate?: () => void }) {
  const [active, setActive] = useState(false)
  const [desktopHover, setDesktopHover] = useState(false)
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    const media = window.matchMedia(DESKTOP_HOVER_QUERY)
    const update = () => {
      setDesktopHover(media.matches)
      if (!media.matches) {
        if (hoverTimer.current) clearTimeout(hoverTimer.current)
        hoverTimer.current = null
        setActive(false)
      }
    }
    update()
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [])
  useEffect(() => () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
  }, [])

  const schedulePreview = () => {
    if (!desktopHover) return
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = setTimeout(() => {
      setActive(true)
      hoverTimer.current = null
    }, 2000)
  }
  const cancelPreview = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current)
    hoverTimer.current = null
    setActive(false)
  }
  const firstFile = entry.catalogueFileUrls.map(safeExternalUrl).find((url) => url !== null) ?? null
  const firstFileIsImage = firstFile ? /\.(avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(firstFile.pathname + firstFile.search) : false
  const firstFileIsPdf = firstFile ? /\.pdf(?:$|[?#])/i.test(firstFile.pathname + firstFile.search) : false

  return (
    <div
      className={`group/catalogue-preview relative z-0 ${desktopHover ? 'hover:z-20 focus-within:z-20' : ''}`}
      onMouseEnter={schedulePreview}
      onMouseLeave={cancelPreview}
      onFocusCapture={() => {
        if (desktopHover) {
          if (hoverTimer.current) clearTimeout(hoverTimer.current)
          hoverTimer.current = null
          setActive(true)
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) cancelPreview()
      }}
    >
      <Link href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} onClick={onNavigate} className="flex h-full items-center justify-center gap-1 border-b border-border bg-muted px-4 py-3 text-center text-base font-semibold tracking-wide text-primary transition-colors hover:bg-muted/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" aria-label={`View ${entry.artistName}'s full catalogue${desktopHover ? '; hover or focus for a preview' : ''}`}>
        › View full catalogue here ‹
      </Link>
      {active && <div className="absolute left-1/2 top-full z-50 w-[min(88vw,34rem)] -translate-x-1/2">
        <section aria-label={`${entry.artistName} catalogue preview`} className="max-h-[70vh] overflow-y-auto rounded-xl border border-border bg-card p-4 text-left shadow-2xl sm:p-5">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div>
              <h4 className="font-bold">{entry.artistName}</h4>
              <p className="text-xs text-muted-foreground">Booth {entry.booth} · catalogue preview</p>
            </div>
            <span className="shrink-0 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">Click link to open</span>
          </div>
          {!hasCatalogueMaterial ? (
            <p className="rounded-lg border border-dashed border-border p-5 text-center text-sm text-muted-foreground">Catalogue unavailable for now.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {entry.instagramPosts[0] && <SocialPostEmbed postUrl={entry.instagramPosts[0]} title={`${entry.artistName} catalogue preview`} />}
              {!entry.instagramPosts[0] && firstFile && (firstFileIsImage ? (
                <a href={firstFile.href} target="_blank" rel="noopener noreferrer" aria-label={`Open ${entry.artistName}'s catalogue image`}>
                  <Image src={firstFile.href} alt={`${entry.artistName} catalogue preview`} width={1000} height={1200} unoptimized className="mx-auto max-h-[55vh] w-auto rounded-lg object-contain" />
                </a>
              ) : firstFileIsPdf ? (
                <iframe src={firstFile.href} title={`${entry.artistName} catalogue PDF preview`} className="h-[55vh] w-full rounded-lg border border-border" />
              ) : (
                <a href={firstFile.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border p-4 text-sm font-semibold text-primary underline">Open catalogue file ↗</a>
              ))}
              {entry.catalogueLinks.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {entry.catalogueLinks.map((link, index) => {
                    const url = safeExternalUrl(link)
                    return url ? <li key={link}><a href={url.href} target="_blank" rel="noopener noreferrer" className="inline-flex rounded-full border border-border px-3 py-1.5 text-xs font-semibold text-primary underline">Catalogue link {index + 1} ↗</a></li> : null
                  })}
                </ul>
              )}
              {(entry.instagramPosts.length + entry.catalogueFileUrls.length) > 1 && <p className="text-xs text-muted-foreground">Hover preview shows the first item. Open the full page to browse all catalogue material.</p>}
            </div>
          )}
          <p className="mt-3 text-center text-xs text-muted-foreground">Please support the artist by following, liking, or resharing.</p>
        </section>
      </div>}
    </div>
  )
}
