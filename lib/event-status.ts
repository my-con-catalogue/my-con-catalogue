export type EventStatus = 'upcoming' | 'ongoing' | 'past'

export function getEventStatus(startDate: string | null, endDate: string | null, now = new Date()): EventStatus {
  if (!startDate) return 'upcoming'

  const dateParts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Kuala_Lumpur',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now)
  const part = (type: 'year' | 'month' | 'day') => dateParts.find((item) => item.type === type)?.value ?? ''
  const todayInMalaysia = `${part('year')}-${part('month')}-${part('day')}`
  const finalDate = endDate ?? startDate

  if (todayInMalaysia < startDate) return 'upcoming'
  if (todayInMalaysia <= finalDate) return 'ongoing'
  return 'past'
}
