import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'

type BoothSpot = {
  booth: number
  x: number
  y: number
  width: number
  height: number
  angle?: number
}

function makeRow(numbers: number[], centers: Array<[number, number]>, angle = 0): BoothSpot[] {
  return numbers.flatMap((booth, index) => {
    const center = centers[index]
    return center ? [{ booth, x: center[0], y: center[1], width: 37, height: 35, angle }] : []
  })
}

// Coordinates follow the 875 × 733 source image. Booths on the diagonal runs
// use rotated hit areas so each clickable shape follows its printed tile.
const booths: BoothSpot[] = [
  // A01–A18, in the navigation key at the upper right.
  ...Array.from({ length: 18 }, (_, index) => {
    const column = index < 9 ? 0 : 1
    const row = index % 9
    const rowCenters = [72, 108, 159, 195, 244, 280, 329, 365, 414]
    return { booth: index + 1, x: 756 + column * 38, y: rowCenters[row], width: 37, height: 35 }
  }),
  // A19–A34, the central grid in the lower navigation panel.
  ...Array.from({ length: 16 }, (_, index) => {
    const column = Math.floor(index / 4)
    const row = index % 4
    const columnCenters = [306, 378, 415, 484]
    const rowCenters = [566, 607, 652, 690]
    return { booth: index + 19, x: columnCenters[column], y: rowCenters[row], width: 36, height: 37 }
  }),
  // Slightly slanted upper rows in the lower navigation panel.
  ...makeRow([42, 41, 40, 39, 56, 55], [[48, 513], [87, 518], [126, 523], [165, 528], [205, 532], [245, 537]], 7),
  ...makeRow([35, 36, 37, 38, 54, 57], [[533, 532], [573, 527], [614, 522], [654, 517], [695, 512], [735, 507]], -7),
  // Slanted left and right aisles.
  ...makeRow([46, 45, 44, 43], [[49, 615], [88, 636], [126, 657], [164, 678]], 25),
  ...makeRow([47, 48, 49, 50, 51, 52, 53], [[610, 669], [649, 650], [689, 631], [729, 612], [769, 593], [809, 574], [849, 555]], -25),
]

function boothNumbers(value: string): number[] {
  return [...value.matchAll(/\bA\s*[-–—]?\s*0*(\d{1,2})/gi)].map((match) => Number(match[1]))
}

function findCatalogue(booth: number, entries: readonly CatalogueEntry[]) {
  const exact = entries.find((entry) => {
    const numbers = boothNumbers(entry.booth)
    return numbers.length === 1 && numbers[0] === booth
  })
  if (exact) return exact

  // A combined range such as A23-A24 is available from either booth tile.
  const matches = entries.filter((entry) => boothNumbers(entry.booth).includes(booth))
  return matches.length === 1 ? matches[0] : undefined
}

function polygon(spot: BoothSpot) {
  const radians = ((spot.angle ?? 0) * Math.PI) / 180
  const cos = Math.cos(radians)
  const sin = Math.sin(radians)
  const halfWidth = spot.width / 2
  const halfHeight = spot.height / 2
  const corners: Array<[number, number]> = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ]
  return corners.map(([x, y]) => `${spot.x + x * cos - y * sin},${spot.y + x * sin + y * cos}`).join(' ')
}

export function AcgMatsuri2026Floorplan({ entries }: { entries: readonly CatalogueEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#d8f0f5] shadow-sm">
      <div className="relative aspect-[875/733] w-full">
        <Image
          src="/events/acg-matsuri-2026-floorplan.png"
          alt="ACG Matsuri 2026 Level 2 Artist Alley floor plan with booths A1 to A57"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-fill"
        />
        <svg viewBox="0 0 875 733" preserveAspectRatio="none" className="absolute inset-0 size-full" role="group" aria-label="ACG Matsuri 2026 interactive booth map">
          {booths.map((spot) => {
            const boothCode = `A${String(spot.booth).padStart(2, '0')}`
            const entry = findCatalogue(spot.booth, entries)
            const points = polygon(spot)

            return entry ? (
              <a key={boothCode} href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} aria-label={`${boothCode}: ${entry.artistName}, open catalogue`}>
                <title>{`${boothCode} · ${entry.artistName} — open catalogue`}</title>
                <polygon points={points} className="fill-amber-300/20 stroke-amber-100 transition-colors hover:fill-amber-200/55 focus:fill-amber-200/55" strokeWidth="2.5" />
              </a>
            ) : (
              <g key={boothCode} aria-label={`${boothCode}: catalogue not listed yet`}>
                <title>{`${boothCode} · no catalogue listed yet`}</title>
                <polygon points={points} fill="transparent" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-border px-4 py-3 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border-2 border-amber-200 bg-amber-300/30" aria-hidden="true" /> Catalogue listed — click the booth</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border border-emerald-700 bg-emerald-600" aria-hidden="true" /> Artist Alley booth — no catalogue listed yet</span>
      </div>
    </div>
  )
}
