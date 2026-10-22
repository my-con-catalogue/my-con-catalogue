import { and, asc, count, desc, eq, sql } from 'drizzle-orm'
import { db } from '@/lib/db'
import { catalogueEntries, eventBooths, events, fanCafes, interestChecks, stampRallies } from '@/lib/db/schema'
import { previewEvents } from '@/lib/preview-events'
import { previewFanCafes } from '@/lib/preview-fan-cafes'
import { previewCatalogueEntries } from '@/lib/preview-catalogue-entries'

export type EventRow = typeof events.$inferSelect
const databaseConfigured = Boolean(process.env.DATABASE_URL)

function cleanTextArray(values: readonly unknown[] | null | undefined): string[] {
  return (values ?? []).filter(
    (value): value is string => typeof value === 'string' && value.trim().length > 0,
  )
}

function sortedTags(values: readonly unknown[] | null | undefined): string[] {
  return cleanTextArray(values).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base', numeric: true }))
}

function uniqueInstagramHandles(handles: readonly string[] | null | undefined) {
  return [...new Set((handles ?? []).map((handle) => handle.trim().replace(/^@/, '')).filter(Boolean))]
}

export async function getEvents() {
  if (!databaseConfigured) return previewEvents.map((event) => ({
    ...event,
    catalogueCount: previewCatalogueEntries.filter((entry) => entry.eventSlug === event.slug).length,
  }))
  return db
    .select({
      id: events.id,
      slug: events.slug,
      name: events.name,
      year: events.year,
      displayOrder: events.displayOrder,
      logoUrl: events.logoUrl,
      isUpcoming: events.isUpcoming,
      startDate: events.startDate,
      endDate: events.endDate,
      location: events.location,
      instagram: events.instagram,
      entryStatus: events.entryStatus,
      description: events.description,
      catalogueCount: sql<number>`(select count(*)::int from ${catalogueEntries} where ${catalogueEntries.eventSlug} = ${events.slug})`,
    })
    .from(events)
    .orderBy(asc(events.year), asc(events.displayOrder), asc(events.name))
}

export type EventWithCount = Awaited<ReturnType<typeof getEvents>>[number]

export async function getEventBySlug(slug: string) {
  if (!databaseConfigured) return previewEvents.find((event) => event.slug === slug) ?? null
  const [event] = await db.select().from(events).where(eq(events.slug, slug)).limit(1)
  return event ?? null
}

export async function getEventCatalogues(eventSlug: string) {
  if (!databaseConfigured) return previewCatalogueEntries.filter((entry) => entry.eventSlug === eventSlug).map((entry) => ({
    ...entry,
    orderCutoff: null,
    fandoms: sortedTags(entry.fandoms),
    merchTypes: sortedTags(entry.merchTypes),
  }))
  const rows = await db
    .select({
      id: catalogueEntries.id,
      catalogueType: catalogueEntries.catalogueType,
      booth: catalogueEntries.booth,
      pickupNote: catalogueEntries.pickupNote,
      orderCutoff: catalogueEntries.orderCutoff,
      instagramPosts: catalogueEntries.instagramPosts,
      catalogueLinks: catalogueEntries.catalogueLinks,
      catalogueFileUrls: catalogueEntries.catalogueFileUrls,
      fandoms: catalogueEntries.fandoms,
      merchTypes: catalogueEntries.merchTypes,
      stampRally: catalogueEntries.stampRally,
      eventSlug: catalogueEntries.eventSlug,
      artistName: catalogueEntries.artistName,
      artistInstagrams: catalogueEntries.artistInstagrams,
      artistSocialLinks: catalogueEntries.artistSocialLinks,
    })
    .from(catalogueEntries)
    .where(eq(catalogueEntries.eventSlug, eventSlug))
    .orderBy(sql`lower(${catalogueEntries.booth})`, sql`lower(${catalogueEntries.artistName})`)

  // Postgres arrays may contain NULL elements even when the array column is NOT NULL.
  // Keep malformed tag values from reaching the UI's text sorting and rendering.
  return rows.map((entry) => ({
    ...entry,
    artistInstagrams: uniqueInstagramHandles(entry.artistInstagrams),
    fandoms: sortedTags(entry.fandoms),
    merchTypes: sortedTags(entry.merchTypes),
  }))
}

