'use client'

import { Analytics, type BeforeSendEvent } from '@vercel/analytics/next'

const ANALYTICS_SAMPLE_KEY = 'mcc:vercel-analytics:last-sent'
const ANALYTICS_SAMPLE_INTERVAL = 7 * 24 * 60 * 60 * 1000

function sampleAnalyticsOncePerWeek(event: BeforeSendEvent) {
  // Keep one page view per browser storage context each week, instead of
  // sending every navigation. If browser storage is unavailable, fail closed.
  if (typeof window === 'undefined') return null
  try {
    const previous = Number(window.localStorage.getItem(ANALYTICS_SAMPLE_KEY))
    if (Number.isFinite(previous) && previous > 0 && Date.now() - previous < ANALYTICS_SAMPLE_INTERVAL) return null
    window.localStorage.setItem(ANALYTICS_SAMPLE_KEY, String(Date.now()))
    return event
  } catch {
    return null
  }
}

export function WeeklyVercelAnalytics() {
  return <Analytics beforeSend={sampleAnalyticsOncePerWeek} />
}
