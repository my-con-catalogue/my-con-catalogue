'use client'

import { useState } from 'react'
import { getPostEmbed } from '@/lib/social-post-embed-utils'
export { supportsSocialPostEmbed } from '@/lib/social-post-embed-utils'


function safeHttpUrl(value: string) {
  try {
    const url = new URL(value)
    return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : null
  } catch {
    return null
  }
}


export function SocialPostEmbed({ postUrl, title, compact = false }: { postUrl: string; title: string; compact?: boolean }) {
  const embed = getPostEmbed(postUrl)
  const originalUrl = safeHttpUrl(embed?.canonicalUrl ?? postUrl)
  const [failed, setFailed] = useState(false)
  return (
    <div className="overflow-hidden rounded-xl border border-border bg-white">
      {embed && !failed ? (
        <iframe
          src={embed.embedUrl}
          title={title}
          loading="lazy"
          className={`${compact ? 'h-[360px]' : embed.height} w-full`}
          referrerPolicy="strict-origin-when-cross-origin"
          allow="encrypted-media; clipboard-write; web-share"
          onError={() => setFailed(true)}
        />
      ) : (
        <p className="p-5 text-sm text-muted-foreground">Preview not available. You can still open the original link below.</p>
      )}
      <p className="border-t border-border px-4 py-3 text-center text-sm">
        {originalUrl ? <a href={originalUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-primary underline underline-offset-4">
          Open the original {embed?.platform ?? 'social media'} post ↗
        </a> : <span className="text-muted-foreground">Original link unavailable</span>}
      </p>
    </div>
  )
}
