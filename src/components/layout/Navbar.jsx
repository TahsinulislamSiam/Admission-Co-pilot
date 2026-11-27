import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { GraduationCap, Menu, X } from 'lucide-react'
import { ROUTES, route } from '@/routes/constants'
import { useAuthStore, selectIsAuthenticated } from '@/store/authStore'
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher'
import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils'

/** Language toggle styling for the dark forest header. */
const LANG_ON_DARK =
  'border-white/25 bg-transparent text-white hover:border-accent-500 hover:text-accent-300'

/** Top navbar for public pages (landing / auth). */
export function Navbar() {
  const { t } = useTranslation()
  const isAuthenticated = useAuthStore(selectIsAuthenticated)
  const [open, setOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-brand-600">
      <div className="container-app flex h-16 items-center justify-between">
        <Link to={ROUTES.landing} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-brand-900">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold text-white">{t('common.appName')}</span>
        </Link>

        {/* desktop */}
        <nav className="hidden items-center gap-6 md:flex">
          <a href="#how-it-works" className="relative py-1 text-sm font-medium text-white/80 transition-colors hover:text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-accent-500 after:transition-transform hover:after:scale-x-100">
            {t('landing.howTitle')}
          </a>
          <a href="#features" className="relative py-1 text-sm font-medium text-white/80 transition-colors hover:text-white after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:scale-x-0 after:bg-accent-500 after:transition-transform hover:after:scale-x-100">
            {t('landing.featuresTitle')}
          </a>
          <LanguageSwitcher className={LANG_ON_DARK} />
          {isAuthenticated ? (
            <Link to={ROUTES.dashboard}>
              <Button variant="accent" size="sm">
                {t('nav.dashboard')}
              </Button>
            </Link>
          ) : (
            <>
              <Link to={ROUTES.login}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-white/90 hover:bg-white/10 hover:text-white"
                >
                  {t('nav.login')}
                </Button>
              </Link>
              <Link to={ROUTES.register}>
                <Button variant="accent" size="sm">
                  {t('nav.getStarted')}
                </Button>
              </Link>
            </>
          )}
        </nav>

        {/* mobile */}
        <div className="flex items-center gap-2 md:hidden">
          <LanguageSwitcher className={cn(LANG_ON_DARK, 'px-2')} />
          <button
            onClick={() => setOpen(!open)}
            className="rounded-lg p-2 text-white/90 hover:bg-white/10"
            aria-label={t('nav.openMenu')}
          >
            {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/10 bg-brand-700 px-4 py-3 md:hidden">
          <div className="flex flex-col gap-3">
            <a href="#how-it-works" onClick={() => setOpen(false)} className="text-sm font-medium text-white/90">
              {t('landing.howTitle')}
            </a>
            <a href="#features" onClick={() => setOpen(false)} className="text-sm font-medium text-white/90">
              {t('landing.featuresTitle')}
            </a>
            {isAuthenticated ? (
              <Link to={ROUTES.dashboard}>
                <Button variant="accent" className="w-full" size="sm">
                  {t('nav.dashboard')}
                </Button>
              </Link>
            ) : (
              <div className="flex gap-2">
                <Link to={ROUTES.login} className="flex-1">
                  <Button
                    variant="ghost"
                    className="w-full border border-white/25 text-white hover:bg-white/10 hover:text-white"
                    size="sm"
                  >
                    {t('nav.login')}
                  </Button>
                </Link>
                <Link to={ROUTES.register} className="flex-1">
                  <Button variant="accent" className="w-full" size="sm">
                    {t('nav.getStarted')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}

/** Footer for public pages. */
export function Footer() {
  const { t } = useTranslation()
  return (
    <footer className="mt-24 border-t border-slate-200 bg-white">
      <div className="container-app grid gap-10 py-12 md:grid-cols-4">
        <div className="md:col-span-1">
          <div className="flex items-center gap-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <GraduationCap className="h-4 w-4" />
            </span>
            <span className="font-semibold text-slate-900">{t('common.appName')}</span>
          </div>
          <p className="mt-3 text-sm leading-relaxed text-slate-500">{t('footer.aboutDesc')}</p>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{t('footer.quickLinks')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li><a href="#how-it-works" className="hover:text-brand-700">{t('landing.howTitle')}</a></li>
            <li><a href="#features" className="hover:text-brand-700">{t('landing.featuresTitle')}</a></li>
            <li><Link to={ROUTES.login} className="hover:text-brand-700">{t('nav.login')}</Link></li>
            <li><Link to={ROUTES.register} className="hover:text-brand-700">{t('nav.register')}</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{t('footer.forStudents')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>{t('nav.publicUniversities')}</li>
            <li>{t('nav.privateUniversities')}</li>
            <li>{t('nav.mockTests')}</li>
            <li>{t('nav.assistant')}</li>
          </ul>
        </div>
        <div>
          <h4 className="text-sm font-semibold text-slate-800">{t('footer.legal')}</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-500">
            <li>{t('footer.privacy')}</li>
            <li>{t('footer.terms')}</li>
            <li>{t('footer.contact')}</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4">
        <div className="container-app flex flex-col items-center justify-between gap-2 text-xs text-slate-400 sm:flex-row">
          <span>{t('footer.rights', { year: new Date().getFullYear() })}</span>
          <span className="max-w-md text-center sm:text-right">{t('footer.disclaimer')}</span>
        </div>
      </div>
    </footer>
  )
}

/** Auth pages use a slim header without navigation. */
export function AuthNavbar() {
  const { t } = useTranslation()
  return (
    <header className="border-b border-white/10 bg-brand-600">
      <div className="container-app flex h-16 items-center justify-between">
        <Link to={ROUTES.landing} className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent-500 text-brand-900">
            <GraduationCap className="h-5 w-5" />
          </span>
          <span className="font-display text-xl font-semibold text-white">{t('common.appName')}</span>
        </Link>
        <LanguageSwitcher className={LANG_ON_DARK} />
      </div>
    </header>
  )
}

export { route }
