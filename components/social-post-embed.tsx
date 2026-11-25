function getPostEmbed(postUrl: string) {
  try {
    const url = new URL(postUrl)
    const host = url.hostname.toLowerCase().replace(/^www\./, '')
    if (host === 'instagram.com') {
      const match = url.pathname.match(/^\/(p|reel|tv)\/([A-Za-z0-9_-]+)\/?$/)
      if (!match) return null
      const canonicalUrl = `https://www.instagram.com/${match[1]}/${match[2]}/`
      return { platform: 'Instagram', embedUrl: `${canonicalUrl}embed/`, canonicalUrl, height: 'h-[min(720px,80vh)] min-h-[600px]' }
    }
    if (host === 'x.com' || host === 'twitter.com') {
      const match = url.pathname.match(/^\/[^/]+\/status\/(\d+)/)
      if (!match) return null
      const canonicalUrl = `https://x.com/i/status/${match[1]}`
      return { platform: 'X / Twitter', embedUrl: `https://platform.twitter.com/embed/Tweet.html?id=${match[1]}`, canonicalUrl, height: 'h-[600px]' }
    }
    if (host === 'facebook.com' || host === 'm.facebook.com' || host === 'fb.watch' || host === 'fb.com') {
      const canonicalUrl = url.href
      return { platform: 'Facebook', embedUrl: `https://www.facebook.com/plugins/post.php?href=${encodeURIComponent(canonicalUrl)}&show_text=true&width=500`, canonicalUrl, height: 'h-[min(720px,80vh)] min-h-[450px]' }
    }
    if (host === 'drive.google.com') {
      const fileId = url.pathname.match(/^\/file\/d\/([^/]+)/)?.[1] ?? url.searchParams.get('id')
      if (!fileId || !/^[A-Za-z0-9_-]+$/.test(fileId)) return null
      const canonicalUrl = `https://drive.google.com/file/d/${fileId}/view`
      return { platform: 'Google Drive', embedUrl: `https://drive.google.com/file/d/${fileId}/preview`, canonicalUrl, height: 'h-[min(800px,80vh)] min-h-[500px]' }
    }
    if (host === 'docs.google.com') {
      const match = url.pathname.match(/^\/(document|presentation|spreadsheets|forms)\/d\/([^/]+)/)
      if (!match || !/^[A-Za-z0-9_-]+$/.test(match[2])) return null
      const canonicalUrl = `https://docs.google.com/${match[1]}/d/${match[2]}/edit`
      return { platform: 'Google Drive', embedUrl: `https://docs.google.com/${match[1]}/d/${match[2]}/preview`, canonicalUrl, height: 'h-[min(800px,80vh)] min-h-[500px]' }
    }
    return null
  } catch {
    return null
  }
}

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}

export function supportsSocialPostEmbed(postUrl: string) {
  return Boolean(getPostEmbed(postUrl))
}

export function SocialPostEmbed({ postUrl, title }: { postUrl: string; title: string }) {
  const embed = getPostEmbed(postUrl)
  const originalUrl = safeHttpUrl(embed?.canonicalUrl ?? postUrl)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {embed ? (
        <iframe
          src={embed.embedUrl}
          title={title}
          loading="lazy"
          className={`${embed.height} w-full`}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; clipboard-write; web-share"
        />
      ) : (
        <p className="p-5 text-sm text-muted-foreground">This social post link could not be embedded. You can still open the original link below.</p>
      )}
      <p className="border-t border-border px-4 py-3 text-center text-sm">
        {originalUrl ? <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">
          Open the original {embed?.platform ?? 'social media'} post ↗
        </a> : <span className="text-muted-foreground">Original link unavailable</span>}
      </p>
    </div>
  )
}
