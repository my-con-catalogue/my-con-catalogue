'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import type { CatalogueEntry } from '@/lib/queries'
import { SocialPostEmbed } from '@/components/social-post-embed'

function safeExternalUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url : null
  } catch {
    return null
  }
}

export function CataloguePreview({ entry, hasCatalogueMaterial }: { entry: CatalogueEntry; hasCatalogueMaterial: boolean }) {
  const [open, setOpen] = useState(false)
  const dialogRef = useRef<HTMLDialogElement>(null)
  const detailHref = `/events/${entry.eventSlug}/catalogues/${entry.id}`

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center justify-center gap-2 border-b border-border bg-muted px-4 py-3 text-center text-sm font-semibold text-primary transition-colors hover:bg-accent/50"
      >
        Preview catalogue
      </button>
      <dialog
        ref={dialogRef}
        aria-labelledby={`catalogue-preview-title-${entry.id}`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialogRef.current) setOpen(false)
        }}
        className="m-auto max-h-[92dvh] w-[min(95vw,56rem)] max-w-none overflow-hidden rounded-xl border border-border bg-background p-0 text-foreground shadow-2xl backdrop:bg-black/60"
      >
        <div className="flex max-h-[92dvh] flex-col">
          <header className="flex items-start justify-between gap-4 border-b border-border bg-card px-5 py-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Catalogue preview · Booth {entry.booth}</p>
              <h2 id={`catalogue-preview-title-${entry.id}`} className="mt-1 text-xl font-extrabold">{entry.artistName}</h2>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="rounded-md border border-input px-3 py-1.5 text-sm font-semibold hover:bg-secondary">
              Close
            </button>
          </header>
          <div className="overflow-y-auto px-4 py-5 sm:px-6">
            {!hasCatalogueMaterial ? (
              <p className="rounded-lg border border-dashed border-border p-8 text-center font-semibold text-muted-foreground">Catalogue unavailable for now. Please check back later.</p>
            ) : (
              <div className="mx-auto flex max-w-2xl flex-col gap-6">
                {entry.instagramPosts.map((postUrl, index) => (
                  <SocialPostEmbed key={postUrl} postUrl={postUrl} title={`${entry.artistName} catalogue post ${index + 1}`} />
                ))}
                {entry.catalogueFileUrls.map((fileUrl, index) => {
                  const safeUrl = safeExternalUrl(fileUrl)
                  if (!safeUrl) return null
                  const isImage = /\.(avif|gif|jpe?g|png|webp)(?:$|[?#])/i.test(safeUrl.pathname + safeUrl.search)
                  const isPdf = /\.pdf(?:$|[?#])/i.test(safeUrl.pathname + safeUrl.search)
                  return (
                    <section key={fileUrl} className="overflow-hidden rounded-xl border border-border bg-card" aria-label={`Catalogue file ${index + 1}`}>
                      {isImage ? (
                        <a href={safeUrl.href} target="_blank" rel="noopener noreferrer" aria-label={`Open catalogue image ${index + 1} full size`}>
                          <Image src={safeUrl.href} alt={`${entry.artistName} catalogue ${index + 1}`} width={1200} height={1600} unoptimized className="h-auto max-h-[75vh] w-full object-contain" />
                        </a>
                      ) : isPdf ? (
                        <iframe src={safeUrl.href} title={`${entry.artistName} catalogue PDF ${index + 1}`} className="h-[70vh] w-full" />
                      ) : (
                        <a href={safeUrl.href} target="_blank" rel="noopener noreferrer" className="block p-5 font-semibold text-primary underline">Open catalogue file {index + 1} ↗</a>
                      )}
                    </section>
                  )
                })}
                {entry.catalogueLinks.map((link, index) => {
                  const safeUrl = safeExternalUrl(link)
                  if (!safeUrl) return null
                  return <a key={link} href={safeUrl.href} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border bg-card p-4 font-semibold text-primary underline underline-offset-2">Open catalogue link {index + 1} · {safeUrl.hostname.replace(/^www\./, '')} ↗</a>
                })}
              </div>
            )}
            <p className="mx-auto mt-5 max-w-2xl text-center text-xs text-muted-foreground">Support {entry.artistName} by following, liking, or resharing their work.</p>
          </div>
          <footer className="border-t border-border bg-card p-4 text-right">
            <Link href={detailHref} onClick={() => setOpen(false)} className="inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-90">
              Open full catalogue page
            </Link>
          </footer>
        </div>
      </dialog>
    </>
  )
}
