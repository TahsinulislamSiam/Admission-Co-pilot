/**
 * In-memory "database" for MSW handlers. Mutated by POST/PATCH/DELETE calls so
 * the whole app behaves like a real backend during development.
 */
import { seedUsers } from './seed/users'
import { publicUniversities } from './seed/publicUniversities'
import { privateUniversities } from './seed/privateUniversities'
import { questionReviews } from './seed/questions'
import { tests, attempts } from './seed/tests'
import { circulars } from './seed/circulars'

/**
 * localStorage key for the mock DB snapshot.
 *
 * The "database" below is created at module scope, so a page reload (or a Vite
 * HMR update) rebuilt it from seed data and silently discarded every write —
 * including accounts created via /auth/register. That made a freshly registered
 * user impossible to log in with after a refresh. We now snapshot the mutable
 * tables to localStorage and hydrate them on boot so writes survive reloads.
 */
export const DB_STORAGE_KEY = 'acbd-mock-db'

const seedSnapshot = () => ({
  users: JSON.parse(JSON.stringify(seedUsers)),
  publicUniversities: JSON.parse(JSON.stringify(publicUniversities)),
  privateUniversities: JSON.parse(JSON.stringify(privateUniversities)),
  questionReviews: JSON.parse(JSON.stringify(questionReviews)),
  tests: JSON.parse(JSON.stringify(tests)),
  attempts: JSON.parse(JSON.stringify(attempts)),
  circulars: JSON.parse(JSON.stringify(circulars)),
})

const hasStorage = () => typeof window !== 'undefined' && !!window.localStorage

/** Read the persisted snapshot, falling back to seed data. */
const loadSnapshot = () => {
  const seeded = seedSnapshot()
  if (!hasStorage()) return seeded
  try {
    const raw = window.localStorage.getItem(DB_STORAGE_KEY)
    if (!raw) return seeded
    const saved = JSON.parse(raw)
    // Shallow-merge so new seed fields still appear for older snapshots.
    return { ...seeded, ...saved }
  } catch {
    return seeded
  }
}

/** Users as they would be loaded by a fresh page load (used in tests). */
export const loadSnapshotUsers = () => loadSnapshot().users ?? []

const db = loadSnapshot()

/**
 * Persist the mutable tables. Call after any write in a handler.
 * `tests`/`questionReviews`/etc. are included so admin edits also stick.
 */
export const persistDb = () => {
  if (!hasStorage()) return
  try {
    window.localStorage.setItem(DB_STORAGE_KEY, JSON.stringify(db))
  } catch {
    // Quota or private-mode failure — the mock keeps working in memory.
  }
}

/** Drop the snapshot and restore seed data (useful from the console). */
export const resetDb = () => {
  const seeded = seedSnapshot()
  Object.keys(db).forEach((key) => {
    db[key] = seeded[key]
  })
  nextAttempt = attempts.length + 1
  if (hasStorage()) window.localStorage.removeItem(DB_STORAGE_KEY)
  return db
}

if (typeof window !== 'undefined') window.__resetMockDb = resetDb

let nextAttempt = Math.max(attempts.length, db.attempts?.length ?? 0) + 1
export const createAttemptId = () => `attempt-${nextAttempt++}`

export default db
