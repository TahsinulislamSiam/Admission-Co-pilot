/**
 * MSW request handlers — the entire "backend" of the demo.
 * Swap for a real API later without touching the UI: services keep the same paths.
 */
import { http, HttpResponse, delay } from 'msw'
import db, { createAttemptId, persistDb } from './db'
import { buildResult, buildDashboardAnalytics } from './engine/analysis'
import { buildRecommendations } from './engine/recommendations'
import { knowledgeBase, suggestedQuestions } from './seed/assistant'
import { ASSISTANT_TIMEOUT_MS } from '@/lib/constants'
import { publicUser } from './seed/users'

/** Emails are matched case-insensitively and trimmed, like a real backend. */
const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase()

const ok = (data) => HttpResponse.json(data)
const fail = (status, message, code) =>
  HttpResponse.json({ message, code }, { status })

/** Validate bearer token on protected endpoints. */
const authUser = (request) => {
  const header = request.headers.get('Authorization') || ''
  const token = header.replace('Bearer ', '')
  return db.users.find((u) => u.token === token) || null
}

// ---------------------------------------------------------------- auth
export const authHandlers = [
  http.post('/api/auth/login', async ({ request }) => {
    await delay(600)
    const body = await request.json()
    const email = normalizeEmail(body.email)
    const user = db.users.find((u) => normalizeEmail(u.email) === email)
    if (!user) return fail(404, 'userNotFound')
    if (user.password !== body.password) return fail(401, 'invalidCredentials')
    return ok({ user: publicUser(user), token: user.token })
  }),

  http.post('/api/auth/register', async ({ request }) => {
    await delay(700)
    const body = await request.json()
    const email = normalizeEmail(body.email)
    if (!email) return fail(400, 'emailRequired')
    if (db.users.some((u) => normalizeEmail(u.email) === email)) return fail(409, 'emailExists')
    const user = {
      id: `u${db.users.length + 1}`,
      name: body.name,
      nameEn: body.name,
      email,
      password: body.password,
      role: 'student',
      token: `mock-jwt-u${db.users.length + 1}`,
      createdAt: new Date().toISOString(),
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
    }
    db.users.push(user)
    persistDb()
    return ok({ user: publicUser(user), token: user.token })
  }),

  http.post('/api/auth/forgot-password', async ({ request }) => {
    await delay(500)
    const body = await request.json()
    const user = db.users.find((u) => normalizeEmail(u.email) === normalizeEmail(body.email))
    if (!user) return fail(404, 'userNotFound')
    return ok({ sent: true })
  }),

  http.get('/api/auth/me', ({ request }) => {
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    return ok(publicUser(user))
  }),

  http.patch('/api/users/me/profile', async ({ request }) => {
    await delay(500)
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const body = await request.json()
    user.profile = { ...user.profile, ...body }
    if (body.name) user.name = body.name
    persistDb()
    return ok(publicUser(user))
  }),
]