export type CatalogueEntry = Awaited<ReturnType<typeof getEventCatalogues>>[number]
export type CatalogueType = 'booth_catalogue' | 'pickup_only'

export async function getEventBoothNumbers(eventSlug: string): Promise<string[]> {
  if (!databaseConfigured) return []
  const rows = await db
    .select({ boothNumber: eventBooths.boothNumber })
    .from(eventBooths)
    .where(eq(eventBooths.eventSlug, eventSlug))
    .orderBy(asc(eventBooths.displayOrder), asc(eventBooths.id))
  return rows.map((row) => row.boothNumber)
}

export async function getEventCatalogueById(eventSlug: string, catalogueId: number) {
  if (!databaseConfigured) {
    const entry = previewCatalogueEntries.find((item) => item.eventSlug === eventSlug && item.id === catalogueId)
    const event = previewEvents.find((item) => item.slug === eventSlug)
    return entry && event ? {
      ...entry,
      orderCutoff: null,
      fandoms: sortedTags(entry.fandoms),
      merchTypes: sortedTags(entry.merchTypes),
      eventName: event.name,
      eventYear: event.year,
    } : null
  }
  const [entry] = await db
    .select({
      id: catalogueEntries.id,
      catalogueType: catalogueEntries.catalogueType,
      eventSlug: catalogueEntries.eventSlug,
      eventName: events.name,
      eventYear: events.year,
      booth: catalogueEntries.booth,
      pickupNote: catalogueEntries.pickupNote,
      orderCutoff: catalogueEntries.orderCutoff,
      instagramPosts: catalogueEntries.instagramPosts,
      catalogueLinks: catalogueEntries.catalogueLinks,
      catalogueFileUrls: catalogueEntries.catalogueFileUrls,
      fandoms: catalogueEntries.fandoms,
      merchTypes: catalogueEntries.merchTypes,
      stampRally: catalogueEntries.stampRally,
      artistName: catalogueEntries.artistName,
      artistInstagrams: catalogueEntries.artistInstagrams,
      artistSocialLinks: catalogueEntries.artistSocialLinks,
    })
    .from(catalogueEntries)
    .innerJoin(events, eq(catalogueEntries.eventSlug, events.slug))
    .where(and(eq(catalogueEntries.eventSlug, eventSlug), eq(catalogueEntries.id, catalogueId)))
    .limit(1)
  return entry ? {
    ...entry,
    artistInstagrams: uniqueInstagramHandles(entry.artistInstagrams),
    fandoms: sortedTags(entry.fandoms),
    merchTypes: sortedTags(entry.merchTypes),
  } : null
}

export async function getEventStampRallies(eventId: number) {
  if (!databaseConfigured) return []
  return db
    .select()
    .from(stampRallies)
    .where(eq(stampRallies.eventId, eventId))
    .orderBy(asc(stampRallies.title))
}

export async function getFanCafes() {
  const cafes = databaseConfigured
    ? await db.select().from(fanCafes)
    : previewFanCafes
  const today = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date())
  return [...cafes].sort((a, b) => {
    const aStatusDate = a.endDate ?? a.startDate
    const bStatusDate = b.endDate ?? b.startDate
    const aUpcoming = Boolean(aStatusDate && aStatusDate >= today)
    const bUpcoming = Boolean(bStatusDate && bStatusDate >= today)
    if (aUpcoming !== bUpcoming) return aUpcoming ? -1 : 1
    if (aUpcoming && bUpcoming) return (a.startDate ?? '').localeCompare(b.startDate ?? '')
    if (a.startDate && b.startDate) return b.startDate.localeCompare(a.startDate)
    if (a.startDate) return -1
    if (b.startDate) return 1
    return a.name.localeCompare(b.name)
  })
}

export async function getInterestChecks() {
  if (!databaseConfigured) return []
  return db
    .select()
    .from(interestChecks)
    .orderBy(asc(interestChecks.year), asc(interestChecks.cutoffDate), asc(interestChecks.title))
}

