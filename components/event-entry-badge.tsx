import { CircleCheck, CircleHelp, TicketCheck } from 'lucide-react'

export function EventEntryBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()
  const isFree = normalized.includes('free')
  const isTicketed = normalized.includes('ticket')
  const Icon = isFree ? CircleCheck : isTicketed ? TicketCheck : CircleHelp
  const style = isFree
    ? 'border-emerald-700 bg-emerald-100 text-emerald-950'
    : isTicketed
      ? 'border-violet-700 bg-violet-100 text-violet-950'
      : 'border-border bg-muted text-foreground'

  return (
    <span className={`inline-flex items-center gap-2 rounded-lg border-2 px-3 py-2 text-sm font-extrabold shadow-sm ${style}`}>
      <Icon className="size-5" aria-hidden="true" />
      <span>{status}</span>
    </span>
  )
}
