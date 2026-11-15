'use client'

import { useEffect } from 'react'

const VIEWED_STORAGE_KEY = 'mcc:viewed-catalogues'

export function CatalogueViewTracker({ catalogueKey }: { catalogueKey: string }) {
  useEffect(() => {
    try {
      const stored = JSON.parse(window.localStorage.getItem(VIEWED_STORAGE_KEY) ?? '[]')
      const viewed = new Set(Array.isArray(stored) ? stored.filter((item): item is string => typeof item === 'string') : [])
      viewed.add(catalogueKey)
      window.localStorage.setItem(VIEWED_STORAGE_KEY, JSON.stringify([...viewed]))
      window.dispatchEvent(new Event('mcc:viewed-catalogues-updated'))
    } catch {
      // Viewed status is an enhancement; the catalogue page remains usable without storage.
    }
  }, [catalogueKey])

  return null
}
