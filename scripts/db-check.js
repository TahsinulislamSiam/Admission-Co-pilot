/**
 * Standalone Postgres connectivity check.
 *
 *   npm run db:check
 *
 * Reads DATABASE_URL / Database_URL from .env, connects, prints database,
 * user, server time and latency, then exits 1 on failure so CI catches it.
 */
import { healthCheck, close } from '../server/db.js'

const res = await healthCheck()

if (res.ok) {
  console.log('Postgres OK')
  console.log(`  database : ${res.database}`)
  console.log(`  user     : ${res.user}`)
  console.log(`  version  : ${res.version}`)
  console.log(`  latency  : ${res.latencyMs}ms`)
} else {
  console.error('Postgres FAILED')
  console.error(`  configured: ${res.configured}`)
  console.error(`  error     : ${res.error}`)
  if (res.code) console.error(`  code      : ${res.code}`)
}

await close()
process.exit(res.ok ? 0 : 1)
