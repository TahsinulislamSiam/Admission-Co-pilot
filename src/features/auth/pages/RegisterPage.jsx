import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { UserPlus } from 'lucide-react'
import { AuthNavbar } from '@/components/layout/Navbar'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { RadioGroup, Radio } from '@/components/ui/FormControls'
import { registerSchema } from '../validation'
import { authService } from '@/services/authService'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Register page (FR-1 starting point): basic details + GPA + group. */
export default function RegisterPage() {
  useDocumentTitle('nav.register')
  const { t } = useTranslation()
  const navigate = useNavigate()

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setError,
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
      confirmPassword: '',
      sscGpa: '',
      hscGpa: '',
      group: 'science',
    },
  })

  const onSubmit = async (values) => {
    try {
      const { user } = await authService.register(values)
      toast.success(t('auth.registerSuccess', { name: user.name }))
      navigate(ROUTES.profile, { replace: true })
    } catch (e) {
      setError('email', { message: e.message === 'emailExists' ? 'emailExists' : 'generic' })
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <AuthNavbar />
      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
          <h1 className="text-xl font-bold text-slate-900">{t('auth.registerTitle')}</h1>
          <p className="mt-1 text-sm text-slate-500">{t('auth.registerSubtitle')}</p>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="mt-6">
            <Field label={t('auth.fullName')} error={t(`auth.errors.${errors.name?.message}`, { defaultValue: '' })}>
              <Input placeholder="রাকিব হাসান" autoComplete="name" {...register('name')} />
            </Field>
            <Field label={t('auth.email')} error={t(`auth.errors.${errors.email?.message}`, { defaultValue: '' })}>
              <Input type="email" placeholder="you@example.com" autoComplete="email" {...register('email')} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t('auth.password')} error={t(`auth.errors.${errors.password?.message}`, { defaultValue: '' })}>
                <Input type="password" autoComplete="new-password" {...register('password')} />
              </Field>
              <Field label={t('auth.confirmPassword')} error={t(`auth.errors.${errors.confirmPassword?.message}`, { defaultValue: '' })}>
                <Input type="password" autoComplete="new-password" {...register('confirmPassword')} />
              </Field>
            </div>

            <div className="my-5 h-px bg-slate-100" />

            <div className="grid grid-cols-2 gap-3">
              <Field label={t('profile.sscGpa')} hint={t('profile.gpaHint')} error={t(`profile.errors.${errors.sscGpa?.message}`, { defaultValue: '' })}>
                <Input type="number" step="0.01" min="0" max="5" placeholder="5.00" {...register('sscGpa')} />
              </Field>
              <Field label={t('profile.hscGpa')} hint={t('profile.gpaHint')} error={t(`profile.errors.${errors.hscGpa?.message}`, { defaultValue: '' })}>
                <Input type="number" step="0.01" min="0" max="5" placeholder="4.75" {...register('hscGpa')} />
              </Field>
            </div>

            <Field label={t('profile.group')}>
              <RadioGroup defaultValue="science" className="flex flex-wrap gap-3">
                {['science', 'commerce', 'arts'].map((g) => (
                  <label key={g} className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
                    <Radio value={g} {...register('group')} />
                    {t(`profile.groups.${g}`)}
                  </label>
                ))}
              </RadioGroup>
            </Field>

            <Button type="submit" className="w-full" loading={isSubmitting}>
              {!isSubmitting && <UserPlus className="h-4 w-4" />}
              {t('auth.registerCta')}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            {t('auth.alreadyHave')}{' '}
            <Link to={ROUTES.login} className="font-semibold text-brand-700 hover:underline">
              {t('nav.login')}
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
