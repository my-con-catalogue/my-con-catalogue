import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'

type BoothRect = {
  booth: number
  x: number
  y: number
  width: number
  height: number
}

function makeRow(firstBooth: number, y: number, count: number, firstX = 428): BoothRect[] {
  return Array.from({ length: count }, (_, index) => ({
    booth: firstBooth + index,
    x: firstX + index * 39,
    y,
    width: 38,
    height: 58,
  }))
}

// Hit areas use the source map's 772 × 497 coordinate space and scale with it.
const crBooths: BoothRect[] = [
  { booth: 1, x: 428, y: 10, width: 56, height: 58 },
  { booth: 2, x: 488, y: 10, width: 57, height: 58 },
  { booth: 3, x: 547, y: 10, width: 35, height: 58 },
  { booth: 4, x: 586, y: 10, width: 36, height: 58 },
  { booth: 5, x: 626, y: 10, width: 36, height: 58 },
  { booth: 6, x: 666, y: 10, width: 36, height: 58 },
  { booth: 7, x: 706, y: 10, width: 36, height: 58 },
  ...makeRow(8, 96, 8),
  ...makeRow(16, 172, 6),
  { booth: 22, x: 665, y: 172, width: 77, height: 56 },
  ...makeRow(23, 253, 8),
  ...makeRow(31, 330, 8),
]

const outOfScopeBooths = [
  // CO01–CO12
  ...Array.from({ length: 12 }, (_, index) => ({
    label: `CO${String(index + 1).padStart(2, '0')}`,
    x: 9 + (index % 2) * 40,
    y: [10, 95, 172, 253, 330, 420][Math.floor(index / 2)],
    width: 38,
    height: 58,
  })),
  // EX01–EX19, including the larger grouped exhibition spaces.
  { label: 'EX01', x: 112, y: 10, width: 36, height: 58 },
  { label: 'EX02', x: 152, y: 10, width: 36, height: 58 },
  { label: 'EX03', x: 192, y: 10, width: 36, height: 58 },
  { label: 'EX04', x: 232, y: 10, width: 109, height: 58 },
  { label: 'EX05', x: 112, y: 95, width: 36, height: 58 },
  { label: 'EX06', x: 152, y: 95, width: 36, height: 58 },
  { label: 'EX07', x: 192, y: 95, width: 36, height: 58 },
  { label: 'EX08', x: 260, y: 95, width: 81, height: 133 },
  { label: 'EX09', x: 112, y: 172, width: 36, height: 58 },
  { label: 'EX10', x: 152, y: 172, width: 36, height: 58 },
  { label: 'EX11', x: 192, y: 172, width: 36, height: 58 },
  { label: 'EX12', x: 147, y: 253, width: 82, height: 133 },
  { label: 'EX13', x: 260, y: 253, width: 81, height: 133 },
  ...Array.from({ length: 6 }, (_, index) => ({
    label: `EX${String(index + 14).padStart(2, '0')}`,
    x: 112 + index * 39,
    y: 420,
    width: 36,
    height: 57,
  })),
]

function canonicalBooth(value: string) {
  return value.toLocaleUpperCase().replace(/[^A-Z0-9]/g, '')
}

function boothNumbersIn(value: string) {
  const matches = [...value.matchAll(/\bCR\s*[-–—]?\s*0*(\d{1,2})(?:\s*[-–—]\s*(?:CR\s*[-–—]?\s*0*)?(\d{1,2}))?/gi)]
  return matches.flatMap((match) => [Number(match[1]), ...(match[2] ? [Number(match[2])] : [])])
}

function findCatalogue(booth: number, entries: readonly CatalogueEntry[]) {
  const boothCode = `CR${String(booth).padStart(2, '0')}`
  const exact = entries.find((entry) => canonicalBooth(entry.booth) === boothCode)
  if (exact) return exact

  const matches = entries.filter((entry) => boothNumbersIn(entry.booth).includes(booth))
  const singleBoothMatches = matches.filter((entry) => boothNumbersIn(entry.booth).length === 1)
  if (singleBoothMatches.length === 1) return singleBoothMatches[0]
  return matches.length === 1 ? matches[0] : undefined
}

export function OtakyunFloorplan({ entries }: { entries: readonly CatalogueEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#202e70] shadow-sm">
      <div className="relative aspect-[772/497] w-full">
        <Image
          src="/events/otakyun-2026-floorplan.jpg"
          alt="Otakyun 2026 floor plan with CR, EX, and CO booth areas"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-fill"
        />
        <svg viewBox="0 0 772 497" preserveAspectRatio="none" className="absolute inset-0 size-full" role="group" aria-label="Otakyun 2026 booth map">
          {outOfScopeBooths.map((booth) => (
            <g key={booth.label} aria-label={`${booth.label}: outside this catalogue`}>
              <title>{`${booth.label} · Exhibitor or Community area, not included in the Artist Alley catalogue`}</title>
              <rect x={booth.x} y={booth.y} width={booth.width} height={booth.height} rx="2" fill="#6b7280" fillOpacity="0.72" stroke="#e5e7eb" strokeOpacity="0.9" strokeWidth="1.5" />
            </g>
          ))}
          {crBooths.map((booth) => {
            const label = `CR${String(booth.booth).padStart(2, '0')}`
            const entry = findCatalogue(booth.booth, entries)
            const rect = { x: booth.x, y: booth.y, width: booth.width, height: booth.height }

            return entry ? (
              <a key={label} href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} aria-label={`${label}: ${entry.artistName}, open catalogue`}>
                <title>{`${label} · ${entry.artistName} — open catalogue`}</title>
                <rect {...rect} rx="2" className="fill-amber-300/25 stroke-amber-100 transition-colors hover:fill-amber-200/55 focus:fill-amber-200/55" strokeWidth="2.5" />
              </a>
            ) : (
              <g key={label} aria-label={`${label}: catalogue not listed yet`}>
                <title>{`${label} · no catalogue listed yet`}</title>
                <rect {...rect} fill="transparent" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 px-4 py-3 text-sm text-white">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border-2 border-amber-100 bg-amber-300/30" aria-hidden="true" /> CR booth with catalogue — click to open</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border border-gray-200 bg-gray-500" aria-hidden="true" /> EX / CO booths — not collected</span>
        <p className="basis-full text-white/75">EX (Exhibitor) and CO (Community) booths are outside the Artist Alley catalogue. Other CR booths will become clickable when their catalogue is added.</p>
      </div>
    </div>
  )
}
