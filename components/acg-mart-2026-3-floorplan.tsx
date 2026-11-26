import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'

type BoothSpot = { booth: string; points: string }

const rectangularBooth = (booth: number, x: number, y: number, width: number, height: number): BoothSpot => ({
  booth: `R${String(booth).padStart(2, '0')}`,
  points: `${x},${y} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}`,
})

// Coordinates trace the booth tiles in the supplied 1188 × 1124 floor plan.
// Individual polygons keep R12–R21 aligned with their angled printed tiles.
const boothSpots: BoothSpot[] = [
  rectangularBooth(1, 180, 183, 31, 63),
  rectangularBooth(5, 212, 183, 31, 63),
  rectangularBooth(2, 180, 259, 31, 31),
  rectangularBooth(6, 212, 259, 31, 31),
  rectangularBooth(3, 180, 291, 31, 31),
  rectangularBooth(7, 212, 291, 31, 31),
  rectangularBooth(4, 180, 333, 31, 64),
  rectangularBooth(8, 212, 333, 31, 64),
  rectangularBooth(9, 279, 642, 31, 63),
  rectangularBooth(10, 279, 730, 31, 31),
  rectangularBooth(11, 279, 807, 31, 31),
  { booth: 'R12', points: '365,904 397,900 400,930 368,934' },
  { booth: 'R13', points: '398,899 430,896 433,927 401,930' },
  { booth: 'R14', points: '443,896 506,889 509,920 446,926' },
  { booth: 'R15', points: '518,890 582,883 585,914 521,920' },
  { booth: 'R16', points: '594,882 657,876 660,907 597,913' },
  { booth: 'R17', points: '365,1059 394,1053 399,1083 370,1089' },
  { booth: 'R18', points: '398,1054 429,1048 433,1078 402,1084' },
  { booth: 'R19', points: '431,1049 462,1043 466,1073 435,1079' },
  { booth: 'R20', points: '477,1039 539,1032 544,1063 482,1070' },
  { booth: 'R21', points: '552,1031 613,1024 618,1055 556,1062' },
]

const boothNames: Record<string, string> = {
  R01: 'Toba Toys',
  R02: 'Kurry Katsu',
  R03: 'Retro Comics Store',
  R04: 'Sakurasold',
  R05: 'aniplush',
  R06: 'peichee.crochet',
  R07: 'Apricot Caramels',
  R08: 'Ghost Owl House',
  R09: 'A&C HOBBY',
  R10: 'Lunariste',
  R11: 'Nocturnal Fwends',
  R12: 'Style Charming Handmade',
  R13: 'Mimikioarts',
  R14: 'Akari',
  R15: 'JY ANIME',
  R16: 'Gachaponpon',
  R17: 'Poulife',
  R18: 'Basakila',
  R19: 'Sunny Meido Cafe',
  R20: 'Mocha Sky Kid',
  R21: 'Mi Toys',
}

function boothCodes(value: string) {
  return [...value.matchAll(/\bR\s*[-–—]?\s*0*(\d{1,2})(?!\d)/gi)]
    .map((match) => `R${String(Number(match[1])).padStart(2, '0')}`)
}

function findCatalogue(booth: string, entries: readonly CatalogueEntry[]) {
  const matchingRows = entries.flatMap((entry) => {
    const codes = boothCodes(entry.booth)
    return codes.includes(booth) ? [{ entry, codeCount: codes.length }] : []
  })
  const exact = matchingRows.find((row) => row.codeCount === 1)
  if (exact) return exact.entry
  return matchingRows.length === 1 ? matchingRows[0].entry : undefined
}

export function AcgMart2026Floorplan({ entries }: { entries: readonly CatalogueEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-white shadow-sm">
      <div className="relative aspect-[1188/1124] w-full">
        <Image
          src="/events/acg-mart-2026-3-floorplan.png"
          alt="ACG Mart 2026 / 3.0 Level 2 ACG Base floor plan showing booths R01 to R21 and their listed vendors"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-fill"
        />
        <svg viewBox="0 0 1188 1124" preserveAspectRatio="none" className="absolute inset-0 size-full" role="group" aria-label="ACG Mart 2026 / 3.0 interactive booth map">
          {boothSpots.map((spot) => {
            const entry = findCatalogue(spot.booth, entries)
            const name = entry?.artistName ?? boothNames[spot.booth]
            return entry ? (
              <a key={spot.booth} href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} aria-label={`${spot.booth}: ${name}, open catalogue`}>
                <title>{`${spot.booth} · ${name} — open catalogue`}</title>
                <polygon points={spot.points} className="fill-amber-300/20 stroke-amber-100 transition-colors hover:fill-amber-200/55 focus:fill-amber-200/55" strokeWidth="2.5" />
              </a>
            ) : (
              <g key={spot.booth} aria-label={`${spot.booth}: ${name}, catalogue not listed yet`}>
                <title>{`${spot.booth} · ${name} — no catalogue listed yet`}</title>
                <polygon points={spot.points} fill="transparent" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border-2 border-amber-200 bg-amber-300/30" aria-hidden="true" /> Catalogue listed — click the booth</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border border-stone-700 bg-stone-700" aria-hidden="true" /> R01–R21 booth — catalogue not listed yet</span>
      </div>
    </div>
  )
}
