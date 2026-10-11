import { getEventStatus } from '@/lib/event-status'

export function EventStatusBadge({ startDate, endDate }: { startDate: string | null; endDate: string | null }) {
  const status = getEventStatus(startDate, endDate)
  const classes = {
    upcoming: 'border-red-800 bg-red-700 text-white',
    ongoing: 'border-emerald-800 bg-emerald-700 text-white',
    past: 'border-border bg-muted text-muted-foreground',
  }[status]

  return (
    <span className={`inline-flex w-fit rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wide shadow-sm ${classes}`}>
      {status}
    </span>
  )
}
