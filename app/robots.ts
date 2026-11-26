import type { MetadataRoute } from 'next'

/**
 * Signal that this site and its artist artwork should not be fetched for AI
 * training, assistant answers, AI search, or agent browsing. These directives
 * are requests to cooperative crawlers, not access controls. Use Vercel Firewall
 * AI Bots rules to enforce the same preference at the edge.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Emerging shared opt-out for foundational AI training.
      { userAgent: '__usage_ai-training', disallow: '/' },

      // AI crawlers and training / dataset agents.
      {
        userAgent: [
          'GPTBot',
          'Google-Extended',
          'ClaudeBot',
          'CCBot',
          'Bytespider',
          'Meta-ExternalAgent',
          'FacebookBot',
          'Applebot-Extended',
          'cohere-ai',
          'Amazonbot',
        ],
        disallow: '/',
      },

      // AI assistants, AI search fetchers, and user-requested agent browsing.
      {
        userAgent: [
          'OAI-SearchBot',
          'ChatGPT-User',
          'ChatGPT-Operator',
          'GPT-Actions',
          'Claude-SearchBot',
          'Claude-User',
          'PerplexityBot',
          'Perplexity-User',
          'DuckAssistBot',
          'Gemini-Deep-Research',
          'Google-Agent',
          'Google-CloudVertexBot',
          'MistralAI-Index',
          'MistralAI-User',
          'ExaUser',
          'Cursor-Server',
        ],
        disallow: '/',
      },

      // Traditional search and social link previews remain available.
      { userAgent: '*', allow: '/' },
    ],
  }
}
