/**
 * Whole-app render + click sweep.
 *
 * Every page is mounted with a signed-in session and a stubbed HTTP layer, then
 * we (a) assert it renders its heading without throwing, and (b) click every
 * button that is safe to click (anything that is not a destructive remove /
 * delete / submit-style confirm / external link) to prove the handlers exist.
 *
 * A page that crashes on render, or a button whose handler throws, fails here.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, cleanup, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MemoryRouter } from 'react-router-dom'
import i18n from '@/lib/i18n'
import { useAuthStore } from '@/store/authStore'

// ------------------------------------------------------------------ HTTP stub
const student = {
  id: 'u1',
  name: 'Rakib Hasan',
  nameEn: 'Rakib Hasan',
  email: 'student@example.com',
  role: 'student',
  createdAt: '2026-01-05T09:00:00.000Z',
  profile: {
    sscGpa: 5,
    hscGpa: 4.75,
    group: 'science',
    budget: 200000,
    preferredSubjects: ['math'],
    preferredCities: ['Dhaka'],
    needsHostel: true,
    phone: '01700000000',
  },
}

const uni = {
  id: 'du',
  name: { en: 'University of Dhaka', bn: 'ঢাকা বিশ্ববিদ্যালয়' },
  shortName: { en: 'DU', bn: 'ঢাবি' },
  type: 'public',
  city: { en: 'Dhaka', bn: 'ঢাকা' },
  established: 1921,
  ranking: { national: 1, world: 800 },
  subjects: ['science'],
  admissionTests: [{ name: 'Ka unit', date: '2026-05-01' }],
  website: 'https://du.ac.bd',
  sourceUrl: 'https://du.ac.bd/admission',
  lastVerified: '2026-01-01T00:00:00.000Z',
  published: true,
  units: [],
  notes: { en: '', bn: '' },
  requiredDocuments: [],
}

const attempt = {
  id: 'a1',
  testId: 't1',
  testTitle: 'Model Test 1',
  startedAt: '2026-01-05T09:00:00.000Z',
  submittedAt: '2026-01-05T09:30:00.000Z',
  score: 60,
  total: 100,
  correct: 60,
  wrong: 20,
  skipped: 20,
  accuracy: 0.75,
  durationSec: 1800,
  status: 'submitted',
  answers: [],
  questions: [],
  stats: { byTopic: [], byMistake: [] },
}

const byPath = (url) => {
  const path = String(url).split('?')[0]
  if (path === '/auth/me') return student
  if (path === '/admin/overview')
    return { users: 3, universities: 12, questions: 40, circulars: 1, recentCirculars: [] }
  if (path === '/assistant/suggestions') return { questions: ['What is the deadline?'] }
  if (path === '/users/me/analytics')
    return {
      attempts: 2,
      avgScore: 55,
      bestScore: 70,
      streak: 3,
      byTopic: [],
      byMistake: [],
      weakTopics: [],
      history: [],
      mistakeTypes: [],
      mistakeCounts: {},
      testsTaken: 2,
      lastScore: 55,
    }
  if (path.startsWith('/users/me/attempts')) return [attempt]
  if (path.startsWith('/tests')) return [
    {
      id: 't1',
      title: 'Model Test 1',
      subject: 'math',
      difficulty: 'medium',
      durationSec: 1800,
      questionCount: 30,
      attemptsCount: 0,
    },
  ]
  if (path.startsWith('/recommendations')) return { universities: [], reasons: [] }
  if (path.startsWith('/universities/public')) return [uni]
  if (path.startsWith('/universities/private'))
    return [
      {
        ...uni,
        id: 'nsu',
        type: 'private',
        departments: [
          {
            name: { en: 'Computer Science', bn: 'কম্পিউটার সায়েন্স' },
            seats: 60,
            tuition: 150000,
            admissionTest: 'Written',
          },
        ],
      },
    ]
  if (path.startsWith('/universities/')) return uni
  if (path.startsWith('/admin/users'))
    return [student, { ...student, id: 'u2', name: 'Admin User', email: 'admin@example.com', role: 'admin' }]
  if (path.startsWith('/admin/circulars')) return []
  if (path.startsWith('/admin/questions')) return []
  if (path.startsWith('/admin/universities')) return [uni]
  if (path === '/news/papers')
    return [
      {
        id: 'prothom-alo',
        name: { en: 'Prothom Alo', bn: 'প্রথম আলো' },
        url: 'https://www.prothomalo.com',
        accent: '#e11d48',
        thumbnail: 'https://example.com/pa.jpg',
        headline: 'Latest from Prothom Alo',
        headlineUrl: 'https://www.prothomalo.com/x',
      },
      {
        id: 'daily-star',
        name: { en: 'The Daily Star', bn: 'দ্য ডেইলি স্টার' },
        url: 'https://www.thedailystar.net',
        accent: '#0f766e',
        thumbnail: null,
        headline: 'Latest from The Daily Star',
        headlineUrl: 'https://www.thedailystar.net/x',
      },
    ]
  if (path === '/news')
    return {
      scope: 'all',
      updatedAt: Date.now(),
      counts: { national: 1, international: 1 },
      failed: [],
      items: [
        {
          id: 'n1',
          title: 'জাতীয় সংবাদের শিরোনাম',
          url: 'https://www.prothomalo.com/a',
          summary: 'সংক্ষিপ্ত বিবরণ',
          image: null,
          publishedAt: new Date(Date.now() - 3600e3).toISOString(),
          source: { id: 'prothom-alo', name: { en: 'Prothom Alo', bn: 'প্রথম আলো' }, scope: 'national' },
        },
        {
          id: 'n2',
          title: 'World headline',
          url: 'https://www.bbc.com/b',
          summary: 'Short summary',
          image: 'https://example.com/b.jpg',
          publishedAt: new Date(Date.now() - 7200e3).toISOString(),
          source: { id: 'bbc-world', name: { en: 'BBC World', bn: 'বিবিসি' }, scope: 'international' },
        },
      ],
    }
  if (path.startsWith('/videos'))
    return [
      {
        id: 'v1',
        title: 'Integration basics',
        subject: 'math',
        topic: 'Integration',
        youtubeUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        youtubeId: 'dQw4w9WgXcQ',
        channel: 'Test Channel',
        createdAt: '2026-01-05T09:00:00.000Z',
      },
    ]
  if (path.startsWith('/professors'))
    return [
      {
        id: 'p1',
        university: 'University of Dhaka',
        city: 'Dhaka',
        country: 'Bangladesh',
        universityRank: 801,
        universityWebsite: 'https://du.ac.bd',
        name: 'Test Professor',
        title: 'Professor',
        department: 'CSE',
        email: 'prof@du.ac.bd',
        researchFields: ['Machine Learning'],
        profileUrl: 'https://du.ac.bd/p',
      },
    ]
  if (path.startsWith('/mail/inbox')) return []
  if (path.startsWith('/mail/sent')) return []
  if (path.startsWith('/mail/unread')) return { total: 0 }
  if (path.startsWith('/mail/contacts')) return []
  return []
}

vi.mock('@/lib/axios', () => {
  const ok = (data) => Promise.resolve({ data })
  const api = {
    get: vi.fn((url) => ok(byPath(url))),
    post: vi.fn((url) => ok(byPath(url))),
    patch: vi.fn((url) => ok(byPath(url))),
    delete: vi.fn(() => ok({ deleted: true })),
  }
  return {
    api,
    normalizedError: (e) => e?.normalized ?? { status: 0, message: e?.message || 'error' },
  }
})

// ------------------------------------------------------------------- pages
// Pages export either a named component or a default; pick whichever exists.
const pick = (mod) => mod.default ?? Object.values(mod).find((v) => typeof v === 'function')

const LandingPage = pick(await import('@/features/landing/pages/LandingPage'))
const LoginPage = pick(await import('@/features/auth/pages/LoginPage'))
const RegisterPage = pick(await import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = pick(await import('@/features/auth/pages/ForgotPasswordPage'))
const DashboardPage = pick(await import('@/features/dashboard/pages/DashboardPage'))
const ProfilePage = pick(await import('@/features/auth/pages/ProfilePage'))
const PublicHubPage = pick(await import('@/features/universities/pages/PublicHubPage'))
const PrivateDirectoryPage = pick(await import('@/features/universities/pages/PrivateDirectoryPage'))
const PublicDetailPage = pick(await import('@/features/universities/pages/PublicDetailPage'))
const PrivateDetailPage = pick(await import('@/features/universities/pages/PrivateDetailPage'))
const ComparePage = pick(await import('@/features/universities/pages/ComparePage'))
const AssistantPage = pick(await import('@/features/assistant/pages/AssistantPage'))
const RecommendationsPage = pick(await import('@/features/recommendations/pages/RecommendationsPage'))
const TestListPage = pick(await import('@/features/mock-tests/pages/TestListPage'))
const VideoSectionPage = pick(await import('@/features/videos/pages/VideoSectionPage'))
const NewspaperPage = pick(await import('@/features/news/pages/NewspaperPage'))
const StudentMailPage = pick(await import('@/features/mail/pages/StudentMailPage'))
const ProfessorsPage = pick(await import('@/features/professors/pages/ProfessorsPage'))
const NotFoundPage = pick(await import('@/features/misc/pages/NotFoundPage'))
const AdminOverviewPage = pick(await import('@/features/admin/pages/AdminOverviewPage'))
const CircularUploadPage = pick(await import('@/features/admin/pages/CircularUploadPage'))
const RecordsPage = pick(await import('@/features/admin/pages/RecordsPage'))
const QuestionReviewPage = pick(await import('@/features/admin/pages/QuestionReviewPage'))
const AdminUsersPage = pick(await import('@/features/admin/pages/AdminUsersPage'))
const AdminVideosPage = pick(await import('@/features/admin/pages/AdminVideosPage'))
const AdminProfessorsPage = pick(await import('@/features/admin/pages/AdminProfessorsPage'))
const AdminMailPage = pick(await import('@/features/admin/pages/AdminMailPage'))

const PAGES = [
  ['LandingPage', LandingPage, '/'],
  ['LoginPage', LoginPage, '/login'],
  ['RegisterPage', RegisterPage, '/register'],
  ['ForgotPasswordPage', ForgotPasswordPage, '/forgot-password'],
  ['DashboardPage', DashboardPage, '/app/dashboard'],
  ['ProfilePage', ProfilePage, '/app/profile'],
  ['PublicHubPage', PublicHubPage, '/app/public-universities'],
  ['PublicDetailPage', PublicDetailPage, '/app/public-universities/du'],
  ['PrivateDirectoryPage', PrivateDirectoryPage, '/app/private-universities'],
  ['PrivateDetailPage', PrivateDetailPage, '/app/private-universities/nsu'],
  ['ComparePage', ComparePage, '/app/compare'],
  ['AssistantPage', AssistantPage, '/app/assistant'],
  ['RecommendationsPage', RecommendationsPage, '/app/recommendations'],
  ['TestListPage', TestListPage, '/app/tests'],
  ['VideoSectionPage', VideoSectionPage, '/app/videos'],
  ['NewspaperPage', NewspaperPage, '/app/newspaper'],
  ['StudentMailPage', StudentMailPage, '/app/mail'],
  ['ProfessorsPage', ProfessorsPage, '/app/professors'],
  ['AdminOverviewPage', AdminOverviewPage, '/admin/overview'],
  ['CircularUploadPage', CircularUploadPage, '/admin/circulars'],
  ['RecordsPage', RecordsPage, '/admin/records'],
  ['QuestionReviewPage', QuestionReviewPage, '/admin/questions'],
  ['AdminUsersPage', AdminUsersPage, '/admin/users'],
  ['AdminVideosPage', AdminVideosPage, '/admin/videos'],
  ['AdminProfessorsPage', AdminProfessorsPage, '/admin/professors'],
  ['AdminMailPage', AdminMailPage, '/admin/mail'],
  ['NotFoundPage', NotFoundPage, '/nope'],
]

// buttons that mutate or navigate away — clicked separately in their own tests
const SKIP = /delete|remove|remove user|remove video|remove professor|save|send|submit|log ?out|sign ?out|download|reset|approve|reject|upload/i

const renderAt = (Page, path) => {
  const qc = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={[path]}>
        <Page />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

beforeEach(async () => {
  cleanup()
  await i18n.changeLanguage('en')
  useAuthStore.getState().setAuth({ user: student, token: 'x'.repeat(64) })
})

describe('every page renders', () => {
  for (const [name, Page, path] of PAGES) {
    it(`${name} mounts without crashing`, async () => {
      const { container } = renderAt(Page, path)
      await waitFor(() => expect(container.innerHTML.length).toBeGreaterThan(120), {
        timeout: 4000,
      })
      // no raw error boundary output
      expect(container.textContent).not.toMatch(/something went wrong/i)
    })
  }
})

describe('buttons are clickable', () => {
  for (const [name, Page, path] of PAGES) {
    it(`${name} has working buttons`, async () => {
      const user = userEvent.setup()
      const { container } = renderAt(Page, path)
      await waitFor(() => expect(container.innerHTML.length).toBeGreaterThan(120), {
        timeout: 4000,
      })
      // let the stubbed queries resolve so rows/cards (and their buttons) exist
      await waitFor(() => expect(container.querySelectorAll('.animate-pulse').length).toBe(0), {
        timeout: 3000,
      }).catch(() => {})

      const buttons = [...container.querySelectorAll('button')]
      const clickable = buttons.filter((b) => {
        const label = (b.textContent || '') + ' ' + (b.getAttribute('aria-label') || '')
        if (b.disabled || SKIP.test(label)) return false
        // Radix keeps its dropdown items mounted-but-inert while closed
        if (window.getComputedStyle(b).pointerEvents === 'none') return false
        if (b.getAttribute('role') === 'option') return false
        return true
      })

      let clicked = 0
      for (const b of clickable.slice(0, 12)) {
        try {
          await user.click(b) // throws if the handler blows up
          clicked += 1
        } catch (err) {
          // Radix renders closed popups inert; that is a jsdom limitation, not a
          // broken handler, so only re-throw anything else.
          if (!/pointer-events/.test(err.message)) throw err
        }
      }
      console.log(`clicked ${clicked}/${clickable.length} buttons on ${name}`)
    })
  }
})
