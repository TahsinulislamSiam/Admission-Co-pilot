/**
 * API matrix: calls every route with each role and prints status codes, so a
 * broken/missing endpoint shows up as a 404/500 instead of a silent UI failure.
 *
 *   node server/index.js &   then   node scripts/api-matrix.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:8787'

const req = async (method, path, { token, body } = {}) => {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })
  let data = null
  try {
    data = await res.json()
  } catch {
    /* empty body */
  }
  return { status: res.status, data }
}

const login = async (email, password) => {
  const { status, data } = await req('POST', '/api/auth/login', { body: { email, password } })
  if (status !== 200) throw new Error(`login failed for ${email}: ${status}`)
  return data.token
}

const results = []
const check = async (label, expect, method, path, opts) => {
  const { status } = await req(method, path, opts)
  const pass = Array.isArray(expect) ? expect.includes(status) : status === expect
  results.push({ label, method, path, status, expect: String(expect), pass })
  return status
}

const main = async () => {
  const admin = await login('admin@example.com', 'admin123')
  const student = await login('student@example.com', 'password123')

  // --- public / health ---
  await check('health', 200, 'GET', '/api/health')
  await check('db health', 200, 'GET', '/api/db/health')
  await check('assistant health', 200, 'GET', '/api/assistant/health')
  await check('assistant suggestions', 200, 'GET', '/api/assistant/suggestions')

  // --- auth ---
  await check('login bad password', 401, 'POST', '/api/auth/login', {
    body: { email: 'admin@example.com', password: 'nope' },
  })
  await check('login unknown user', 404, 'POST', '/api/auth/login', {
    body: { email: 'ghost@example.com', password: 'whatever' },
  })
  await check('register short password', 400, 'POST', '/api/auth/register', {
    body: { email: 'x@example.com', password: '123' },
  })
  await check('register duplicate', 409, 'POST', '/api/auth/register', {
    body: { email: 'admin@example.com', password: 'secret123' },
  })
  await check('me (student)', 200, 'GET', '/api/auth/me', { token: student })
  await check('me (no token)', 401, 'GET', '/api/auth/me')
  await check('me (bad token)', 401, 'GET', '/api/auth/me', { token: 'deadbeef' })
  await check('forgot password unknown', 404, 'POST', '/api/auth/forgot-password', {
    body: { email: 'ghost@example.com' },
  })

  // --- catalogues (open) ---
  await check('universities public', 200, 'GET', '/api/universities/public')
  await check('universities private', 200, 'GET', '/api/universities/private')
  await check('videos', 200, 'GET', '/api/videos')
  await check('professors', 200, 'GET', '/api/professors')
  await check('professor search', 200, 'GET', '/api/professors?q=stan')

  const { data: pubs } = await req('GET', '/api/universities/public')
  const firstId = pubs?.[0]?.id
  if (firstId) {
    await check('university detail', 200, 'GET', `/api/universities/public/${firstId}`)
  }
  await check('university detail missing', 404, 'GET', '/api/universities/public/does-not-exist')

  // --- profile ---
  // remember the seeded phone so a test run leaves the account untouched
  const meBefore = (await req('GET', '/api/auth/me', { token: student })).data
  const phoneBefore = meBefore?.user?.profile?.phone ?? meBefore?.profile?.phone

  await check('profile patch', 200, 'PATCH', '/api/users/me/profile', {
    token: student,
    body: { phone: '01711111111' },
  })
  await check('profile patch no auth', 401, 'PATCH', '/api/users/me/profile', {
    body: { phone: '01711111111' },
  })

  if (phoneBefore) {
    await req('PATCH', '/api/users/me/profile', { token: student, body: { phone: phoneBefore } })
  }

  // --- newspaper (public RSS aggregation) ---
  await check('news all', 200, 'GET', '/api/news')
  await check('news national', 200, 'GET', '/api/news?scope=national&limit=5')
  await check('news international', 200, 'GET', '/api/news?scope=international&limit=5')
  await check('news unknown scope falls back', 200, 'GET', '/api/news?scope=bogus')
  await check('news papers', 200, 'GET', '/api/news/papers')

  // --- mail ---
  await check('mail inbox', 200, 'GET', '/api/mail/inbox', { token: student })
  await check('mail sent', 200, 'GET', '/api/mail/sent', { token: student })
  await check('mail unread', 200, 'GET', '/api/mail/unread', { token: student })
  await check('mail contacts (student)', 200, 'GET', '/api/mail/contacts', { token: student })
  await check('mail contacts (admin)', 200, 'GET', '/api/mail/contacts', { token: admin })
  await check('mail send unknown recipient', 404, 'POST', '/api/mail', {
    token: student,
    body: { toEmail: 'nobody@example.com', subject: 's', body: 'b' },
  })
  await check('mail send empty', 400, 'POST', '/api/mail', {
    token: student,
    body: { toEmail: 'admin@example.com' },
  })
  await check('mail mark read missing', 404, 'POST', '/api/mail/nope/read', { token: student })

  // --- admin ---
  await check('admin users', 200, 'GET', '/api/admin/users', { token: admin })
  await check('admin users search', 200, 'GET', '/api/admin/users?q=admin', { token: admin })
  await check('admin users forbidden (student)', 403, 'GET', '/api/admin/users', {
    token: student,
  })
  await check('admin users forbidden (anon)', 401, 'GET', '/api/admin/users')
  await check('admin video add invalid url', 400, 'POST', '/api/admin/videos', {
    token: admin,
    body: { title: 't', subject: 'math', youtubeUrl: 'https://example.com' },
  })
  await check('admin professor missing name', 400, 'POST', '/api/admin/professors', {
    token: admin,
    body: { university: 'X' },
  })
  await check('admin professor delete missing', 404, 'DELETE', '/api/admin/professors/nope', {
    token: admin,
  })
  await check('admin user delete self', 400, 'DELETE', '/api/admin/users/u2', { token: admin })

  // --- writes that we then undo ---
  const { data: video } = await req('POST', '/api/admin/videos', {
    token: admin,
    body: {
      title: 'Matrix test',
      subject: 'math',
      youtubeUrl: 'https://youtu.be/dQw4w9WgXcQ',
    },
  })
  await check('video delete', 200, 'DELETE', `/api/admin/videos/${video.id}`, { token: admin })
  await check('video delete again', 404, 'DELETE', `/api/admin/videos/${video.id}`, {
    token: admin,
  })

  const { data: prof } = await req('POST', '/api/admin/professors', {
    token: admin,
    body: { university: 'Matrix University', name: 'Matrix Professor' },
  })
  await check('professor delete', 200, 'DELETE', `/api/admin/professors/${prof?.id}`, {
    token: admin,
  })

  const { data: uni } = await req('POST', '/api/admin/universities', {
    token: admin,
    body: { nameEn: 'Matrix University', type: 'private', city: 'Dhaka', published: false },
  })
  await check('university patch', 200, 'PATCH', `/api/admin/universities/${uni?.id}`, {
    token: admin,
    body: { published: false },
  })
  await check('university delete', 200, 'DELETE', `/api/admin/universities/${uni?.id}`, {
    token: admin,
  })

  const { data: msg } = await req('POST', '/api/mail', {
    token: student,
    body: { toEmail: 'admin@example.com', subject: 'Matrix', body: 'ping' },
  })
  await check('mail mark read', 200, 'POST', `/api/mail/${msg?.id}/read`, { token: admin })

  // --- report ---
  const failed = results.filter((r) => !r.pass)
  for (const r of results) {
    console.log(`${r.pass ? 'PASS' : 'FAIL'}  ${String(r.status).padEnd(4)} ${r.method.padEnd(6)} ${r.path}  (expect ${r.expect})  ${r.label}`)
  }
  console.log(`\n${results.length - failed.length}/${results.length} endpoints behaved as expected`)
  if (failed.length) process.exitCode = 1
}

main().catch((err) => {
  console.error('matrix failed:', err.message)
  process.exitCode = 1
})
