import { redirect } from 'next/navigation'

type Props = { searchParams: Promise<{ year?: string | string[] }> }

export default async function LegacyFanCafesPage({ searchParams }: Props) {
  const { year } = await searchParams
  const yearValue = typeof year === 'string' ? year : null
  redirect(yearValue ? `/fan-events?year=${encodeURIComponent(yearValue)}` : '/fan-events')
}
