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
  rectangularBooth(1, 179, 184, 32, 63),
  rectangularBooth(5, 212, 184, 31, 63),
  rectangularBooth(2, 179, 259, 32, 32),
  rectangularBooth(6, 212, 259, 31, 32),
  rectangularBooth(3, 179, 294, 32, 30),
  rectangularBooth(7, 212, 294, 31, 30),
  rectangularBooth(4, 179, 334, 32, 41),
  rectangularBooth(8, 212, 334, 31, 41),
  rectangularBooth(9, 279, 642, 31, 64),
  rectangularBooth(10, 279, 730, 31, 32),
  rectangularBooth(11, 279, 808, 31, 31),
  { booth: 'R12', points: '366,901 398,897 401,929 369,933' },
  { booth: 'R13', points: '401,897 433,893 436,925 404,929' },
  { booth: 'R14', points: '442,891 505,884 509,914 446,921' },
  { booth: 'R15', points: '518,884 582,878 586,908 522,914' },
  { booth: 'R16', points: '592,875 658,869 662,899 596,905' },
  { booth: 'R17', points: '366,1053 398,1047 402,1077 371,1083' },
  { booth: 'R18', points: '401,1047 433,1041 437,1072 405,1078' },
  { booth: 'R19', points: '439,1041 471,1036 475,1067 444,1073' },
  { booth: 'R20', points: '477,1032 544,1024 548,1055 481,1063' },
  { booth: 'R21', points: '551,1025 617,1017 622,1048 556,1056' },
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
