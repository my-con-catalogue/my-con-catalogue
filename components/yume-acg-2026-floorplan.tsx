import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'

type BoothSpot = { booth: string; x: number; y: number; width: number; height: number }

const boothRows = [
  { first: 22, count: 7, y: 21 },
  { first: 15, count: 7, y: 94 },
  { first: 8, count: 7, y: 260 },
  { first: 1, count: 7, y: 334 },
]
const boothXs = [153, 217, 282, 350, 420, 485, 565]
const booths: BoothSpot[] = boothRows.flatMap(({ first, count, y }) =>
  Array.from({ length: count }, (_, index) => {
    const number = first + index
    return {
      booth: `A${String(number).padStart(2, '0')}`,
      x: boothXs[index],
      y,
      width: 56,
      height: 41,
    }
  }),
)

function boothCodes(value: string) {
  return [...value.matchAll(/\bA\s*[-–—]?\s*0*(\d{1,2})/gi)]
    .map((match) => `A${String(Number(match[1])).padStart(2, '0')}`)
}

function findCatalogue(booth: string, entries: readonly CatalogueEntry[]) {
  const exact = entries.find((entry) => boothCodes(entry.booth).length === 1 && boothCodes(entry.booth)[0] === booth)
  if (exact) return exact
  const matches = entries.filter((entry) => boothCodes(entry.booth).includes(booth))
  return matches.length === 1 ? matches[0] : undefined
}

export function YumeAcg2026Floorplan({ entries }: { entries: readonly CatalogueEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="relative aspect-[927/451] w-full">
        <Image
          src="/events/yume-acg-2026-floorplan.png"
          alt="Yume ACG Fest 2026 floor plan with Artist Alley booths A01 to A28"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-fill"
        />
        <svg viewBox="0 0 927 451" preserveAspectRatio="none" className="absolute inset-0 size-full" role="group" aria-label="Yume ACG Fest 2026 booth map">
          {booths.map((spot) => {
            const entry = findCatalogue(spot.booth, entries)
            const rect = { x: spot.x, y: spot.y, width: spot.width, height: spot.height }
            return entry ? (
              <a key={spot.booth} href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} aria-label={`${spot.booth}: ${entry.artistName}, open catalogue`}>
                <title>{`${spot.booth} · ${entry.artistName} — open catalogue`}</title>
                <rect {...rect} rx="2" className="fill-amber-300/20 stroke-amber-100 transition-colors hover:fill-amber-200/55 focus:fill-amber-200/55" strokeWidth="2.5" />
              </a>
            ) : (
              <g key={spot.booth} aria-label={`${spot.booth}: catalogue not listed yet`}>
                <title>{`${spot.booth} · no catalogue listed yet`}</title>
                <rect {...rect} fill="transparent" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="border-t border-border px-4 py-3 text-sm text-muted-foreground">
        Blue A01–A28 Artist Alley booths become clickable when a catalogue is listed. A05 and A06 both open a combined A05–A06 catalogue.
      </div>
    </div>
  )
}
