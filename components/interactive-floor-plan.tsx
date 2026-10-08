'use client'

import Image from 'next/image'
import { useMemo, useState } from 'react'
import type { CatalogueEntry } from '@/lib/queries'

type BoothSpot = { booth: string; x: number; y: number; angle?: number }

// Coordinates use the 1440 × 874 source image, so the clickable areas scale with it.
function boothSpots(): BoothSpot[] {
  const spots: BoothSpot[] = []
  const add = (numbers: number[], positions: [number, number][], angle = 0) => {
    numbers.forEach((number, index) => spots.push({ booth: `D${String(number).padStart(2, '0')}`, x: positions[index][0], y: positions[index][1], angle }))
  }
  add(Array.from({ length: 10 }, (_, i) => 10 - i), Array.from({ length: 10 }, (_, i): [number, number] => [691, 163 + i * 19.5]))
  add(Array.from({ length: 10 }, (_, i) => 11 + i), Array.from({ length: 10 }, (_, i): [number, number] => [756, 163 + i * 19.5]))
  add([21, 22, 23, 24], [[758, 409], [758, 446], [758, 510], [693, 510]])
  add(Array.from({ length: 9 }, (_, i) => 25 + i), Array.from({ length: 9 }, (_, i): [number, number] => [159 + i * 24.2, 433 + i * 18.4]), 35)
  add(Array.from({ length: 7 }, (_, i) => 34 + i), Array.from({ length: 7 }, (_, i): [number, number] => [389 + i * 27, 604 + i * 9.5]), 12)
  add([41, 42, 43, 44, 48, 47, 46, 45], [[614, 598], [614, 648], [614, 708], [614, 764], [647, 598], [647, 648], [647, 708], [647, 764]])
  add([49, 50, 51, 52, 56, 55, 54, 53], [[708, 598], [708, 648], [708, 708], [708, 764], [741, 598], [741, 648], [741, 708], [741, 764]])
  add([57, 58, 59, 60, 64, 63, 62, 61], [[801, 598], [801, 648], [801, 708], [801, 764], [833, 598], [833, 648], [833, 708], [833, 764]])
  add(Array.from({ length: 7 }, (_, i) => 65 + i), Array.from({ length: 7 }, (_, i): [number, number] => [899 + i * 27, 650 - i * 8.2]), -12)
  add(Array.from({ length: 9 }, (_, i) => 72 + i), Array.from({ length: 9 }, (_, i): [number, number] => [1105 + i * 23.5, 580 - i * 18.2]), -35)
  return spots
}

function normalizedBooth(value: string) {
  const match = value.trim().toUpperCase().match(/^([A-Z]+)\s*-?\s*0*(\d+)$/)
  return match ? `${match[1]}${String(Number(match[2])).padStart(2, '0')}` : value.trim().toUpperCase()
}

export function InteractiveFloorPlan({ eventSlug, entries }: { eventSlug: string; entries: CatalogueEntry[] }) {
  const [selected, setSelected] = useState<string | null>(null)
  const spots = useMemo(() => boothSpots(), [])
  const entriesByBooth = useMemo(() => new Map(entries.map((entry) => [normalizedBooth(entry.booth), entry])), [entries])
  const selectedEntry = selected ? entriesByBooth.get(selected) : null

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-pink-500 ring-2 ring-pink-200" /> Catalogue available</span>
        <span className="inline-flex items-center gap-2"><span className="size-3 rounded-sm bg-slate-400/60" /> No catalogue added</span>
        <span className="text-muted-foreground">{entriesByBooth.size} booth catalogues linked</span>
      </div>
      <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
        <div className="relative mx-auto aspect-[1440/874] w-full">
          <Image src="/floorplans/nijifest-2026.jpg" alt="NijiFest floor plan showing booths D01 to D80" fill sizes="(max-width: 1200px) 100vw, 1152px" className="object-contain" priority unoptimized />
          <svg viewBox="0 0 1440 874" role="group" aria-label="Interactive NijiFest booth map" className="absolute inset-0 size-full">
            {spots.map(({ booth, x, y, angle }) => {
              const entry = entriesByBooth.get(booth)
              const active = Boolean(entry)
              const common = `group ${active ? 'cursor-pointer' : 'cursor-default'}`
              const shape = <g transform={`rotate(${angle ?? 0} ${x} ${y})`}>
                <rect x={x - 16} y={y - 12} width="32" height="24" rx="3" className={`${active ? 'fill-pink-500/35 stroke-pink-600 hover:fill-pink-400/80' : 'fill-slate-500/15 stroke-slate-500/35'} stroke-[2] transition-colors`} />
                {active && <text x={x} y={y + 4} textAnchor="middle" className="pointer-events-none fill-slate-950 text-[10px] font-extrabold">{booth}</text>}
              </g>
              return active ? (
                <a key={booth} href={`/events/${eventSlug}/catalogues/${entry!.id}`} aria-label={`Open ${booth} catalogue: ${entry!.artistName}`} className={common}>
                  {shape}
                  <title>{`${booth} · ${entry!.artistName} — open catalogue`}</title>
                </a>
              ) : (
                <g key={booth} className={common} onMouseEnter={() => setSelected(booth)} onMouseLeave={() => setSelected(null)} onFocus={() => setSelected(booth)} onBlur={() => setSelected(null)}>
                  {shape}<title>{`${booth} · catalogue not added yet`}</title>
                </g>
              )
            })}
          </svg>
        </div>
      </div>
      <p className="mt-3 min-h-6 text-sm text-muted-foreground" aria-live="polite">
        {selectedEntry ? `${selected} · ${selectedEntry.artistName}` : selected ? `${selected} · Catalogue not added yet` : 'Choose a highlighted booth to view its artist catalogue.'}
      </p>
    </div>
  )
}
