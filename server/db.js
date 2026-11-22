/**
 * Postgres (Neon) connection for the server side.
 *
 * The URL comes from .env — `DATABASE_URL` or `Database_URL` (the existing .env
 * spells it with capitals, dotenv trims the spaces around `=`, so both work).
 * It is read here only, never through Vite, so the credentials never reach the
 * browser bundle. Everything else in the app is unaffected: if no URL is set
 * the pool is simply not created and `isConfigured()` returns false.
 *
 *   import { query, healthCheck, close } from './db.js'
 *   await query('select 1 as ok')
 */
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const rawUrl = (process.env.DATABASE_URL || process.env.Database_URL || '').trim().replace(/^["']+|["']+$/g, '')

/**
 * Neon hands out `?sslmode=require&channel_binding=require`. `channel_binding`
 * is a libpq/psql option: node-postgres would pass it straight through and the
 * server rejects the startup packet. `sslmode` is handled below by the `ssl`
 * option instead, which also silences pg's "sslmode=require is an alias for
 * verify-full" warning. Both are stripped here.
 */
function cleanUrl(url) {
  try {
    const u = new URL(url)
    u.searchParams.delete('channel_binding')
    u.searchParams.delete('sslmode')
    return u.toString()
  } catch {
    return url
  }
}

// Neon (like every hosted Postgres) needs TLS. Plain localhost does not.
const wantsSsl =
  /sslmode=(require|verify-ca|verify-full)/.test(rawUrl) || !/localhost|127\.0\.0\.1/.test(rawUrl)

let pool = null

export const isConfigured = () => Boolean(rawUrl)

/** Lazily created pool — nothing connects until the first query. */
export function getPool() {
  if (!rawUrl) throw new Error('Missing DATABASE_URL (or Database_URL) in .env')
  if (!pool) {
    pool = new Pool({
      connectionString: cleanUrl(rawUrl),
      // Neon's pooler serves a provider-managed certificate, so verification of
      // the CA bundle is skipped (same as sslmode=require). Traffic stays TLS.
      ssl: wantsSsl ? { rejectUnauthorized: false } : undefined,
      max: Number(process.env.DATABASE_POOL_MAX) || 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: Number(process.env.DATABASE_TIMEOUT_MS) || 10_000,
    })
    // An idle client dropped by the server (Neon suspends) must not crash node.
    pool.on('error', (err) => console.error('Postgres pool error:', err.message))
  }
  return pool
}

/** Run one parameterised query. */
export async function query(text, params) {
  return getPool().query(text, params)
}

/** One-shot connectivity check for /health and `npm run db:check`. */
export async function healthCheck() {
  if (!rawUrl) return { ok: false, configured: false, error: 'DATABASE_URL not set' }
  const started = Date.now()
  try {
    const { rows } = await getPool().query(
      "select current_database() as db, current_user as usr, version() as version, now() as at"
    )
    const r = rows[0] || {}
    return {
      ok: true,
      configured: true,
      database: r.db,
      user: r.usr,
      version: String(r.version || '').split(',')[0],
      serverTime: r.at,
      latencyMs: Date.now() - started,
    }
  } catch (e) {
    return { ok: false, configured: true, error: e.message, code: e.code, latencyMs: Date.now() - started }
  }
}

/** Close the pool (server shutdown, tests). */
export async function close() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
