export type PickupCutoffDate = { date: string; note: string }

const monthNumbers: Record<string, string> = {
  jan: '01', january: '01', feb: '02', february: '02', mar: '03', march: '03', apr: '04', april: '04',
  may: '05', jun: '06', june: '06', jul: '07', july: '07', aug: '08', august: '08', sep: '09', sept: '09', september: '09',
  oct: '10', october: '10', nov: '11', november: '11', dec: '12', december: '12',
}

export function parsePickupCutoffDates(text: string | null | undefined): PickupCutoffDate[] {
  if (!text) return []
  const results: PickupCutoffDate[] = []
  const pattern = /(?:(\d{4})-(\d{1,2})-(\d{1,2})|(\d{1,2})\s+([a-z]{3,9})\.?\s+(\d{4}))(?:\s*\(([^)]*)\))?/gi
  for (const match of text.matchAll(pattern)) {
    const year = match[1] ?? match[6]
    const month = match[2] ? match[2].padStart(2, '0') : monthNumbers[(match[5] ?? '').toLocaleLowerCase()]
    const day = (match[3] ?? match[4])?.padStart(2, '0')
    if (!year || !month || !day) continue
    const date = year + '-' + month + '-' + day
    const parsed = new Date(date + 'T00:00:00.000Z')
    if (Number.isNaN(parsed.valueOf()) || parsed.toISOString().slice(0, 10) !== date) continue
    results.push({ date, note: (match[7] ?? '').trim() })
  }
  return results
}
