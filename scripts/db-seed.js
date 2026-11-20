/**
 * Load the mock seed data into Neon. Idempotent (upserts), safe to re-run.
 *   npm run db:seed
 * Run via vite-node because the seed modules use extensionless imports.
 */
import bcrypt from 'bcryptjs'
import { sql } from 'drizzle-orm'
import { db, schema } from '../server/db/index.js'
import { seedUsers } from '../src/mocks/seed/users'
import { publicUniversities } from '../src/mocks/seed/publicUniversityData'
import { privateUniversities } from '../src/mocks/seed/privateUniversities'
import { questionReviews } from '../src/mocks/seed/questions'
import { tests, attempts } from '../src/mocks/seed/tests'
import { circulars } from '../src/mocks/seed/circulars'

if (!db) {
  console.error('DATABASE_URL is not set in .env')
  process.exit(1)
}

const excluded = (col) => sql.raw(`excluded."${col}"`)

const upsert = async (table, rows, set) => {
  if (rows.length) await db.insert(table).values(rows).onConflictDoUpdate({ target: table.id, set })
}

// users (passwords hashed; the plaintext seed passwords are demo-only)
await db
  .insert(schema.users)
  .values(
    seedUsers.map((u) => ({
      id: u.id,
      email: u.email.toLowerCase(),
      name: u.name,
      nameEn: u.nameEn,
      passwordHash: bcrypt.hashSync(u.password, 10),
      role: u.role,
      profile: u.profile,
      createdAt: new Date(u.createdAt),
    }))
  )
  .onConflictDoNothing()

const uniRows = [
  ...publicUniversities.map((u) => ({ ...u, type: 'public' })),
  ...privateUniversities.map((u) => ({ ...u, type: 'private' })),
].map((u) => ({ id: u.id, type: u.type, published: u.published !== false, data: u }))
await upsert(schema.universities, uniRows, {
  type: excluded('type'),
  published: excluded('published'),
  data: excluded('data'),
})

await upsert(
  schema.questions,
  questionReviews.map((q) => ({ id: q.id, subject: q.subject, status: q.status ?? 'approved', data: q })),
  { subject: excluded('subject'), status: excluded('status'), data: excluded('data') }
)

// tests keep only question ids; the full questions live in the questions table
await upsert(
  schema.tests,
  tests.map(({ questions: _q, ...t }) => ({ id: t.id, data: t })),
  { data: excluded('data') }
)

await db
  .insert(schema.attempts)
  .values(
    attempts.map((a) => ({
      id: a.id,
      userId: a.userId,
      testId: a.testId,
      data: a,
      submittedAt: a.submittedAt ? new Date(a.submittedAt) : null,
    }))
  )
  .onConflictDoNothing()

await upsert(
  schema.circulars,
  circulars.map((c) => ({
    id: c.id,
    universityId: uniRows.some((u) => u.id === c.universityId) ? c.universityId : null,
    status: c.status,
    data: c,
    uploadedAt: new Date(c.uploadedAt),
  })),
  { status: excluded('status'), data: excluded('data') }
)

console.log(
  `Seeded: ${seedUsers.length} users, ${uniRows.length} universities, ${questionReviews.length} questions, ` +
    `${tests.length} tests, ${attempts.length} attempts, ${circulars.length} circulars`
)
process.exit(0)
