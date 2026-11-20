/** Neon Postgres connection (serverless driver over a WebSocket pool). */
import 'dotenv/config'
import { Pool, neonConfig } from '@neondatabase/serverless'
import { drizzle } from 'drizzle-orm/neon-serverless'
import ws from 'ws'
import * as schema from './schema.js'

neonConfig.webSocketConstructor = ws

export const hasDatabase = Boolean(process.env.DATABASE_URL)

const pool = hasDatabase ? new Pool({ connectionString: process.env.DATABASE_URL }) : null
export const db = pool ? drizzle(pool, { schema }) : null

export async function pingDatabase() {
  if (!pool) return { ok: false, reason: 'DATABASE_URL not set' }
  await pool.query('select 1')
  return { ok: true }
}

export { schema }
