import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { LogIn } from 'lucide-react'
import { AuthNavbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { DemoAccounts } from '../components/DemoAccounts'
import { loginSchema } from '../validation'
import { authService } from '@/services/authService'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useEffect } from 'react'

/** Login page. On success redirects to `from` location or dashboard. */
export default function LoginPage() {
  useDocumentTitle('nav.login')
  const { t } = useTranslation()
  const navigate = useNavigate()
  const location = useLocation()

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  })

  // Block navigation when already submitting
  useEffect(() => {}, [])

  const onSubmit = async (values) => {
    try {
      const { user } = await authService.login(values)
      toast.success(t('auth.loginSuccess'))
      const from = location.state?.from
      if (user.role === 'admin' && !from) navigate(ROUTES.adminOverview, { replace: true })
      else navigate(from || ROUTES.dashboard, { replace: true })
    } catch (e) {
      const msg =
        e.message === 'userNotFound'
          ? 'userNotFound'
          : e.message === 'invalidCredentials'
            ? 'invalidCredentials'
            : 'generic'
      setError('email', { message: msg })
      setError('password', { message: ' ' })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthNavbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          <h1 className="text-xl font-bold text-slate-900">{t('auth.loginTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.loginSubtitle')}</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6">
            <Field label={t('auth.email')} error={t(`auth.errors.${errors.email?.message}`, { defaultValue: '' })}>
              <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
            </Field>
            <Field label={t('auth.password')} error={t(`auth.errors.${errors.password?.message}`, { defaultValue: '' })}>
              <Input type="password" placeholder="••••••••" autoComplete="current-password" {...register('password')} />
            </Field>

            <div className="mb-4 text-right">
              <Link to={ROUTES.forgotPassword} className="text-sm font-medium text-brand-700 hover:underline">
                {t('auth.forgotLink')}
              </Link>
            </div>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              {!isSubmitting && <LogIn className="h-4 w-4" />}
              {t('auth.loginCta')}
            </Button>
          </form>

          <DemoAccounts onFill={(v) => { setValue('email', v.email); setValue('password', v.password) }} />

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.dontHave')}{' '}
            <Link to={ROUTES.register} className="font-semibold text-brand-700 hover:underline">
              {t('nav.register')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
