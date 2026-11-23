/**
 * Seed `professors` from server/db/seed/professors.json (repaired from the
 * truncated professor.json). Idempotent: rows are matched on
 * (university, name) and skipped when already present.
 *
 *   node scripts/seed-professors.mjs
 */
import { randomUUID } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { eq } from 'drizzle-orm'
import { db, hasDatabase } from '../server/db/index.js'
import { professors } from '../server/db/schema.js'

if (!hasDatabase) {
  console.error('DATABASE_URL missing')
  process.exit(1)
}

const seed = JSON.parse(
  readFileSync(new URL('../server/db/seed/professors.json', import.meta.url), 'utf8')
)

let inserted = 0
let skipped = 0

for (const block of seed.universities) {
  const rows = await db
    .select({ name: professors.name })
    .from(professors)
    .where(eq(professors.university, block.university))
  const have = new Set(rows.map((r) => r.name))

  for (const f of block.faculty) {
    if (have.has(f.name)) {
      skipped += 1
      continue
    }

    await db.insert(professors).values({
      id: `p-${randomUUID()}`,
      university: block.university,
      country: block.location?.country ?? null,
      city: block.location?.city ?? null,
      universityRank: block.rank_qs_2027 ?? null,
      universityWebsite: block.website ?? null,
      facultyDirectory: block.faculty_directory ?? null,
      name: f.name,
      title: f.title ?? null,
      email: f.email ?? null,
      emailStatus: f.email_status ?? null,
      department: f.department ?? null,
      researchFields: f.research_fields ?? [],
      profileUrl: f.profile_url ?? null,
    })
    inserted += 1
    have.add(f.name)
  }
}

console.log(`seeded: ${inserted} inserted, ${skipped} already present`)
process.exit()
