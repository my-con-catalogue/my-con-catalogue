import Image from 'next/image'
import type { CatalogueEntry } from '@/lib/queries'

type BoothSpot = {
  booth: string
  x: number
  y: number
  width: number
  height: number
  aliases?: string[]
}

const standardRows = [
  { prefix: 'SA', y: 235, numbers: 11 },
  { prefix: 'SB', y: 327, numbers: 11 },
  { prefix: 'SC', y: 430, numbers: 10 },
  { prefix: 'SD', y: 522, numbers: 10 },
  { prefix: 'SE', y: 621, numbers: 11 },
  { prefix: 'SF', y: 715, numbers: 5 },
]
const standardXs = [151, 217, 284, 350, 416, 482, 601, 667, 733, 799, 865]

const standardBooths: BoothSpot[] = standardRows.flatMap(({ prefix, y, numbers }) =>
  Array.from({ length: numbers }, (_, index) => {
    const booth = `${prefix}${String(index + 1).padStart(2, '0')}`
    return { booth, x: standardXs[index], y, width: 64, height: 43 }
  }),
)

const leftRahmahRows = [102, 149, 232, 279, 362, 409, 492, 539, 646, 692, 776, 822, 906, 952, 1036, 1082]
const rightRahmahRows = [105, 152, 240, 287, 376, 422, 511, 557, 691, 738, 850, 897, 1009, 1056]
const rahmahBooths: BoothSpot[] = [
  ...leftRahmahRows.map((y, index) => {
    const number = 16 - index
    return {
      booth: `R${String(number).padStart(2, '0')}`,
      x: 1861,
      y,
      width: 40,
      height: 44,
    }
  }),
  ...rightRahmahRows.map((y, index) => {
    const number = 30 - index
    return {
      booth: `R${String(number).padStart(2, '0')}`,
      x: 2005,
      y,
      width: 40,
      height: 44,
    }
  }),
]

const cosplayBooths: BoothSpot[] = Array.from({ length: 6 }, (_, index) => ({
  booth: `C${String(index + 1).padStart(2, '0')}`,
  x: [151, 217, 284, 350, 416, 482][index],
  y: 715,
  width: 64,
  height: 43,
}))

function canonical(value: string) {
  return value.toLocaleUpperCase().replace(/[^A-Z0-9]/g, '')
}

function boothCodes(value: string) {
  const codes = [...value.matchAll(/([A-Z]{1,2})\s*[-–—]?\s*0*(\d{1,3})/gi)]
    .map((match) => `${match[1].toLocaleUpperCase()}${String(Number(match[2])).padStart(2, '0')}`)
  if (codes.length) return codes
  return [...value.matchAll(/\d{1,3}/g)].map((match) => String(Number(match[0])).padStart(2, '0'))
}

function findCatalogue(spot: BoothSpot, entries: readonly CatalogueEntry[]) {
  const expected = [spot.booth, ...(spot.aliases ?? [])].map(canonical)
  const exact = entries.find((entry) => expected.includes(canonical(entry.booth)))
  if (exact) return exact

  const matches = entries.filter((entry) => boothCodes(entry.booth).some((code) => expected.includes(code)))
  const singleBoothMatches = matches.filter((entry) => boothCodes(entry.booth).length === 1)
  if (singleBoothMatches.length === 1) return singleBoothMatches[0]
  return matches.length === 1 ? matches[0] : undefined
}

export function Vax2026Floorplan({ entries }: { entries: readonly CatalogueEntry[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-[#10072c] shadow-sm">
      <div className="relative aspect-[2160/1350] w-full">
        <Image
          src="/events/vax-2026-floorplan.png"
          alt="VAX 2026 floor plan showing Standard Artist Alley and Rahmah table booths"
          fill
          priority
          sizes="(max-width: 1152px) 100vw, 1152px"
          className="object-fill"
        />
        <svg viewBox="0 0 2160 1350" preserveAspectRatio="none" className="absolute inset-0 size-full" role="group" aria-label="VAX 2026 booth map">
          {cosplayBooths.map((spot) => (
            <g key={spot.booth} aria-label={`${spot.booth}: Cosplayer booth, not included in the artist catalogue`}>
              <title>{`${spot.booth} · Cosplayer booth — not included in the Artist Alley catalogue`}</title>
              <rect x={spot.x} y={spot.y} width={spot.width} height={spot.height} fill="#6b7280" fillOpacity="0.84" stroke="#e5e7eb" strokeOpacity="0.95" strokeWidth="2" />
            </g>
          ))}
          {[...standardBooths, ...rahmahBooths].map((spot) => {
            const entry = findCatalogue(spot, entries)
            const box = { x: spot.x, y: spot.y, width: spot.width, height: spot.height }
            return entry ? (
              <a key={spot.booth} href={`/events/${entry.eventSlug}/catalogues/${entry.id}`} aria-label={`${spot.booth}: ${entry.artistName}, open catalogue`}>
                <title>{`${spot.booth} · ${entry.artistName} — open catalogue`}</title>
                <rect {...box} fill="#facc15" fillOpacity="0.32" stroke="#fff7ae" strokeWidth="2.5" className="transition-colors hover:fill-opacity-60 focus:fill-opacity-60" />
              </a>
            ) : (
              <g key={spot.booth} aria-label={`${spot.booth}: catalogue not listed yet`}>
                <title>{`${spot.booth} · no catalogue listed yet`}</title>
                <rect {...box} fill="transparent" />
              </g>
            )
          })}
        </svg>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/10 px-4 py-3 text-sm text-white">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border-2 border-yellow-100 bg-yellow-300/30" aria-hidden="true" /> Yellow Artist Alley booth — clickable when a catalogue is listed</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm border border-gray-200 bg-gray-500" aria-hidden="true" /> Purple C booths — Cosplayer booths, not collected</span>
        <p className="basis-full text-white/75">We collect the yellow Standard Artist Alley and Rahmah table booths. Purple C01–C06 are Cosplayer booths and are not included.</p>
      </div>
    </div>
  )
}
