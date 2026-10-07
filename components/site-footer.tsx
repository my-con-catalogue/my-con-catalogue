import Link from 'next/link'
import { InstagramIcon } from '@/components/social-icons'
import { MessageCircle, Globe2 } from 'lucide-react'

const footerLinks = [
  { href: '/about', label: 'About' },
  { href: '/events', label: 'Events' },
  { href: '/fan-cafes', label: 'Fan Cafes' },
  { href: '/artists', label: 'Artists' },
  { href: '/contact', label: 'Contact' },
  { href: '/disclaimer', label: 'Disclaimer' },
]

const socials = [
  { href: 'https://www.instagram.com/my_concatalogue/', label: 'Instagram', Icon: InstagramIcon },
  { href: 'https://discord.gg/F5nT5nxW3e', label: 'Discord', Icon: MessageCircle },
  { href: '#', label: 'Website (coming soon)', Icon: Globe2 },
]

export function SiteFooter() {
  return (
    <footer className="mt-16 bg-foreground text-background">
      <div className="mx-auto flex max-w-6xl flex-col gap-10 px-4 py-12 md:flex-row md:justify-between">
        <div className="max-w-sm">
          <p className="font-heading text-xl font-bold">Malaysia Convention Catalogue</p>
          <p className="mt-2 text-sm leading-relaxed text-background/70">
            A community archive of artist alley catalogues from anime conventions across Malaysia. Run by
            fans, for fans — @my_concatalogue.
          </p>
        </div>

        <nav aria-label="Footer">
          <p className="text-xs font-semibold uppercase tracking-wider text-background/60">Explore</p>
          <ul className="mt-3 grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            {footerLinks.map((link) => (
              <li key={link.href}>
                <Link href={link.href} className="hover:text-accent">
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>

        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-background/60">Follow us</p>
          <ul className="mt-3 flex gap-2">
            {socials.map(({ href, label, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target={href.startsWith('https:') ? '_blank' : undefined}
                  rel={href.startsWith('https:') ? 'noopener noreferrer' : undefined}
                  title={label}
                  className="flex size-10 items-center justify-center rounded-full border border-background/20 transition-colors hover:border-accent hover:bg-accent hover:text-accent-foreground"
                >
                  <Icon className="size-4" />
                  <span className="sr-only">{label}</span>
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="border-t border-background/10">
        <p className="mx-auto max-w-6xl px-4 py-4 text-xs text-background/60">
          {'© '}
          {new Date().getFullYear()} Malaysia Convention Catalogue. All artwork belongs to its respective
          artists.
        </p>
      </div>
    </footer>
  )
}
