/** Route path constants — single source of truth for navigation. */
export const ROUTES = {
  // public
  landing: '/',
  login: '/login',
  register: '/register',
  forgotPassword: '/forgot-password',
  adminLogin: '/admin/login', // admin sign-in, public

  // student app (protected)
  app: '/app',
  dashboard: '/app/dashboard',
  profile: '/app/profile',
  publicUniversities: '/app/public-universities',
  publicUniversityDetail: '/app/public-universities/:id',
  privateUniversities: '/app/private-universities',
  privateUniversityDetail: '/app/private-universities/:id',
  professors: '/app/professors',
  compare: '/app/compare',
  assistant: '/app/assistant',
  recommendations: '/app/recommendations',
  platform: '/app/platform',
  tests: '/app/tests',
  videos: '/app/videos',
  mail: '/app/mail',
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
  adminUsers: '/admin/users',
  adminVideos: '/admin/videos',
  adminMail: '/admin/mail',
  adminProfessors: '/admin/professors',
}

export const route = (path, params) => {
  let out = path
  for (const [key, value] of Object.entries(params || {})) {
    out = out.replace(`:${key}`, String(value))
  }
  return out
}
