'use client'

import { ChevronDown } from 'lucide-react'

export function TagFilterDropdown({
  label,
  options,
  selected,
  onToggle,
}: {
  label: string
  options: string[]
  selected: ReadonlySet<string>
  onToggle: (value: string) => void
}) {
  return (
    <details className="group relative">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-lg border border-input bg-background px-4 py-2 font-semibold hover:border-foreground [&::-webkit-details-marker]:hidden">
        <span>{label}{selected.size ? ` · ${selected.size}` : ''}</span>
        <ChevronDown className="size-4 shrink-0 transition-transform group-open:rotate-180" aria-hidden="true" />
      </summary>
      <div className="absolute left-0 z-30 mt-2 max-h-72 w-72 max-w-[calc(100vw-3rem)] overflow-y-auto rounded-xl border border-border bg-card p-2 shadow-xl">
        {options.length ? options.map((option) => (
          <label key={option} className="flex cursor-pointer items-start gap-2 rounded-md px-2 py-2 text-sm hover:bg-secondary">
            <input type="checkbox" checked={selected.has(option.toLocaleLowerCase())} onChange={() => onToggle(option.toLocaleLowerCase())} className="mt-0.5 size-4 shrink-0 accent-primary" />
            <span className="break-words">{option}</span>
          </label>
        )) : <p className="px-2 py-3 text-sm text-muted-foreground">No tags available yet.</p>}
      </div>
    </details>
  )
}
