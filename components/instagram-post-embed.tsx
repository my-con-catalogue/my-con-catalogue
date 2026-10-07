function instagramPostLinks(postUrl: string) {
  try {
    const url = new URL(postUrl)
    if (!['instagram.com', 'www.instagram.com'].includes(url.hostname)) return null
    const match = url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?$/)
    if (!match) return null
    const canonicalUrl = `https://www.instagram.com/${match[1]}/${match[2]}/`
    return { embedUrl: `${canonicalUrl}embed/`, canonicalUrl }
  } catch {
    return null
  }
}

export function InstagramPostEmbed({ postUrl, title }: { postUrl: string; title: string }) {
  const links = instagramPostLinks(postUrl)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {links ? (
        <iframe
          src={links.embedUrl}
          title={title}
          loading="lazy"
          className="h-[min(720px,80vh)] min-h-[600px] w-full"
          referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; clipboard-write; web-share"
        />
      ) : (
        <p className="p-5 text-sm text-muted-foreground">Instagram post link could not be embedded.</p>
      )}
      <p className="border-t border-border px-4 py-3 text-center text-sm">
        {links ? (
          <a href={links.canonicalUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">
            Open the original Instagram post ↗
          </a>
        ) : 'Check the provided Instagram URL.'}
      </p>
    </div>
  )
}
