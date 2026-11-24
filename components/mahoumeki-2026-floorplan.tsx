import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'

type BoothSpot = { booth: number; x: number; y: number; width: number; height: number }

// Coordinates are traced to the booth tiles in the 946 × 579 source image.
const spots: BoothSpot[] = [
  { booth: 1, x: 168, y: 427, width: 67, height: 36 },
  { booth: 2, x: 244, y: 427, width: 67, height: 36 },
  { booth: 3, x: 319, y: 427, width: 68, height: 36 },
  { booth: 4, x: 471, y: 427, width: 67, height: 36 },
  { booth: 5, x: 547, y: 427, width: 67, height: 36 },
  { booth: 6, x: 168, y: 473, width: 67, height: 36 },
  { booth: 7, x: 244, y: 473, width: 67, height: 36 },
  { booth: 8, x: 319, y: 473, width: 68, height: 36 },
  { booth: 9, x: 395, y: 473, width: 67, height: 36 },
  { booth: 10, x: 471, y: 473, width: 67, height: 36 },
  { booth: 11, x: 168, y: 518, width: 67, height: 37 },
  { booth: 12, x: 244, y: 518, width: 67, height: 37 },
  { booth: 13, x: 319, y: 518, width: 68, height: 37 },
  { booth: 14, x: 395, y: 518, width: 67, height: 37 },
  { booth: 15, x: 471, y: 518, width: 67, height: 37 },
]

// Student, sponsor, and gaming booths remain visible but cannot link to artist catalogues.
const nonCatalogueSpots: BoothSpot[] = [
  { booth: 16, x: 547, y: 518, width: 67, height: 37 },
  { booth: 17, x: 622, y: 518, width: 68, height: 37 },
  { booth: 18, x: 697, y: 518, width: 68, height: 37 },
  { booth: 19, x: 697, y: 427, width: 68, height: 36 },
  { booth: 20, x: 697, y: 473, width: 68, height: 36 },
]

const boothNames: Record<number, string> = {
  1: 'Aki x Nyx',
  2: 'Aliscen x Junkoyee',
  3: 'AsaNatsu',
  4: 'eo.jz.art',
  5: 'HungrySheep & RainingCherry',
  6: 'Meowl',
  7: 'Mika',
  8: 'Miezerks',
  9: 'Mynne',
  10: 'Schewaltz & Shoeshi',
  11: 'Silentclarity & Kuuqiu',
  12: 'Tatao',
  13: 'Penang TriTrou Edition',
  14: 'Usagi Canvas',
  15: 'wewwha',
  16: 'Peninsula College Student Council · student council',
  17: 'Ài KLINIK · sponsor',
  18: 'SuperDNA · sponsor',
  19: 'Komodo Range Studio · gaming studio',
  20: 'Komodo Range Studio · gaming studio',
}

function numbersInBooth(value: string): number[] {
  return [...value.matchAll(/\d+/g)].map((match) => Number(match[0]))
}

function findCatalogue(booth: number, entries: readonly CatalogueEntry[]) {
  const exact = entries.find((entry) => {
    const numbers = numbersInBooth(entry.booth)
    return numbers.length === 1 && numbers[0] === booth
  })
  if (exact) return exact
  const combinedMatches = entries.filter((entry) => numbersInBooth(entry.booth).includes(booth))
  return combinedMatches.length === 1 ? combinedMatches[0] : undefined
}

export function Mahoumeki2026Floorplan({ entries }: { entries: readonly CatalogueEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="relative aspect-[946/579] w-full">
        <Image
          src="/events/mahoumeki-2026-floorplan.jpg"
          alt="Mahoumeki 2026 floor plan showing the Mahou-no-Ichiba Artist Alley booths 01 to 20"
          fill
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-fill"
        />
        <svg viewBox="0 0 946 579" preserveAspectRatio="none" className="absolute inset-0 size-full" role="group" aria-label="Mahoumeki 2026 interactive Artist Alley booth map">
          {spots.map((spot) => {
            const code = String(spot.booth).padStart(2, '0')
            const entry = findCatalogue(spot.booth, entries)
            const label = boothNames[spot.booth]
            const rect = { x: spot.x, y: spot.y, width: spot.width, height: spot.height }
            return entry ? (
              <a key={code} href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} aria-label={`${code}: ${entry.artistName}, open catalogue`}>
                <title>{`${code} · ${entry.artistName} — open catalogue`}</title>
                <rect {...rect} rx="4" className="fill-amber-300/20 stroke-amber-100 transition-colors hover:fill-amber-200/55 focus:fill-amber-200/55" strokeWidth="2.5" />
              </a>
            ) : (
              <g key={code} aria-label={`${code}: ${label}, catalogue not listed yet`}>
                <title>{`${code} · ${label} — no catalogue listed yet`}</title>
                <rect {...rect} rx="4" fill="transparent" />
              </g>
            )
          })}
          {nonCatalogueSpots.map((spot) => (
            <g key={spot.booth} aria-label={`Booth ${spot.booth}: ${boothNames[spot.booth]}, not an Artist Alley catalogue booth`}>
              <title>{`Booth ${spot.booth} · ${boothNames[spot.booth]}`}</title>
              <rect x={spot.x} y={spot.y} width={spot.width} height={spot.height} rx="4" fill="#6b7280" fillOpacity="0.78" stroke="#e5e7eb" strokeWidth="2" />
            </g>
          ))}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border-2 border-amber-200 bg-amber-300/30" aria-hidden="true" /> Catalogue listed — click the booth</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border border-indigo-900 bg-indigo-900" aria-hidden="true" /> Artist Alley booth — catalogue not listed yet</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-gray-500" aria-hidden="true" /> Non-catalogue booth</span>
      </div>
    </div>
  )
}
