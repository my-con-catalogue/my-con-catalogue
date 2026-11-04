import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'

type BoothSpot = { booth: number; points: string }

function rectangle(booth: number, x: number, y: number, width: number, height: number): BoothSpot {
  return { booth, points: `${x},${y} ${x + width},${y} ${x + width},${y + height} ${x},${y + height}` }
}

// Coordinates trace the green booth tiles in the 875 × 733 source artwork.
// The angled booths have individual corner points because their slant and
// position vary slightly along each row.
const boothSpots: BoothSpot[] = [
  // A01–A18 navigation key.
  ...Array.from({ length: 18 }, (_, index) => {
    const column = index < 9 ? 0 : 1
    const row = index % 9
    const y = [55, 92, 142, 179, 227, 265, 312, 350, 398][row]
    return rectangle(index + 1, 738 + column * 38, y, 37, 34)
  }),
  // A19–A34 central grid.
  ...Array.from({ length: 16 }, (_, index) => {
    const column = Math.floor(index / 4)
    const row = index % 4
    const xs = [287, 359, 397, 465]
    const ys = [548, 585, 635, 672]
    return rectangle(index + 19, xs[column], ys[row], 37, 34)
  }),
  // Upper left slanted row: A42, A41, A40, A39, A56, A55.
  { booth: 42, points: '27.5,528.5 30.6,494.8 67.2,498.1 64.1,531.8' },
  { booth: 41, points: '105.5,501.7 102.8,535.5 66.2,532.6 68.9,498.8' },
  { booth: 40, points: '107.2,502.5 143.9,505.6 141.1,539.3 104.4,536.3' },
  { booth: 39, points: '179.3,542.6 142.6,539.6 145.4,506 182.1,509' },
  { booth: 56, points: '188.4,510.1 225,513.3 222.1,546.9 185.5,543.7' },
  { booth: 55, points: '226.6,513.5 263.3,516.5 260.5,550.2 223.8,547.2' },
  // Upper right slanted row: A35, A36, A37, A38, A54, A57.
  { booth: 35, points: '550.6,513.3 553.6,547 517.1,550.4 514.1,516.6' },
  { booth: 36, points: '555.2,546.9 552.3,513.1 589,510.1 591.8,543.8' },
  { booth: 37, points: '631.9,505.8 634.9,539.4 598.3,542.7 595.3,509.2' },
  { booth: 38, points: '633.2,505.7 670.1,502.4 673.2,536.2 636.3,539.5' },
  { booth: 54, points: '712.6,533 676.1,536.4 673.1,502.7 709.6,499.4' },
  { booth: 57, points: '749.8,495.9 752.9,529.6 716.2,533 713.1,499.3' },
  // Lower left diagonal: A46–A43.
  { booth: 46, points: '29,622 44,592 76.8,608.4 61.8,638.4' },
  { booth: 45, points: '63.4,639.2 78.4,609.2 111.2,625.6 96.2,655.6' },
  { booth: 44, points: '115.6,628.3 149.2,643.2 135.5,674.1 101.9,659.2' },
  { booth: 43, points: '137,674.8 150.8,643.7 184.4,658.6 170.6,689.7' },
  // Lower right diagonal: A47–A53.
  { booth: 47, points: '632.1,674.7 598.5,689.7 584.8,658.8 618.4,643.8' },
  { booth: 48, points: '619.8,643.2 653.4,628.3 667.1,659.2 633.5,674.1' },
  { booth: 49, points: '690.6,609.2 705.6,639.2 672.8,655.6 657.8,625.6' },
  { booth: 50, points: '692.2,608.4 725,592 740,622 707.2,638.4' },
  { booth: 51, points: '732.8,588.6 765.6,572.2 780.8,602.6 748,619' },
  { booth: 52, points: '815.2,585.4 782.4,601.8 767.4,571.8 800.2,555.4' },
  { booth: 53, points: '851.8,566.6 819,583 804,553 836.8,536.6' },
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

  // A combined booth range links each of its booth tiles to the same listing.
  const matches = entries.filter((entry) => boothNumbers(entry.booth).includes(booth))
  return matches.length === 1 ? matches[0] : undefined
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
          {boothSpots.map((spot) => {
            const boothCode = `A${String(spot.booth).padStart(2, '0')}`
            const entry = findCatalogue(spot.booth, entries)

            return entry ? (
              <a key={boothCode} href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} aria-label={`${boothCode}: ${entry.artistName}, open catalogue`}>
                <title>{`${boothCode} · ${entry.artistName} — open catalogue`}</title>
                <polygon points={spot.points} className="fill-amber-300/20 stroke-amber-100 transition-colors hover:fill-amber-200/55 focus:fill-amber-200/55" strokeWidth="1.5" />
              </a>
            ) : (
              <g key={boothCode} aria-label={`${boothCode}: catalogue not listed yet`}>
                <title>{`${boothCode} · no catalogue listed yet`}</title>
                <polygon points={spot.points} fill="transparent" />
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
