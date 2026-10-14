import { instagramUrl } from '@/lib/format'

export type ArtistSocialAccount = {
  platform: 'Instagram' | 'X' | 'Facebook' | 'Website'
  href: string
  label: string
}

function accountFromUrl(value: string): ArtistSocialAccount | null {
  try {
    const url = new URL(value.trim())
    if (url.protocol !== 'https:' && url.protocol !== 'http:') return null
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    const segments = url.pathname.split('/').filter(Boolean)
    if (host === 'instagram.com' || host === 'threads.net') {
      const handle = segments[0]?.replace(/^@/, '')
      return { platform: 'Instagram', href: url.href, label: handle ? `@${handle}` : 'Instagram profile' }
    }
    if (host === 'x.com' || host === 'twitter.com') {
      const handle = segments[0]?.replace(/^@/, '')
      return { platform: 'X', href: url.href, label: handle ? `@${handle}` : 'X / Twitter profile' }
    }
    if (host === 'facebook.com' || host === 'fb.com' || host === 'm.facebook.com') {
      return { platform: 'Facebook', href: url.href, label: segments[0] ? `facebook.com/${segments[0]}` : 'Facebook profile' }
    }
    return { platform: 'Website', href: url.href, label: host }
  } catch {
    return null
  }
}

export function getArtistSocialAccounts(instagrams: readonly string[], links: readonly string[] = []) {
  const accounts = [
    ...instagrams.map((handle) => {
      const clean = handle.trim().replace(/^@/, '')
      return clean ? { platform: 'Instagram' as const, href: instagramUrl(clean), label: `@${clean}` } : null
    }).filter((account): account is ArtistSocialAccount => account !== null),
    ...links.map(accountFromUrl).filter((account): account is ArtistSocialAccount => account !== null),
  ]
  const seen = new Set<string>()
  return accounts.filter((account) => {
    const key = account.href.replace(/\/$/, '').toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
