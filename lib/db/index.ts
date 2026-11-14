import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { pool?: Pool }

function databaseConnectionOptions() {
  const connectionString = process.env.POSTGRES_URL ?? process.env.DATABASE_URL
  if (!connectionString) return { connectionString }

  try {
    const url = new URL(connectionString)
    const sslMode = url.searchParams.get('sslmode')?.toLowerCase()
    const isSupabaseHost = url.hostname.endsWith('.supabase.co') || url.hostname.endsWith('.supabase.com')

    // Supabase's sslmode=require means encrypted TLS without CA validation. Some
    // pg-connection-string versions interpret require as verify-full instead, which
    // rejects Supabase's pooler certificate chain in Vercel. Preserve TLS encryption
    // and the documented require behavior for Supabase URLs by setting the pg option
    // explicitly after removing sslmode (which otherwise overrides the ssl option).
    if (isSupabaseHost && sslMode === 'require') {
      url.searchParams.delete('sslmode')
      return {
        connectionString: url.toString(),
        ssl: { rejectUnauthorized: false },
      }
    }
  } catch {
    // Leave malformed or non-URL connection strings to node-postgres to report.
  }

  return { connectionString }
}

export const pool =
  globalForDb.pool ?? new Pool({
    ...databaseConnectionOptions(),
    // Keep each Vercel serverless instance lightweight when using Supabase's pooler.
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export const db = drizzle(pool, { schema })
