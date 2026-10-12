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

// Coordinates are in the attached 1728 × 806 floor-plan image's viewBox,
// so image and clickable areas scale together at every browser width.
addAt('L1', 'D', [[12, 130, 52], [11, 168, 52], [10, 151, 97], [9, 186, 97]])
add('L1', 'D', [8, 7, 6, 5, 4, 3, 2, 1], [326, 360, 394, 428, 500, 534, 568, 603], [72])
add('L1', 'A', Array.from({ length: 12 }, (_, i) => i + 1), [716], [78, 114, 149, 185, 257, 293, 329, 365, 401, 437, 473, 537])
add('L1', 'B', Array.from({ length: 12 }, (_, i) => i + 1), [774], [78, 114, 149, 185, 257, 293, 329, 365, 401, 437, 473, 537])
addAt('L2', 'J', [[10, 914, 199], [9, 950, 199], [8, 1008, 199], [7, 1044, 199], [6, 1138, 199], [5, 1174, 199], [4, 1231, 199], [3, 1330, 228], [2, 1390, 228], [1, 1425, 228]])
add('L2', 'F', Array.from({ length: 12 }, (_, i) => i + 1), [1584], [234, 270, 306, 342, 420, 456, 492, 528, 596, 632, 668, 704])
add('L2', 'G', Array.from({ length: 12 }, (_, i) => i + 1), [1646], [234, 270, 306, 342, 420, 456, 492, 528, 596, 632, 668, 704])
add('L1', 'C', Array.from({ length: 4 }, (_, i) => i + 1), [126], [638, 674, 710, 746])
add('L1', 'C', Array.from({ length: 4 }, (_, i) => i + 5), [214], [638, 674, 710, 746])
add('L1', 'C', Array.from({ length: 4 }, (_, i) => i + 9), [250], [638, 674, 710, 746])
add('L1', 'C', Array.from({ length: 4 }, (_, i) => i + 13), [338], [638, 674, 710, 746])
add('L1', 'E', [9, 10, 11, 12], [606, 640, 710, 745], [668])
add('L1', 'E', [13, 14, 15, 16], [640, 674, 745, 779], [621])
add('L1', 'E', Array.from({ length: 8 }, (_, i) => i + 1), [493, 528, 563, 598, 668, 703, 738, 772], [755])
add('L2', 'H', Array.from({ length: 4 }, (_, i) => i + 1), [895], [597, 631, 665, 699])
addAt('L2', 'H', [[5, 985, 615], [6, 985, 649], [7, 985, 683], [8, 1020, 615], [9, 1020, 649], [10, 1020, 683]])
add('L2', 'H', Array.from({ length: 4 }, (_, i) => i + 11), [1107], [597, 631, 665, 699])
add('L2', 'K', [6, 7, 8, 9], [1275, 1310, 1372, 1407], [496])
add('L2', 'K', [10, 11, 12, 13, 14], [1303, 1371, 1407, 1468, 1502], [572])
add('L2', 'K', [1, 2, 3, 4, 5], [1258, 1294, 1355, 1425, 1460], [694])

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
      <div className="relative aspect-[1728/806] w-full">
        <Image
          src="/events/anime-fest-2026-floorplan.png"
          alt="Anime Fest! 2026 floor plan showing Level 1 and Level 2 booth numbers"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-fill"
        />
        <svg
          viewBox="0 0 1728 806"
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
            const box = { x: spot.x - 16, y: spot.y - 15, width: 32, height: 30 }
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
