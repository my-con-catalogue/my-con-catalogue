'use client'

import { getPersonalCalendarEntries, type PersonalCalendarInput } from '@/app/actions/bookmark-accounts'

const UPDATE_EVENT = 'mycc:personal-calendar-updated'
let cachedKeys: Set<string> | null = null
let cacheExpiresAt = 0
let pendingRequest: Promise<Set<string>> | null = null

export async function getSavedCalendarSourceKeys(forceRefresh = false) {
  if (!forceRefresh && cachedKeys && Date.now() < cacheExpiresAt) return cachedKeys
  if (!pendingRequest) {
    pendingRequest = getPersonalCalendarEntries().then(({ entries }) => {
      cachedKeys = new Set(entries.map((entry) => entry.sourceKey))
      cacheExpiresAt = Date.now() + 30_000
      return cachedKeys
    }).finally(() => { pendingRequest = null })
  }
  return pendingRequest
}

export function rememberSavedCalendarEntries(entries: PersonalCalendarInput[]) {
  cachedKeys ??= new Set()
  for (const entry of entries) cachedKeys.add(entry.sourceKey)
  cacheExpiresAt = Date.now() + 30_000
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UPDATE_EVENT))
}

export function forgetSavedCalendarEntries(entries: PersonalCalendarInput[]) {
  if (!cachedKeys) {
    invalidateSavedCalendarEntries()
    return
  }
  for (const entry of entries) cachedKeys.delete(entry.sourceKey)
  cacheExpiresAt = Date.now() + 30_000
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UPDATE_EVENT))
}

export function invalidateSavedCalendarEntries() {
  cachedKeys = null
  cacheExpiresAt = 0
  if (typeof window !== 'undefined') window.dispatchEvent(new Event(UPDATE_EVENT))
}

export const personalCalendarUpdatedEvent = UPDATE_EVENT
