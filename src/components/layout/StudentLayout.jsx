import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { toast } from 'react-hot-toast'
import {
  GraduationCap,
  LayoutDashboard,
  UserRound,
  Building2,
  Landmark,
  Scale,
  MessagesSquare,
  Sparkles,
  FileStack,
  LogOut,
  Menu,
  X,
  ShieldCheck,
} from 'lucide-react'
import { ROUTES } from '@/routes/constants'
import { useAuthStore } from '@/store/authStore'
import { useUiStore } from '@/store/uiStore'
import { authService } from '@/services/authService'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { cn } from '@/lib/utils'

const navItems = [
  { to: ROUTES.dashboard, icon: LayoutDashboard, key: 'nav.dashboard' },
  { to: ROUTES.profile, icon: UserRound, key: 'nav.profile' },
  { to: ROUTES.publicUniversities, icon: Landmark, key: 'nav.publicUniversities' },
  { to: ROUTES.privateUniversities, icon: Building2, key: 'nav.privateUniversities' },
  { to: ROUTES.compare, icon: Scale, key: 'nav.compare' },
  { to: ROUTES.assistant, icon: MessagesSquare, key: 'nav.assistant' },
  { to: ROUTES.recommendations, icon: Sparkles, key: 'nav.recommendations' },
  { to: ROUTES.tests, icon: FileStack, key: 'nav.mockTests' },
]

/** Student app shell: fixed sidebar + topbar + content area. */
export function StudentLayout() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const user = useAuthStore((s) => s.user)
  const isAdmin = useAuthStore((s) => s.user?.role === 'admin')
  const { sidebarOpen, toggleSidebar, setSidebarOpen } = useUiStore()

  const handleLogout = () => {
    authService.logout()
    toast.success(t('nav.logout'))
    navigate(ROUTES.landing, { replace: true })
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      {/* Sidebar (desktop) */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-slate-200 bg-white lg:flex">
        <SidebarContent
          user={user}
          isAdmin={isAdmin}
          onLogout={handleLogout}
          t={t}
        />
      </aside>

      {/* Sidebar (mobile drawer) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-slate-900/50" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-white shadow-xl">
            <SidebarContent
              user={user}
              isAdmin={isAdmin}
              onLogout={handleLogout}
              t={t}
              onClose={() => setSidebarOpen(false)}
            />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex min-h-screen flex-1 flex-col lg:pl-64">
        <header className="sticky top-0 z-20 flex h-16 items-center justify-between border-b border-slate-200 bg-white/90 px-4 backdrop-blur sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
              aria-label={t('nav.openMenu')}
            >
              {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <span className="hidden items-center gap-2 sm:flex">
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
                <GraduationCap className="h-4 w-4" />
              </span>
              <span className="font-bold text-slate-900">{t('common.appName')}</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
              {(user?.name || 'U').slice(0, 1)}
            </div>
          </div>
        </header>

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  )
}

/** Shared sidebar innards for desktop + mobile drawers. */
function SidebarContent({ user, isAdmin, onLogout, t, onClose }) {
  return (
    <>
      <div className="flex h-16 items-center justify-between border-b border-slate-100 px-5">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="text-base font-bold text-slate-900">{t('common.appName')}</span>
        </div>
        {onClose && (
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600">
            <X className="h-5 w-5" />
          </button>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4 scrollbar-slim">
        {navItems.map(({ to, icon: Icon, key }) => (
          <NavLink
            key={to}
            to={to}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-brand-50 text-brand-800'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              )
            }
          >
            <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
            {t(key)}
          </NavLink>
        ))}

        {isAdmin && (
          <NavLink
            to={ROUTES.adminOverview}
            onClick={onClose}
            className={({ isActive }) =>
              cn(
                'mt-4 flex items-center gap-3 rounded-lg border border-dashed border-brand-300 px-3 py-2.5 text-sm font-medium',
                isActive ? 'bg-brand-50 text-brand-800' : 'text-brand-700 hover:bg-brand-50'
              )
            }
          >
            <ShieldCheck className="h-[18px] w-[18px]" />
            {t('nav.admin')}
          </NavLink>
        )}
      </nav>

      <div className="border-t border-slate-100 p-4">
        <div className="mb-3 flex items-center gap-3 px-1">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-sm font-semibold text-brand-800">
            {(user?.name || 'U').slice(0, 1)}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-800">{user?.name}</p>
            <p className="truncate text-xs text-slate-400">{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-slate-500 hover:bg-rose-50 hover:text-rose-600"
        >
          <LogOut className="h-4 w-4" />
          {t('nav.logout')}
        </button>
      </div>
    </>
  )
}
