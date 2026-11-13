import { describe, it, expect, beforeEach } from 'vitest'
import { handlers } from '@/mocks/handlers'
import db, { DB_STORAGE_KEY, resetDb } from '@/mocks/db'

/**
 * Regression tests for the "can't log in after registering" bug.
 * The mock DB lives at module scope, so a reload used to re-seed it and throw
 * away newly registered accounts. Writes are now snapshotted to localStorage.
 */

const byPath = (method, path) =>
  handlers.find((h) => h.info.method === method && String(h.info.path).endsWith(`/api${path}`))

const call = async (method, path, body) => {
  const handler = byPath(method, path)
  const request = new Request(`http://localhost/api${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const res = await handler.resolver({ request, params: {}, cookies: {} })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  return { status: res.status, data }
}

const CREDS = { name: 'Rakib Hasan', email: 'rakib@example.com', password: 'secret123' }

describe('mock auth persistence', () => {
  beforeEach(() => resetDb())

  it('registers a user and logs in with the same credentials', async () => {
    const reg = await call('POST', '/auth/register', CREDS)
    expect(reg.status).toBe(200)

    const login = await call('POST', '/auth/login', {
      email: CREDS.email,
      password: CREDS.password,
    })
    expect(login.status).toBe(200)
    expect(login.data.user.email).toBe(CREDS.email)
  })

  it('writes the new account to localStorage so it survives a reload', async () => {
    await call('POST', '/auth/register', CREDS)

    const raw = window.localStorage.getItem(DB_STORAGE_KEY)
    expect(raw).toBeTruthy()
    expect(JSON.parse(raw).users.some((u) => u.email === CREDS.email)).toBe(true)
  })

  it('a fresh module instance hydrates the account from storage', async () => {
    await call('POST', '/auth/register', CREDS)

    // A reload re-evaluates db.js from scratch and hydrates from localStorage.
    // Verified via the exported loader rather than a cache-busted dynamic import.
    const { loadSnapshotUsers } = await import('@/mocks/db')
    const users = loadSnapshotUsers()
    expect(users.some((u) => u.email === CREDS.email)).toBe(true)
  })

  it('rejects a wrong password', async () => {
    await call('POST', '/auth/register', CREDS)
    const login = await call('POST', '/auth/login', {
      email: CREDS.email,
      password: 'wrong-password',
    })
    expect(login.status).toBe(401)
  })

  it('reports an unknown email as userNotFound', async () => {
    const login = await call('POST', '/auth/login', {
      email: 'nobody@example.com',
      password: 'secret123',
    })
    expect(login.status).toBe(404)
  })

  it('matches emails case-insensitively and trims whitespace', async () => {
    await call('POST', '/auth/register', { ...CREDS, email: '  MixedCase@Example.com ' })
    const login = await call('POST', '/auth/login', {
      email: 'mixedcase@example.com',
      password: CREDS.password,
    })
    expect(login.status).toBe(200)
  })

  it('blocks a duplicate registration regardless of email casing', async () => {
    await call('POST', '/auth/register', CREDS)
    const again = await call('POST', '/auth/register', {
      ...CREDS,
      email: CREDS.email.toUpperCase(),
    })
    expect(again.status).toBe(409)
  })

  it('keeps the built-in demo accounts usable', () => {
    expect(db.users.some((u) => u.email === 'student@example.com')).toBe(true)
    expect(db.users.some((u) => u.email === 'admin@example.com')).toBe(true)
  })
})
