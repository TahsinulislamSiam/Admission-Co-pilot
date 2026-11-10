import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { KeyRound, MailCheck } from 'lucide-react'
import { AuthNavbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { forgotSchema } from '../validation'
import { authService } from '@/services/authService'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Forgot password — mock backend always "sends" the email. */
export default function ForgotPasswordPage() {
  useDocumentTitle('auth.forgotLink')
  const { t } = useTranslation()
  const [sent, setSent] = useState(false)
  const [sentTo, setSentTo] = useState('')

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm({ resolver: zodResolver(forgotSchema), defaultValues: { email: '' } })

  const onSubmit = async (values) => {
    try {
      await authService.forgotPassword(values.email)
      setSentTo(values.email)
      setSent(true)
    } catch (e) {
      setError('email', { message: e.message === 'userNotFound' ? 'userNotFound' : 'generic' })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthNavbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          {sent ? (
            <div className="py-8 text-center">
              <div className="mx-auto mb-4 w-fit rounded-full bg-brand-50 p-4">
                <MailCheck className="h-8 w-8 text-brand-600" />
              </div>
              <h1 className="text-lg font-bold text-slate-900">{t('auth.resetSentTitle')}</h1>
              <p className="mt-2 text-sm text-slate-500">
                {t('auth.resetSentDesc')} <span className="font-medium text-slate-700">{sentTo}</span>
              </p>
              <Link to={ROUTES.login}>
                <Button variant="outline" className="mt-6">
                  {t('auth.backToLogin')}
                </Button>
              </Link>
            </div>
          ) : (
            <>
              <h1 className="text-xl font-bold text-slate-900">{t('auth.forgotTitle')}</h1>
              <p className="mt-1 text-sm text-slate-500">{t('auth.forgotSubtitle')}</p>

              <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6">
                <Field label={t('auth.email')} error={t(`auth.errors.${errors.email?.message}`, { defaultValue: '' })}>
                  <Input type="email" placeholder="you@example.com" {...register('email')} />
                </Field>
                <Button type="submit" className="w-full" loading={isSubmitting}>
                  {!isSubmitting && <KeyRound className="h-4 w-4" />}
                  {t('auth.sendResetLink')}
                </Button>
              </form>

              <p className="mt-6 text-center text-sm">
                <Link to={ROUTES.login} className="font-semibold text-brand-700 hover:underline">
                  {t('auth.backToLogin')}
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