// ---------------------------------------------------------------- universities
export const universityHandlers = [
  http.get('/api/universities/public', ({ request }) => {
    const url = new URL(request.url)
    if (url.searchParams.get('includeUnpublished') === 'true') {
      return ok(db.publicUniversities)
    }
    return ok(db.publicUniversities.filter((u) => u.published !== false))
  }),

  http.get('/api/universities/private', ({ request }) => {
    const url = new URL(request.url)
    if (url.searchParams.get('includeUnpublished') === 'true') {
      return ok(db.privateUniversities)
    }
    return ok(db.privateUniversities.filter((u) => u.published !== false))
  }),

  http.get('/api/universities/public/:id', ({ params }) => {
    const u = db.publicUniversities.find((x) => x.id === params.id)
    if (!u || u.published === false) return fail(404, 'notFound')
    return ok(u)
  }),

  http.get('/api/universities/private/:id', ({ params }) => {
    const u = db.privateUniversities.find((x) => x.id === params.id)
    if (!u || u.published === false) return fail(404, 'notFound')
    return ok(u)
  }),

  // --- admin record management ---
  http.post('/api/admin/universities', async ({ request }) => {
    await delay(600)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const body = await request.json()
    const record = {
      id: `${body.type}-new-${Date.now()}`,
      name: { en: body.nameEn, bn: body.nameBn },
      shortName: { en: body.nameEn, bn: body.nameBn },
      city: { en: body.city || 'Dhaka', bn: body.city || 'ঢাকা' },
      type: body.type,
      established: Number(body.established) || 2020,
      published: Boolean(body.published),
      website: body.website || '',
      sourceUrl: body.sourceUrl || '',
      lastVerified: new Date().toISOString().slice(0, 10),
      units: [],
      departments: [],
      applicationFee: Number(body.applicationFee) || 0,
      seatsTotal: 0,
      groups: body.groups || [],
      minSscGpa: Number(body.minSscGpa) || 0,
      minHscGpa: Number(body.minHscGpa) || 0,
      deadline: body.deadline || null,
      examDate: body.examDate || null,
      examPattern: body.examPattern || 'MCQ',
      admissionDeadline: body.deadline || null,
      admissionFee: Number(body.applicationFee) || 0,
    }
    if (body.type === 'public') db.publicUniversities.unshift(record)
    else db.privateUniversities.unshift(record)
    persistDb()
    return ok(record)
  }),

  http.patch('/api/admin/universities/:id', async ({ request, params }) => {
    await delay(500)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const body = await request.json()
    const list = [...db.publicUniversities, ...db.privateUniversities]
    const record = list.find((x) => x.id === params.id)
    if (!record) return fail(404, 'notFound')

    if (body.nameEn) record.name.en = body.nameEn
    if (body.nameBn) record.name.bn = body.nameBn
    if (body.city) record.city = { en: body.city, bn: body.city }
    if (body.website !== undefined) record.website = body.website
    if (body.sourceUrl !== undefined) record.sourceUrl = body.sourceUrl
    if (body.published !== undefined) record.published = Boolean(body.published)
    if (body.lastVerified !== undefined) record.lastVerified = body.lastVerified
    if (body.established !== undefined) record.established = Number(body.established)
    if (body.type !== undefined) record.type = body.type
    persistDb()
    return ok(record)
  }),

  http.delete('/api/admin/universities/:id', async ({ request, params }) => {
    await delay(400)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const before = db.publicUniversities.length + db.privateUniversities.length
    db.publicUniversities = db.publicUniversities.filter((x) => x.id !== params.id)
    db.privateUniversities = db.privateUniversities.filter((x) => x.id !== params.id)
    const after = db.publicUniversities.length + db.privateUniversities.length
    if (before === after) return fail(404, 'notFound')
    persistDb()
    return ok({ deleted: true })
  }),
]

// ---------------------------------------------------------------- assistant
export const assistantHandlers = [
  http.post('/api/assistant/chat', async ({ request }) => {
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const body = await request.json()

    // NFR-1 demo hooks: "timeout" triggers a >10s delay, "error" fails
    const q = String(body.message || '').toLowerCase()
    if (q.includes('timeout')) {
      await delay(ASSISTANT_TIMEOUT_MS + 5000)
      return fail(504, 'timeout')
    }
    if (q.includes('error') || q.includes('ভুল কর')) {
      await delay(400)
      return fail(500, 'assistantError')
    }

    await delay(1400 + Math.random() * 1200)

    const hit = knowledgeBase.find((k) =>
      k.keywords.some((kw) => q.includes(kw.toLowerCase()))
    )

    if (!hit) {
      // Honest "no verified record" state with official-portal link (FR-5)
      return ok({
        status: 'no_record',
        message: {
          bn: 'দুঃখিত, এই বিষয়ে আমার কাছে **যাচাই করা কোনো রেকর্ড নেই।** ভুল তথ্য দেওয়ার চেয়ে সরাসরি বলা ভালো। অনুগ্রহ করে নিচের অফিসিয়াল পেজ দেখুন — চূড়ান্ত তথ্য সেখানেই পাবেন।',
          en: 'Sorry, I have **no verified record** on this topic. Rather than guess, please check the official page below for the definitive information.',
        },
        sources: [
          {
            label: { bn: 'বাংলাদেশ শিক্ষা মন্ত্রণালয়', en: 'Ministry of Education, Bangladesh' },
            url: 'https://www.moedu.gov.bd',
          },
          {
            label: { bn: 'UGC (বিশ্ববিদ্যালয় মঞ্জুরি কমিশন)', en: 'UGC (University Grants Commission)' },
            url: 'https://www.ugc.university',
          },
        ],
      })
    }

    return ok({
      status: 'ok',
      message: hit.answer,
      sources: hit.sources,
    })
  }),

  http.get('/api/assistant/suggestions', () =>
    ok({ questions: suggestedQuestions })
  ),
]

// ---------------------------------------------------------------- recommendations
export const recommendationHandlers = [
  http.get('/api/recommendations', ({ request }) => {
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const p = user.profile || {}
    if (p.hscGpa == null || !p.group) {
      return fail(422, 'profileIncomplete')
    }
    return ok({ items: buildRecommendations(p) })
  }),
]

