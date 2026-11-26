import type { MetadataRoute } from 'next'

/**
 * Ask AI training crawlers not to fetch catalogue pages and artist artwork.
 * These are crawler preferences, not access controls; hostile bots can ignore them.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Emerging shared AI training preference signal; retain provider-specific rules below.
      { userAgent: '__usage_ai-training', disallow: '/' },
      // Training crawlers. Search and social preview crawlers remain separate and available.
      { userAgent: 'GPTBot', disallow: '/' },
      { userAgent: 'Google-Extended', disallow: '/' },
      { userAgent: 'ClaudeBot', disallow: '/' },
      { userAgent: 'CCBot', disallow: '/' },
      { userAgent: 'Bytespider', disallow: '/' },
      { userAgent: 'Meta-ExternalAgent', disallow: '/' },
      { userAgent: 'Applebot-Extended', disallow: '/' },
      { userAgent: 'cohere-ai', disallow: '/' },
      // Keep normal web search and link preview behavior available.
      { userAgent: '*', allow: '/' },
    ],
  }
}
