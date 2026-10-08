type PreviewEventInput = {
  name: string
  slug: string
  year: number
  displayOrder: number
  isUpcoming: boolean
  startDate?: string | null
  endDate?: string | null
  location?: string | null
  instagram?: string | null
  logoUrl?: string | null
  entryStatus: string
}

type PreviewEvent = {
  id: number
  name: string
  slug: string
  year: number
  displayOrder: number
  isUpcoming: boolean
  startDate: string | null
  endDate: string | null
  location: string | null
  instagram: string | null
  logoUrl: string | null
  entryStatus: string
  description: null
  catalogueCount: number
  createdAt: Date
}

const eventInputs: PreviewEventInput[] = [
  { name: 'Anime Fest! 2026 / 3', slug: 'anime-fest-2026', year: 2026, displayOrder: 1, isUpcoming: true, entryStatus: 'Free entry', startDate: '2026-10-17', endDate: '2026-10-18', location: 'Lalaport Bukit Bintang City Centre', instagram: 'comic_fiesta', logoUrl: '/events/anime-fest.png' },
  { name: 'Comic Fiesta 2026', slug: 'comic-fiesta-2026', year: 2026, displayOrder: 2, isUpcoming: true, entryStatus: 'Ticketed', startDate: '2026-12-19', endDate: '2026-12-20', location: 'Kuala Lumpur Convention Centre', instagram: 'comic_fiesta', logoUrl: '/events/comic-fiesta.png' },
  { name: 'NijiFest 2026', slug: 'nijifest-2026', year: 2026, displayOrder: 3, isUpcoming: true, entryStatus: 'TBA', location: 'LaLaport BBCC, Level 2', logoUrl: '/events/nijifest.png' },
  { name: 'Anime Fest! (2027)', slug: 'anime-fest-2027', year: 2027, displayOrder: 1, isUpcoming: true, entryStatus: 'TBA', instagram: 'comic_fiesta', logoUrl: '/events/anime-fest.png' },
  { name: 'Anime Fest! Plus (2027)', slug: 'anime-fest-plus-2027', year: 2027, displayOrder: 2, isUpcoming: true, entryStatus: 'TBA', instagram: 'comic_fiesta', logoUrl: '/events/anime-fest-plus.png' },
  { name: 'Cos-Mic (2027)', slug: 'cos-mic-2027', year: 2027, displayOrder: 3, isUpcoming: true, entryStatus: 'TBA', instagram: 'cosmic_asia', logoUrl: '/events/cos-mic.jpg' },
  { name: 'Comic Art Festival Kuala Lumpur (caf_kl) (2027)', slug: 'comic-art-festival-kuala-lumpur-caf-kl-2027', year: 2027, displayOrder: 4, isUpcoming: true, entryStatus: 'TBA', instagram: 'caf_kl', logoUrl: '/events/caf-kl.png' },
  { name: 'AniManGaki (2027)', slug: 'animangaki-2027', year: 2027, displayOrder: 5, isUpcoming: true, entryStatus: 'TBA', instagram: 'animangaki', logoUrl: '/events/animangaki.png' },
  { name: 'ACG Base Market (2027)', slug: 'acg-base-market-2027', year: 2027, displayOrder: 6, isUpcoming: true, entryStatus: 'TBA', instagram: 'acgbase.lalaport', logoUrl: '/events/acg-base.jpg' },
  { name: 'CosTime (2027)', slug: 'costime-2027', year: 2027, displayOrder: 7, isUpcoming: true, entryStatus: 'TBA', instagram: 'jcosclub', logoUrl: '/events/costime.png' },
  { name: 'Comic Fiesta (2027)', slug: 'comic-fiesta-2027', year: 2027, displayOrder: 8, isUpcoming: true, entryStatus: 'TBA', instagram: 'comic_fiesta', logoUrl: '/events/comic-fiesta.png' },
  { name: 'Nijigen Expo (2027)', slug: 'nijigen-expo-2027', year: 2027, displayOrder: 9, isUpcoming: true, entryStatus: 'TBA', instagram: 'nijigenexpo', logoUrl: '/events/nijigen-expo.png' },
]

export const previewEvents: PreviewEvent[] = eventInputs.map((event, index) => ({
  ...event,
  id: index + 1,
  startDate: event.startDate ?? null,
  endDate: event.endDate ?? null,
  location: event.location ?? null,
  instagram: event.instagram ?? null,
  logoUrl: event.logoUrl ?? null,
  description: null,
  catalogueCount: 0,
  createdAt: new Date(0),
}))
