import { FacebookIcon, InstagramIcon, XIcon } from '@/components/social-icons'
import { getArtistSocialAccounts } from '@/lib/artist-socials'

function PlatformIcon({ platform, className }: { platform: string; className: string }) {
  if (platform === 'Instagram') return <InstagramIcon className={className} />
  if (platform === 'X') return <XIcon className={className} />
  if (platform === 'Facebook') return <FacebookIcon className={className} />
  return <span className={`inline-flex items-center justify-center text-xs font-bold ${className}`}>↗</span>
}

export function ArtistSocialLinks({
  name,
  instagrams,
  links = [],
  className = '',
  linkClassName = 'inline-flex min-w-0 items-center gap-1.5 truncate text-sm text-muted-foreground hover:text-primary',
  iconClassName = 'size-4 shrink-0',
}: {
  name: string
  instagrams: readonly string[]
  links?: readonly string[]
  className?: string
  linkClassName?: string
  iconClassName?: string
}) {
  const accounts = getArtistSocialAccounts(instagrams, links)
  if (accounts.length === 0) return null
  return (
    <ul aria-label={`${name} social media accounts`} className={className}>
      {accounts.map((account) => (
        <li key={account.href} className="min-w-0">
          <a href={account.href} target="_blank" rel="noopener noreferrer" aria-label={`${name} on ${account.platform}: ${account.label}`} className={linkClassName}>
            <PlatformIcon platform={account.platform} className={iconClassName} />
            <span className="truncate">{account.label}</span>
            <span className="sr-only">({account.platform})</span>
          </a>
        </li>
      ))}
    </ul>
  )
}
