'use client'

import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'

type BoothSpot = {
  level: 'L1' | 'L2'
  zone: string
  number: number
  x: number
  y: number
}

const boothSpots: BoothSpot[] = []

function add(level: BoothSpot['level'], zone: string, numbers: number[], xs: number[], ys: number[]) {
  numbers.forEach((number, index) => {
    const x = xs[index % xs.length]
    const y = ys[Math.floor(index / xs.length)]
    if (x !== undefined && y !== undefined) boothSpots.push({ level, zone, number, x, y })
  })
}

function addAt(level: BoothSpot['level'], zone: string, booths: Array<[number, number, number]>) {
  booths.forEach(([number, x, y]) => boothSpots.push({ level, zone, number, x, y }))
}

// Centers of the printed booth squares in the supplied 1688 × 802 image.
// SVG hit areas use the same viewBox, so they remain aligned as it scales.
addAt('L1', 'D', [[12, 115, 46], [11, 149, 46], [10, 133, 91], [9, 168, 91]])
add('L1', 'D', [8, 7, 6, 5, 4, 3, 2, 1], [309, 343, 380, 416, 483, 518, 553, 589], [67])
add('L1', 'A', Array.from({ length: 12 }, (_, i) => i + 1), [698], [74, 110, 146, 182, 253, 289, 325, 361, 431, 467, 503, 539])
add('L1', 'B', Array.from({ length: 12 }, (_, i) => i + 1), [756], [74, 110, 146, 182, 253, 289, 325, 361, 431, 467, 503, 539])
addAt('L2', 'J', [[10, 896, 195], [9, 931, 195], [8, 990, 195], [7, 1026, 195], [6, 1118, 195], [5, 1154, 195], [4, 1213, 195], [3, 1313, 210], [2, 1372, 210], [1, 1407, 210]])
add('L2', 'F', Array.from({ length: 12 }, (_, i) => i + 1), [1565], [228, 263, 299, 335, 405, 441, 477, 513, 583, 619, 655, 691])
add('L2', 'G', Array.from({ length: 12 }, (_, i) => i + 1), [1624], [228, 263, 299, 335, 405, 441, 477, 513, 583, 619, 655, 691])
add('L1', 'C', Array.from({ length: 4 }, (_, i) => i + 1), [108], [633, 669, 706, 742])
add('L1', 'C', Array.from({ length: 4 }, (_, i) => i + 5), [196], [633, 669, 706, 742])
add('L1', 'C', Array.from({ length: 4 }, (_, i) => i + 9), [232], [633, 669, 706, 742])
add('L1', 'C', Array.from({ length: 4 }, (_, i) => i + 13), [321], [633, 669, 706, 742])
addAt('L1', 'E', [[9, 588, 662], [10, 623, 662], [11, 694, 662], [12, 729, 662], [13, 611, 618], [14, 646, 618], [15, 717, 618], [16, 753, 618]])
add('L1', 'E', Array.from({ length: 8 }, (_, i) => i + 1), [473, 508, 544, 580, 647, 683, 719, 755], [749])
add('L2', 'H', Array.from({ length: 4 }, (_, i) => i + 1), [877], [590, 626, 662, 698])
addAt('L2', 'H', [[5, 965, 607], [6, 965, 643], [7, 965, 679], [8, 1000, 607], [9, 1000, 643], [10, 1000, 679]])
add('L2', 'H', Array.from({ length: 4 }, (_, i) => i + 11), [1088], [590, 626, 662, 698])
add('L2', 'K', [6, 7, 8, 9], [1258, 1293, 1355, 1390], [490])
addAt('L2', 'K', [[10, 1284, 565], [11, 1349, 565], [12, 1384, 565], [13, 1447, 565], [14, 1482, 565]])
add('L2', 'K', [1, 2, 3, 4, 5], [1240, 1275, 1335, 1406, 1442], [687])

function normalizeBooth(value: string) {
  return value.toLocaleUpperCase().replace(/[^A-Z0-9]/g, '')
}

