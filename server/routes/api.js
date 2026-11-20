/**
 * Database-backed API: auth, profile and universities. Same paths and response
 * shapes as the MSW mocks in src/mocks/handlers.js, so the UI needs no changes.
 */
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { randomBytes, randomUUID } from 'node:crypto'
import { and, eq } from 'drizzle-orm'
import { db, schema } from '../db/index.js'

const { users, sessions, universities } = schema
const router = Router()

const fail = (res, status, message) => res.status(status).json({ message })
const normalizeEmail = (v) => String(v ?? '').trim().toLowerCase()

const publicUser = (u) => ({
  id: u.id,
  name: u.name,
  nameEn: u.nameEn,
  email: u.email,
  role: u.role,
  createdAt: u.createdAt,
  profile: u.profile,
})

async function startSession(user) {
  const token = randomBytes(32).toString('hex')
  await db.insert(sessions).values({ token, userId: user.id })
  return { user: publicUser(user), token }
}

/** Attach req.user from the bearer token, or leave it undefined. */
async function loadUser(req) {
  const token = (req.headers.authorization || '').replace(/^Bearer\s+/i, '')
  if (!token) return null
  const [row] = await db
    .select({ user: users })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.token, token))
  return row?.user ?? null
}

const requireUser = (admin) => async (req, res, next) => {
  req.user = await loadUser(req)
  if (!req.user) return fail(res, 401, 'unauthorized')
  if (admin && req.user.role !== 'admin') return fail(res, 403, 'forbidden')
  return next()
}

// Express 5 forwards rejected promises to the error handler, so no try/catch.

// ------------------------------------------------------------------ auth
router.post('/auth/login', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const [user] = await db.select().from(users).where(eq(users.email, email))
  if (!user) return fail(res, 404, 'userNotFound')
  if (!bcrypt.compareSync(String(req.body?.password ?? ''), user.passwordHash)) {
    return fail(res, 401, 'invalidCredentials')
  }
  res.json(await startSession(user))
})

router.post('/auth/register', async (req, res) => {
  const body = req.body ?? {}
  const email = normalizeEmail(body.email)
  if (!email) return fail(res, 400, 'emailRequired')
  if (!body.password || String(body.password).length < 6) return fail(res, 400, 'passwordTooShort')
  const [exists] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (exists) return fail(res, 409, 'emailExists')

  const [user] = await db
    .insert(users)
    .values({
      id: `u-${randomUUID()}`,
      email,
      name: body.name || email,
      nameEn: body.name || email,
      passwordHash: bcrypt.hashSync(String(body.password), 10),
      role: 'student',
      profile: {
        sscGpa: body.sscGpa ?? null,
        hscGpa: body.hscGpa ?? null,
        group: body.group ?? null,
        budget: null,
        preferredSubjects: [],
        preferredCities: [],
        needsHostel: false,
        phone: '',
      },
    })
    .returning()
  res.json(await startSession(user))
})

router.post('/auth/forgot-password', async (req, res) => {
  const email = normalizeEmail(req.body?.email)
  const [user] = await db.select({ id: users.id }).from(users).where(eq(users.email, email))
  if (!user) return fail(res, 404, 'userNotFound')
  res.json({ sent: true })
})

router.get('/auth/me', requireUser(false), (req, res) => res.json(publicUser(req.user)))

router.patch('/users/me/profile', requireUser(false), async (req, res) => {
  const body = req.body ?? {}
  const { name, ...profile } = body
  const [user] = await db
    .update(users)
    .set({
      profile: { ...(req.user.profile ?? {}), ...profile },
      ...(name ? { name } : {}),
    })
    .where(eq(users.id, req.user.id))
    .returning()
  res.json(publicUser(user))
})

// ------------------------------------------------------------ universities
const list = (type) => async (req, res) => {
  const all = req.query.includeUnpublished === 'true'
  const rows = await db
    .select()
    .from(universities)
    .where(all ? eq(universities.type, type) : and(eq(universities.type, type), eq(universities.published, true)))
  res.json(rows.map((r) => ({ ...r.data, published: r.published })))
}

const one = (type) => async (req, res) => {
  const [r] = await db
    .select()
    .from(universities)
    .where(and(eq(universities.id, req.params.id), eq(universities.type, type)))
  if (!r || !r.published) return fail(res, 404, 'notFound')
  res.json({ ...r.data, published: r.published })
}

router.get('/universities/public', list('public'))
router.get('/universities/private', list('private'))
router.get('/universities/public/:id', one('public'))
router.get('/universities/private/:id', one('private'))

router.post('/admin/universities', requireUser(true), async (req, res) => {
  const b = req.body ?? {}
  if (!b.nameEn || !['public', 'private'].includes(b.type)) return fail(res, 400, 'invalidInput')
  const record = {
    id: `${b.type}-new-${Date.now()}`,
    name: { en: b.nameEn, bn: b.nameBn || b.nameEn },
    shortName: { en: b.nameEn, bn: b.nameBn || b.nameEn },
    city: { en: b.city || 'Dhaka', bn: b.city || 'ঢাকা' },
    type: b.type,
    established: Number(b.established) || 2020,
    published: Boolean(b.published),
    website: b.website || '',
    sourceUrl: b.sourceUrl || '',
    lastVerified: new Date().toISOString().slice(0, 10),
    units: [],
    departments: [],
    applicationFee: Number(b.applicationFee) || 0,
    seatsTotal: 0,
    groups: b.groups || [],
    minSscGpa: Number(b.minSscGpa) || 0,
    minHscGpa: Number(b.minHscGpa) || 0,
    deadline: b.deadline || null,
    examDate: b.examDate || null,
    examPattern: b.examPattern || 'MCQ',
    admissionDeadline: b.deadline || null,
    admissionFee: Number(b.applicationFee) || 0,
  }
  await db.insert(universities).values({
    id: record.id,
    type: record.type,
    published: record.published,
    data: record,
  })
  res.json(record)
})

router.patch('/admin/universities/:id', requireUser(true), async (req, res) => {
  const [r] = await db.select().from(universities).where(eq(universities.id, req.params.id))
  if (!r) return fail(res, 404, 'notFound')
  const b = req.body ?? {}
  const rec = { ...r.data }
  if (b.nameEn) rec.name = { ...rec.name, en: b.nameEn }
  if (b.nameBn) rec.name = { ...rec.name, bn: b.nameBn }
  if (b.city) rec.city = { en: b.city, bn: b.city }
  if (b.website !== undefined) rec.website = b.website
  if (b.sourceUrl !== undefined) rec.sourceUrl = b.sourceUrl
  if (b.lastVerified !== undefined) rec.lastVerified = b.lastVerified
  if (b.established !== undefined) rec.established = Number(b.established)
  const published = b.published !== undefined ? Boolean(b.published) : r.published
  const type = b.type ?? r.type
  rec.published = published
  rec.type = type
  await db
    .update(universities)
    .set({ data: rec, published, type, updatedAt: new Date() })
    .where(eq(universities.id, r.id))
  res.json(rec)
})

router.delete('/admin/universities/:id', requireUser(true), async (req, res) => {
  const deleted = await db
    .delete(universities)
    .where(eq(universities.id, req.params.id))
    .returning({ id: universities.id })
  if (!deleted.length) return fail(res, 404, 'notFound')
  res.json({ deleted: true })
})

export default router
