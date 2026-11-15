/**
 * Regression test: a localStorage snapshot written from OLD seed data must not
 * shadow the current seed. Before the version check, `{ ...seeded, ...saved }`
 * let stale rows win, so newly added universities/departments never appeared
 * and the UI kept showing the previous counts.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'

const loadDb = async () => {
  const mod = await import('@/mocks/db')
  return mod.default
}

describe('mock db seed versioning', () => {
  beforeEach(() => {
    window.localStorage.clear()
    vi.resetModules()
  })

  it('refreshes seeded tables but keeps registered users on a version bump', async () => {
    const { privateUniversities } = await import('@/mocks/seed/privateUniversities')
    const expected = privateUniversities.reduce((n, u) => n + u.departments.length, 0)

    // Simulate what an older build wrote: no __seedVersion, fewer departments,
    // plus a real account the student registered.
    const stale = {
      users: [
        { id: 'u1', email: 'student@example.com', password: 'password123', token: 't1' },
        { id: 'u9', email: 'myname@gmail.com', password: 'mypass123', token: 't9' },
      ],
      privateUniversities: [
        { id: 'nsu', name: { en: 'North South University' }, departments: [{ id: 'nsu-cse' }] },
      ],
    }
    window.localStorage.setItem('acbd-mock-db', JSON.stringify(stale))

    const db = await loadDb()
    const total = db.privateUniversities.reduce((n, u) => n + u.departments.length, 0)

    // Seed data is fresh...
    expect(db.privateUniversities).toHaveLength(10)
    expect(total).toBe(expected)
    expect(total).toBeGreaterThan(9)

    // ...but the registered account MUST survive, or login breaks.
    const account = db.users.find((u) => u.email === 'myname@gmail.com')
    expect(account).toBeTruthy()
    expect(account.password).toBe('mypass123')
  })

  it('still honours a snapshot stamped with the current seed version', async () => {
    // Import the version, then reset modules so the db is instantiated fresh
    // against the snapshot we are about to write.
    const { SEED_VERSION } = await import('@/mocks/db')
    const fresh = {
      __seedVersion: SEED_VERSION,
      users: [{ id: 'u1', email: 'kept@example.com' }],
    }
    window.localStorage.setItem('acbd-mock-db', JSON.stringify(fresh))
    vi.resetModules()

    const db = await loadDb()
    expect(db.users.some((u) => u.email === 'kept@example.com')).toBe(true)
  })
})
