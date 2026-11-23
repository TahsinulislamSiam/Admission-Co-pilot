/** List Postgres tables through the project's Neon connection. */
import { sql } from 'drizzle-orm'
import { db, hasDatabase, pingDatabase } from '../server/db/index.js'

if (!hasDatabase) {
  console.error('DATABASE_URL missing')
  process.exit(1)
}

try {
  console.log('ping:', await pingDatabase())
  const res = await db.execute(sql`
    select table_name from information_schema.tables
    where table_schema = 'public' order by 1`)
  const names = (res.rows ?? res).map((r) => r.table_name)
  console.log('tables:', names.join(', '))
  console.log('professors table:', names.includes('professors') ? 'yes' : 'no')
} catch (err) {
  console.error('failed:', err.message)
  process.exitCode = 1
} finally {
  process.exit()
}
