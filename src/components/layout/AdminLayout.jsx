import { NavLink, Link, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import {
  GraduationCap,
  LayoutDashboard,
  FileUp,
  Database,
  ClipboardCheck,
  LogOut,
  ArrowLeft,
} from 'lucide-react'
import { ROUTES } from '@/routes/constants'
import { useAuthStore } from '@/store/authStore'
import { authService } from '@/services/authService'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { cn } from '@/lib/utils'

const adminNav = [
  { to: ROUTES.adminOverview, icon: LayoutDashboard, key: 'admin.nav.overview' },
  { to: ROUTES.adminCirculars, icon: FileUp, key: 'admin.nav.circulars' },
  { to: ROUTES.adminRecords, icon: Database, key: 'admin.nav.universities' },
  { to: ROUTES.adminQuestions, icon: ClipboardCheck, key: 'admin.nav.questions' },
]

/** Admin app shell. */
export function AdminLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)

  const handleLogout = () => {
    authService.logout()
    toast.success(t('nav.logout'))
    navigate(ROUTES.landing, { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col border-r border-slate-200 bg-slate-900 lg:flex">
        <Link
          to={ROUTES.landing}
          className="flex h-16 items-center gap-2 border-b border-slate-800 px-5 transition-colors hover:bg-slate-800/60"
          aria-label={t('nav.home')}
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <div>
            <p className="text-sm font-bold text-white">{t('admin.title')}</p>
            <p className="text-[11px] text-slate-400">{t('common.appName')}</p>
          </div>
        </Link>

        <nav className="flex-1 space-y-1 px-3 py-4">
          {adminNav.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-brand-600/20 text-brand-300'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <Icon className="h-[18px] w-[18px]" />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <div className="space-y-1 border-t border-slate-800 p-4">
          <NavLink
            to={ROUTES.dashboard}
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-slate-800 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('nav.dashboard')}
          </NavLink>
          <button
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-slate-400 hover:bg-rose-500/10 hover:text-rose-400"
          >
            <LogOut className="h-4 w-4" />
            {t('nav.logout')}
          </button>
          <p className="truncate px-3 pt-2 text-xs text-slate-500">{user?.email}</p>
        </div>
      </aside>

      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <p className="text-sm font-semibold text-slate-700">
              {t('admin.subtitle')}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="hidden items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-medium text-amber-700 sm:flex">
              {t('admin.circulars.approvalNote')}
            </div>
            <LanguageSwitcher />
          </div>
        </header>

        <nav className="flex gap-1 overflow-x-auto border-b border-slate-200 bg-white px-4 py-2 lg:hidden">
          {adminNav.map(({ to, icon: Icon, key }) => (
            <NavLink
              key={to}
              to={to}
              className={({ isActive }) =>
                cn(
                  'flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium',
                  isActive ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-600'
                )
              }
            >
              <Icon className="h-3.5 w-3.5" />
              {t(key)}
            </NavLink>
          ))}
        </nav>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}