function parseBoothCodes(value: string) {
  const level = value.match(/\bL([12])\b/i)?.[1]
  const withoutLevel = value.replace(/\bL[12]\b/gi, ' ')
  const codes: Array<{ zone: string; number: number }> = []
  const pattern = /([A-Z])\s*[-–—]?\s*0*(\d{1,3})(?!\d)/gi
  for (const match of withoutLevel.matchAll(pattern)) {
    codes.push({ zone: match[1].toLocaleUpperCase(), number: Number(match[2]) })
  }
  return { level, codes }
}

function findEntry(spot: BoothSpot, entries: readonly CatalogueEntry[]) {
  const number = String(spot.number).padStart(2, '0')
  const expected = `${spot.level}${spot.zone}${number}`
  const exact = entries.find((entry) => normalizeBooth(entry.booth) === expected)
  if (exact) return exact

  // Accept short labels (A-01) and combined labels (H13-H14). A specific
  // single-booth row wins over a combined row if both exist.
  const matchingRows = entries.flatMap((entry) => {
    const parsed = parseBoothCodes(entry.booth)
    if (parsed.level && parsed.level !== spot.level.slice(1)) return []
    if (!parsed.codes.some((code) => code.zone === spot.zone && code.number === spot.number)) return []
    return [{ entry, codeCount: parsed.codes.length }]
  })
  const singleBoothRows = matchingRows.filter((row) => row.codeCount === 1)
  if (singleBoothRows.length === 1) return singleBoothRows[0].entry
  return matchingRows.length === 1 ? matchingRows[0].entry : undefined
}

export function AnimeFestFloorplan({ entries }: { entries: readonly CatalogueEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#0b1324] shadow-sm">
        <div className="relative aspect-[1688/802] w-full">
        <Image
          src="/events/anime-fest-2026-floorplan.png"
          alt="Anime Fest! 2026 floor plan showing Level 1 and Level 2 booth numbers"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-fill"
        />
        <svg
          viewBox="0 0 1688 802"
          preserveAspectRatio="none"
          className="absolute inset-0 size-full"
          role="group"
          aria-label="Clickable Anime Fest! booth numbers"
        >
          {boothSpots.map((spot) => {
            const number = String(spot.number).padStart(2, '0')
            const boothLabel = `${spot.level}-${spot.zone}${number}`
            const cosplayMarket = (spot.zone === 'D' && spot.number >= 9 && spot.number <= 12)
              || spot.zone === 'E' || spot.zone === 'J' || spot.zone === 'K'
            const entry = findEntry(spot, entries)
            const href = entry && !cosplayMarket ? `/events/${entry.eventSlug}/catalogues/${entry.id}` : undefined
            const box = { x: spot.x - 17, y: spot.y - 17, width: 34, height: 34 }
            return cosplayMarket ? (
              <g key={boothLabel} aria-label={`${boothLabel}: Cosplay Market, outside this archive's scope`}>
                <title>{`${boothLabel} · Cosplay Market — this archive covers Artist Alley and Art Market catalogues`}</title>
                <rect {...box} rx="3" fill="#6b7280" fillOpacity="0.82" stroke="#f3f4f6" strokeOpacity="0.85" strokeWidth="1.5" />
              </g>
            ) : href ? (
              <a key={boothLabel} href={href} aria-label={`${boothLabel}: ${entry.artistName}`}>
                <title>{`${boothLabel} · ${entry.artistName} — open catalogue`}</title>
                <rect {...box} rx="3" className="fill-amber-300/20 stroke-amber-200/90 transition-colors hover:fill-amber-200/45 focus:fill-amber-200/45" strokeWidth="2.5" />
              </a>
            ) : (
              <g key={boothLabel} aria-label={`${boothLabel}: catalogue not listed yet`}>
                <title>{`${boothLabel} · no catalogue listed yet`}</title>
                <rect {...box} fill="transparent" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 px-4 py-3 text-sm text-white">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border-2 border-amber-200 bg-amber-300/30" aria-hidden="true" /> Catalogue listed — click the booth</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border border-white/80 bg-gray-500" aria-hidden="true" /> Cosplay Market</span>
        <p className="basis-full text-white/80">D9–D12 and booths in sections E, J, and K are part of the Cosplay Market. We only collect Artist Alley and Art Market catalogues, so these booths are not included.</p>
        <p className="basis-full text-white/70">Other Artist Alley / Art Market booths will become clickable when their catalogue entry is added.</p>
      </div>
    </div>
  )
}