// ---------------------------------------------------------------- mock tests
export const testHandlers = [
  http.get('/api/tests', () => ok(db.tests.map((t) => ({ ...t, questions: undefined, questionIds: t.questionIds })))),

  http.get('/api/tests/:id', ({ params }) => {
    const t = db.tests.find((x) => x.id === params.id)
    if (!t) return fail(404, 'notFound')
    return ok(t)
  }),

  // Begin an attempt: server stamps the attempt id + duration
  http.post('/api/tests/:id/attempt', async ({ request, params }) => {
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const test = db.tests.find((x) => x.id === params.id)
    if (!test) return fail(404, 'notFound')
    const attempt = {
      id: createAttemptId(),
      testId: test.id,
      userId: user.id,
      submittedAt: null,
      durationUsedSec: 0,
      answers: {},
      labels: {},
      stats: {},
      autoSubmitted: false,
    }
    return ok({
      attemptId: attempt.id,
      durationSec: test.durationSec,
      test: {
        id: test.id,
        title: test.title,
        durationSec: test.durationSec,
        questions: test.questions.map((q) => ({
          id: q.id,
          subject: q.subject,
          topic: q.topic,
          text: q.text,
          options: q.options,
          marks: q.marks,
          negative: q.negative,
        })),
      },
    })
  }),

  // Submit: server grades, labels mistakes and stores analytics
  http.post('/api/attempts/:id/submit', async ({ request, params }) => {
    await delay(900)
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const body = await request.json()
    const test = db.tests.find((x) => x.id === body.testId)
    if (!test) return fail(404, 'notFound')

    const attempt = {
      id: params.id,
      testId: test.id,
      userId: user.id,
      submittedAt: new Date().toISOString(),
      durationUsedSec: body.durationUsedSec ?? 0,
      answers: body.answers || {},
      labels: body.labels || {},
      stats: body.stats || {},
      autoSubmitted: Boolean(body.autoSubmitted),
    }
    db.attempts.push(attempt)
    persistDb()

    const result = buildResult(test, attempt)
    return ok({ resultId: result.attemptId, result })
  }),

  http.get('/api/attempts/:id/result', ({ request, params }) => {
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const attempt = db.attempts.find(
      (a) => a.id === params.id && a.userId === user.id
    )
    if (!attempt) return fail(404, 'notFound')
    const test = db.tests.find((t) => t.id === attempt.testId)
    if (!test) return fail(404, 'notFound')
    return ok(buildResult(test, attempt))
  }),

  http.get('/api/users/me/attempts', ({ request }) => {
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const mine = db.attempts.filter((a) => a.userId === user.id)
    return ok(
      mine.map((a) => {
        const test = db.tests.find((t) => t.id === a.testId)
        const r = test ? buildResult(test, a) : null
        return {
          id: a.id,
          testId: a.testId,
          testTitle: test?.title,
          subject: test?.subject,
          submittedAt: a.submittedAt,
          percentage: r?.totals.percentage ?? 0,
          score: r?.totals.score ?? 0,
        }
      })
    )
  }),

  http.get('/api/users/me/analytics', ({ request }) => {
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const mine = db.attempts.filter((a) => a.userId === user.id)
    return ok(buildDashboardAnalytics(mine))
  }),

  // Explanation for a single question (AI-5) — sanitized on the client
  http.get('/api/questions/:id/explanation', async ({ request, params }) => {
    await delay(700)
    const user = authUser(request)
    if (!user) return fail(401, 'unauthorized')
    const q = db.questionReviews.find((x) => x.id === params.id)
    if (!q) return fail(404, 'notFound')
    return ok({ explanation: q.explanation })
  }),
]

