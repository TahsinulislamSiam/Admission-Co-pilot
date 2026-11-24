/**
 * Read-only terminal view of the Postgres data.
 *
 *   npm run db:tables                list tables with row counts
 *   npm run db:tables -- users 20    show 20 rows of one table
 *
 * Only SELECTs are ever sent, so this cannot change your data.
 */
import { query, close } from '../server/db.js'

const [table, limitArg] = process.argv.slice(2)
const limit = Math.min(Math.max(Number(limitArg) || 15, 1), 200)

/** Short cell: JSON folded to one line so rows stay readable. */
const cell = (v) => {
  if (v === null || v === undefined) return ''
  const s = typeof v === 'object' ? JSON.stringify(v) : String(v)
  return s.length > 60 ? `${s.slice(0, 57)}...` : s
}

try {
  if (!table) {
    const { rows } = await query(
      `select c.table_name, c.column_name
         from information_schema.columns c
        where c.table_schema = 'public'
        order by c.table_name, c.ordinal_position`
    )
    const byTable = new Map()
    for (const r of rows) {
      if (!byTable.has(r.table_name)) byTable.set(r.table_name, [])
      byTable.get(r.table_name).push(r.column_name)
    }
    console.log('Postgres (public schema)\n')
    for (const [name, cols] of byTable) {
      const { rows: c } = await query(`select count(*)::int as n from "${name}"`)
      console.log(`  ${name.padEnd(14)} ${String(c[0].n).padStart(4)} rows   ${cols.join(', ').slice(0, 70)}`)
    }
    console.log('\nShow rows:  npm run db:tables -- users 20')
  } else {
    // Table name is validated against the catalogue, never interpolated blindly.
    const ok = await query(
      'select 1 from information_schema.tables where table_schema = $1 and table_name = $2',
      ['public', table]
    )
    if (!ok.rowCount) {
      console.error(`No table "${table}" in the public schema. Run: npm run db:tables`)
      process.exit(1)
    }
    const { rows } = await query(`select * from "${table}" limit $1`, [limit])
    if (!rows.length) console.log(`"${table}" has no rows.`)
    else console.table(rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, cell(v)]))))
  }
} catch (e) {
  console.error('Query failed:', e.message)
  process.exitCode = 1
} finally {
  await close()
}