export async function getArtistsWithAppearances() {
  if (!databaseConfigured) {
    const map = new Map<string, {
      id: number
      slug: string
      name: string
      artistInstagrams: string[]
      artistSocialLinks: string[]
      bio: string | null
      appearances: { slug: string; name: string; year: number }[]
    }>()
    for (const entry of previewCatalogueEntries) {
      const event = previewEvents.find((item) => item.slug === entry.eventSlug)
      if (!event) continue
      const key = entry.artistName.trim().toLocaleLowerCase()
      const artist = map.get(key) ?? {
        id: entry.id,
        slug: key.replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
        name: entry.artistName,
        artistInstagrams: uniqueInstagramHandles(entry.artistInstagrams),
        artistSocialLinks: [...entry.artistSocialLinks],
        bio: null,
        appearances: [],
      }
      artist.artistInstagrams = uniqueInstagramHandles([...artist.artistInstagrams, ...(entry.artistInstagrams ?? [])])
      artist.artistSocialLinks = [...new Set([...artist.artistSocialLinks, ...entry.artistSocialLinks])]
      if (!artist.appearances.some((appearance) => appearance.slug === event.slug)) {
        artist.appearances.push({ slug: event.slug, name: event.name, year: event.year })
      }
      map.set(key, artist)
    }
    return [...map.values()]
  }
  const rows = await db
    .select({
      id: catalogueEntries.id,
      slug: sql<string>`lower(regexp_replace(${catalogueEntries.artistName}, '[^a-zA-Z0-9]+', '-', 'g'))`,
      name: catalogueEntries.artistName,
      artistInstagrams: catalogueEntries.artistInstagrams,
      artistSocialLinks: catalogueEntries.artistSocialLinks,
      bio: sql<string | null>`null::text`,
      eventSlug: events.slug,
      eventName: events.name,
      eventYear: events.year,
    })
    .from(catalogueEntries)
    .innerJoin(events, eq(catalogueEntries.eventSlug, events.slug))
    .orderBy(sql`lower(${catalogueEntries.artistName})`, desc(events.year), asc(events.name))

  const map = new Map<string, {
    id: number
    slug: string
    name: string
    artistInstagrams: string[]
    artistSocialLinks: string[]
    bio: string | null
    appearances: { slug: string; name: string; year: number }[]
  }>()

  for (const row of rows) {
    const key = row.name.trim().toLocaleLowerCase()
    let artist = map.get(key)
    if (!artist) {
      artist = {
        id: row.id,
        slug: row.slug.replace(/^-+|-+$/g, ''),
        name: row.name,
        artistInstagrams: uniqueInstagramHandles(row.artistInstagrams),
        artistSocialLinks: [...row.artistSocialLinks],
        bio: row.bio,
        appearances: [],
      }
      map.set(key, artist)
    }
    artist.artistInstagrams = uniqueInstagramHandles([...artist.artistInstagrams, ...(row.artistInstagrams ?? [])])
    artist.artistSocialLinks = [...new Set([...artist.artistSocialLinks, ...row.artistSocialLinks])]
    if (row.eventSlug && row.eventName && row.eventYear && !artist.appearances.some((a) => a.slug === row.eventSlug)) {
      artist.appearances.push({ slug: row.eventSlug, name: row.eventName, year: row.eventYear })
    }
  }

  return [...map.values()]
}

export type ArtistWithAppearances = Awaited<ReturnType<typeof getArtistsWithAppearances>>[number]

export async function getStats() {
  if (!databaseConfigured) {
    const [eventRows, artistRows, cafeRows] = await Promise.all([
      getEvents(),
      getArtistsWithAppearances(),
      getFanCafes(),
    ])
    return { events: eventRows.length, artists: artistRows.length, fanCafes: cafeRows.length }
  }
  const [[e], [a], [f]] = await Promise.all([
    db.select({ value: count() }).from(events),
    db.select({ value: sql<number>`count(distinct lower(${catalogueEntries.artistName}))::int` }).from(catalogueEntries),
    db.select({ value: count() }).from(fanCafes),
  ])
  return { events: e.value, artists: a.value, fanCafes: f.value }
}
