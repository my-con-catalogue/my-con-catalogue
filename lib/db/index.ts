import { drizzle } from 'drizzle-orm/node-postgres'
import { Pool } from 'pg'
import * as schema from './schema'

const globalForDb = globalThis as unknown as { pool?: Pool }

export const pool =
  globalForDb.pool ?? new Pool({
    connectionString: process.env.DATABASE_URL,
    // Keep each Vercel serverless instance lightweight when using Supabase's pooler.
    max: 1,
    idleTimeoutMillis: 10_000,
    connectionTimeoutMillis: 10_000,
  })

if (process.env.NODE_ENV !== 'production') globalForDb.pool = pool

export const db = drizzle(pool, { schema })
