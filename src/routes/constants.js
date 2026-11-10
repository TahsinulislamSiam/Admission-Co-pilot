/** Route path constants — single source of truth for navigation. */
export const ROUTES = {
  // public
  landing: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',

  // student app (protected)
  app: '/app',
  dashboard: '/app/dashboard',
  profile: '/app/profile',
  publicUniversities: '/app/public-universities',
  publicUniversityDetail: '/app/public-universities/:id',
  privateUniversities: '/app/private-universities',
  privateUniversityDetail: '/app/private-universities/:id',
  compare: '/app/compare',
  assistant: '/app/assistant',
  recommendations: '/app/recommendations',
  tests: '/app/tests',
  testInstructions: '/app/tests/:id/instructions',
  testEngine: '/app/tests/:id/engine',
  testResult: '/app/results/:attemptId',
  analysisDashboard: '/app/dashboard', // analysis lives on dashboard

  // admin (role-protected)
  admin: '/admin',
  adminOverview: '/admin/overview',
  adminCirculars: '/admin/circulars',
  adminCircularReview: '/admin/circulars/:id/review',
  adminRecords: '/admin/records',
  adminQuestions: '/admin/questions',
}

export const route = (path, params) => {
  let out = path
  for (const [key, value] of Object.entries(params || {})) {
    out = out.replace(`:${key}`, String(value))
  }
  return out
}
