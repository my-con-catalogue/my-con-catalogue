'use client'

import Link from 'next/link'
import { useState } from 'react'
import { Search } from 'lucide-react'
import { InstagramIcon } from '@/components/social-icons'
import { instagramUrl } from '@/lib/format'
import type { ArtistWithAppearances } from '@/lib/queries'

function letterFor(name: string) {
  const first = name.trim().charAt(0).toUpperCase()
  return /[A-Z]/.test(first) ? first : '#'
}

export function ArtistDirectory({ artists }: { artists: ArtistWithAppearances[] }) {
  const [query, setQuery] = useState('')
  const q = query.trim().toLowerCase()
  const filtered = q ? artists.filter((a) => a.name.toLowerCase().includes(q)) : artists

  const groups = new Map<string, ArtistWithAppearances[]>()
  for (const artist of filtered) {
    const letter = letterFor(artist.name)
    groups.set(letter, [...(groups.get(letter) ?? []), artist])
  }
  const letters = [...groups.keys()].sort((a, b) => (a === '#' ? 1 : b === '#' ? -1 : a.localeCompare(b)))

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="relative md:w-80">
          <label htmlFor="artist-search" className="sr-only">
            Search artists
          </label>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            id="artist-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search artists..."
            className="h-11 w-full rounded-lg border border-input bg-card pl-10 pr-3 outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <nav aria-label="Jump to letter">
          <ul className="flex flex-wrap gap-1">
            {letters.map((l) => (
              <li key={l}>
                <a
                  href={`#letter-${l}`}
                  className="flex size-8 items-center justify-center rounded-md border border-border bg-card text-sm font-bold hover:border-foreground hover:bg-foreground hover:text-background"
                >
                  {l}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>

      {letters.length === 0 && <p className="text-muted-foreground">No artists found.</p>}

      {letters.map((letter) => (
        <section key={letter} id={`letter-${letter}`} aria-labelledby={`letter-heading-${letter}`} className="scroll-mt-24">
          <h2
            id={`letter-heading-${letter}`}
            className="flex size-12 items-center justify-center rounded-lg bg-primary text-2xl font-extrabold text-primary-foreground"
          >
            {letter}
          </h2>
          <ul className="mt-4 grid gap-4 md:grid-cols-2">
            {groups.get(letter)!.map((artist) => {
              const appearances = [...artist.appearances].sort((a, b) => b.year - a.year || a.name.localeCompare(b.name))
              return (
                <li key={artist.id} className="rounded-xl border border-border bg-card p-5">
                  <h3 className="text-xl font-bold">{artist.name}</h3>
                  {artist.artistInstagrams.length > 0 && (
                    <ul aria-label={`${artist.name} Instagram accounts`} className="mt-2 flex flex-wrap gap-2">
                      {artist.artistInstagrams.map((handle) => (
                        <li key={handle}>
                          <a
                            href={instagramUrl(handle)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-secondary/60 px-3 py-1 text-sm text-muted-foreground transition-colors hover:border-foreground hover:text-primary"
                          >
                            <InstagramIcon className="size-4" />@{handle}
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  {artist.bio && <p className="mt-1 text-sm text-muted-foreground">{artist.bio}</p>}
                  <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Appearances ({appearances.length})
                  </p>
                  {appearances.length === 0 ? (
                    <p className="mt-2 text-sm text-muted-foreground">No appearances archived yet.</p>
                  ) : (
                    <ul className="mt-2 flex flex-wrap gap-2">
                      {appearances.map((event) => (
                        <li key={event.slug}>
                          <Link
                            href={`/events/${event.slug}`}
                            className="inline-flex rounded-full bg-secondary px-3 py-1 text-sm font-medium transition-colors hover:bg-foreground hover:text-background"
                          >
                            <span className="mr-1.5 font-bold">{event.year}</span>{event.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        </section>
      ))}
    </div>
  )
}
