import { lazy, Suspense } from 'react'
import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ROUTES } from '@/routes/constants'
import { ProtectedRoute } from '@/routes/ProtectedRoute'
import { RoleRoute } from '@/routes/RoleRoute'
import { PageLoader } from '@/components/common/Loader'
import { NotFoundPage } from '@/features/misc/pages/NotFoundPage'
import { StudentLayout } from '@/components/layout/StudentLayout'
import { AdminLayout } from '@/components/layout/AdminLayout'

// --- public pages (lazy) ---
const LandingPage = lazy(() => import('@/features/landing/pages/LandingPage'))
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'))
const RegisterPage = lazy(() => import('@/features/auth/pages/RegisterPage'))
const ForgotPasswordPage = lazy(() => import('@/features/auth/pages/ForgotPasswordPage'))

// --- student pages (lazy) ---
const DashboardPage = lazy(() => import('@/features/dashboard/pages/DashboardPage'))
const ProfilePage = lazy(() => import('@/features/auth/pages/ProfilePage'))
const PublicHubPage = lazy(() => import('@/features/universities/pages/PublicHubPage'))
const PublicDetailPage = lazy(() => import('@/features/universities/pages/PublicDetailPage'))
const PrivateDirectoryPage = lazy(() =>
  import('@/features/universities/pages/PrivateDirectoryPage')
)
const PrivateDetailPage = lazy(() => import('@/features/universities/pages/PrivateDetailPage'))
const ComparePage = lazy(() => import('@/features/universities/pages/ComparePage'))
const AssistantPage = lazy(() => import('@/features/assistant/pages/AssistantPage'))
const RecommendationsPage = lazy(() =>
  import('@/features/recommendations/pages/RecommendationsPage')
)
const TestListPage = lazy(() => import('@/features/mock-tests/pages/TestListPage'))
const InstructionsPage = lazy(() => import('@/features/mock-tests/pages/InstructionsPage'))
const TestEnginePage = lazy(() => import('@/features/mock-tests/pages/TestEnginePage'))
const ResultPage = lazy(() => import('@/features/analysis/pages/ResultPage'))

// --- admin pages (lazy) ---
const AdminOverviewPage = lazy(() => import('@/features/admin/pages/AdminOverviewPage'))
const CircularUploadPage = lazy(() => import('@/features/admin/pages/CircularUploadPage'))
const CircularReviewPage = lazy(() => import('@/features/admin/pages/CircularReviewPage'))
const RecordsPage = lazy(() => import('@/features/admin/pages/RecordsPage'))
const QuestionReviewPage = lazy(() => import('@/features/admin/pages/QuestionReviewPage'))

/** Wrap a lazy page in the shared Suspense loader. */
const lz = (Component) => (
  <Suspense fallback={<PageLoader />}>
    <Component />
  </Suspense>
)

export const router = createBrowserRouter([
  // -------- public --------
  {
    path: ROUTES.landing,
    element: lz(LandingPage),
  },
  {
    path: ROUTES.login,
    element: lz(LoginPage),
  },
  {
    path: ROUTES.register,
    element: lz(RegisterPage),
  },
  {
    path: ROUTES.forgotPassword,
    element: lz(ForgotPasswordPage),
  },

  // -------- student (protected) --------
  {
    path: ROUTES.app,
    element: <ProtectedRoute />,
    children: [
      { index: true, element: <Navigate to={ROUTES.dashboard} replace /> },
      {
        element: <StudentLayout />,
        children: [
          { path: 'dashboard', element: lz(DashboardPage) },
          { path: 'profile', element: lz(ProfilePage) },
          { path: 'public-universities', element: lz(PublicHubPage) },
          { path: 'public-universities/:id', element: lz(PublicDetailPage) },
          { path: 'private-universities', element: lz(PrivateDirectoryPage) },
          { path: 'private-universities/:id', element: lz(PrivateDetailPage) },
          { path: 'compare', element: lz(ComparePage) },
          { path: 'assistant', element: lz(AssistantPage) },
          { path: 'recommendations', element: lz(RecommendationsPage) },
          { path: 'tests', element: lz(TestListPage) },
          { path: 'results/:attemptId', element: lz(ResultPage) },
        ],
      },
      // Full-screen routes outside the sidebar layout
      { path: 'tests/:id/instructions', element: lz(InstructionsPage) },
      { path: 'tests/:id/engine', element: lz(TestEnginePage) },
    ],
  },

  // -------- admin (role-protected) --------
  {
    path: ROUTES.admin,
    element: <RoleRoute />,
    children: [
      { index: true, element: <Navigate to={ROUTES.adminOverview} replace /> },
      {
        element: <AdminLayout />,
        children: [
          { path: 'overview', element: lz(AdminOverviewPage) },
          { path: 'circulars', element: lz(CircularUploadPage) },
          { path: 'records', element: lz(RecordsPage) },
          { path: 'questions', element: lz(QuestionReviewPage) },
        ],
      },
      { path: 'circulars/:id/review', element: lz(CircularReviewPage) },
    ],
  },

  {
    path: '*',
    element: <NotFoundPage />,
  },
])
