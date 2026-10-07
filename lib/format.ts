const dayMonth = new Intl.DateTimeFormat('en-MY', { day: 'numeric', month: 'short', timeZone: 'UTC' })
const full = new Intl.DateTimeFormat('en-MY', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDateRange(start: string | null | undefined, end: string | null | undefined) {
  if (!start) return 'Date TBA'
  const s = new Date(`${start}T00:00:00Z`)
  if (!end || end === start) return full.format(s)
  const e = new Date(`${end}T00:00:00Z`)
  if (s.getUTCFullYear() === e.getUTCFullYear()) {
    if (s.getUTCMonth() === e.getUTCMonth()) {
      return `${s.getUTCDate()}–${full.format(e)}`
    }
    return `${dayMonth.format(s)} – ${full.format(e)}`
  }
  return `${full.format(s)} – ${full.format(e)}`
}

export function instagramUrl(handle: string) {
  return `https://www.instagram.com/${handle.replace(/^@/, '')}`
}

export const SITE_SOCIALS = {
  instagram: 'my.concatalogue',
  x: 'my.concatalogue',
  tiktok: 'my.concatalogue',
}