// ---------------------------------------------------------------- admin
export const adminHandlers = [
  // Circular upload -> simulated extraction progress (AI-1)
  http.post('/api/admin/circulars', async ({ request }) => {
    await delay(1000)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')

    const contentType = request.headers.get('Content-Type') || ''
    let meta = {}
    if (contentType.includes('application/json')) {
      meta = await request.json()
    }

    const circular = {
      id: `circ-${db.circulars.length + 1}`,
      universityId: meta.universityId || null,
      universityName: meta.universityName || { en: '', bn: '' },
      title: meta.title || { en: '', bn: '' },
      fileName: meta.fileName || 'circular.pdf',
      fileSize: meta.fileSize || 1024000,
      uploadedBy: user.email,
      uploadedAt: new Date().toISOString(),
      status: 'pending_review',
      extracted: {
        applicationStart: suggestDate(14),
        applicationDeadline: suggestDate(35),
        examDate: suggestDate(80),
        minSscGpa: 3.5,
        minHscGpa: 3.5,
        applicationFee: 350,
        departments: [
          { name: { en: 'A Unit — Science', bn: 'ক ইউনিট — বিজ্ঞান' }, seats: 850 },
          { name: { en: 'B Unit — Arts', bn: 'খ ইউনিট — মানবিক' }, seats: 620 },
        ],
      },
      rawText: {
        en: `EXTRACTED TEXT (OCR)\n\n${meta.title?.en || 'Admission circular'}\n\nApplication period and requirements detected by the extraction pipeline. Edit the draft fields on the right to correct any mistakes before publishing.`,
        bn: `বের করা টেক্সট (OCR)\n\n${meta.title?.bn || 'ভর্তি বিজ্ঞপ্তি'}\n\nআবেদনের সময় ও যোগ্যতা এক্সট্রাকশন পাইপলাইন শনাক্ত করেছে। প্রকাশের আগে ডান পাশের ড্রাফট ফিল্ডগুলো যাচাই করে সম্পাদনা করুন।`,
      },
    }
    db.circulars.unshift(circular)
    persistDb()
    return ok(circular)
  }),

  http.get('/api/admin/circulars', ({ request }) => {
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    return ok(db.circulars)
  }),

  http.get('/api/admin/circulars/:id', ({ request, params }) => {
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const c = db.circulars.find((x) => x.id === params.id)
    if (!c) return fail(404, 'notFound')
    return ok(c)
  }),

  http.patch('/api/admin/circulars/:id', async ({ request, params }) => {
    await delay(400)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const c = db.circulars.find((x) => x.id === params.id)
    if (!c) return fail(404, 'notFound')
    const body = await request.json()
    if (body.title) c.title = body.title
    if (body.extracted) c.extracted = { ...c.extracted, ...body.extracted }
    persistDb()
    return ok(c)
  }),

  http.post('/api/admin/circulars/:id/approve', async ({ request, params }) => {
    await delay(600)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const c = db.circulars.find((x) => x.id === params.id)
    if (!c) return fail(404, 'notFound')
    c.status = 'approved'
    c.reviewedAt = new Date().toISOString()
    c.reviewedBy = user.email
    persistDb()
    return ok(c)
  }),

  http.post('/api/admin/circulars/:id/reject', async ({ request, params }) => {
    await delay(500)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const c = db.circulars.find((x) => x.id === params.id)
    if (!c) return fail(404, 'notFound')
    const body = await request.json().catch(() => ({}))
    c.status = 'rejected'
    c.rejectReason = body.reason || ''
    c.reviewedAt = new Date().toISOString()
    c.reviewedBy = user.email
    persistDb()
    return ok(c)
  }),

  // Question review
  http.get('/api/admin/questions', ({ request }) => {
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const url = new URL(request.url)
    const status = url.searchParams.get('status')
    const items = status ? db.questionReviews.filter((q) => q.status === status) : db.questionReviews
    return ok(items)
  }),

  http.patch('/api/admin/questions/:id', async ({ request, params }) => {
    await delay(400)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const q = db.questionReviews.find((x) => x.id === params.id)
    if (!q) return fail(404, 'notFound')
    const body = await request.json()
    if (body.text) q.text = body.text
    if (body.options) q.options = body.options
    if (body.correct !== undefined) q.correct = body.correct
    if (body.explanation) q.explanation = body.explanation
    if (body.topic) q.topic = body.topic
    if (body.difficulty) q.difficulty = body.difficulty
    persistDb()
    return ok(q)
  }),

  http.post('/api/admin/questions/:id/approve', async ({ request, params }) => {
    await delay(350)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const q = db.questionReviews.find((x) => x.id === params.id)
    if (!q) return fail(404, 'notFound')
    q.status = 'approved'
    persistDb()
    return ok(q)
  }),

  http.post('/api/admin/questions/:id/reject', async ({ request, params }) => {
    await delay(350)
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    const q = db.questionReviews.find((x) => x.id === params.id)
    if (!q) return fail(404, 'notFound')
    const body = await request.json().catch(() => ({}))
    q.status = 'rejected'
    q.rejectReason = body.reason || ''
    persistDb()
    return ok(q)
  }),

  // Admin overview stats
  http.get('/api/admin/overview', ({ request }) => {
    const user = authUser(request)
    if (!user || user.role !== 'admin') return fail(403, 'forbidden')
    return ok({
      pendingCirculars: db.circulars.filter((c) => c.status === 'pending_review').length,
      approvedCirculars: db.circulars.filter((c) => c.status === 'approved').length,
      publishedRecords:
        db.publicUniversities.filter((u) => u.published !== false).length +
        db.privateUniversities.filter((u) => u.published !== false).length,
      pendingQuestions: db.questionReviews.filter((q) => q.status === 'pending').length,
      totalQuestions: db.questionReviews.length,
      totalResults: db.attempts.length,
      recentUploads: db.circulars.slice(0, 5),
    })
  }),
]

export const handlers = [
  ...authHandlers,
  ...universityHandlers,
  ...assistantHandlers,
  ...recommendationHandlers,
  ...testHandlers,
  ...adminHandlers,
]

/** Small helper used to fake "extracted" future dates. */
function suggestDate(daysFromNow) {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}
