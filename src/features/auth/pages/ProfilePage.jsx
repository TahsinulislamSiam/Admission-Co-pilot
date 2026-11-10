import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { UserRound, Save, GraduationCap, Wallet, Heart } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Input, Field } from '@/components/ui/Input'
import { Checkbox } from '@/components/ui/FormControls'
import { Progress } from '@/components/ui/Progress'
import { profileSchema } from '../validation'
import { authService } from '@/services/authService'
import { useAuthStore } from '@/store/authStore'
import { GROUPS, DEPARTMENT_NAMES } from '@/lib/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

const CITY_KEYS = ['Dhaka', 'Chattogram', 'Rajshahi', 'Khulna', 'Sylhet', 'Gazipur']

/**
 * FR-1 — Student profile: SSC/HSC GPA (Zod-validated 0–5), group,
 * budget and preferences. Everything downstream (recommendations,
 * analytics) depends on these fields.
 */
export default function ProfilePage() {
  useDocumentTitle('nav.profile')
  const { t } = useTranslation()
  const user = useAuthStore((s) => s.user)
  const p = user?.profile || {}

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user?.name || '',
      phone: p.phone || '',
      sscGpa: p.sscGpa ?? '',
      hscGpa: p.hscGpa ?? '',
      group: p.group || 'science',
      budget: p.budget ?? '',
      preferredSubjects: p.preferredSubjects || [],
      preferredCities: p.preferredCities || [],
      needsHostel: Boolean(p.needsHostel),
    },
  })

  const watched = watch()

  // Profile completeness meter — encourages filling GPA/group/budget
  const completeness = (() => {
    let filled = 0
    const total = 7
    if (watched.name) filled++
    if (watched.sscGpa !== '' && watched.sscGpa != null) filled++
    if (watched.hscGpa !== '' && watched.hscGpa != null) filled++
    if (watched.group) filled++
    if (watched.budget !== '' && watched.budget != null) filled++
    if (watched.preferredSubjects?.length) filled++
    if (watched.preferredCities?.length) filled++
    return Math.round((filled / total) * 100)
  })()

  const toggleArrayValue = (field, value) => {
    const current = watched[field] || []
    const next = current.includes(value)
      ? current.filter((v) => v !== value)
      : [...current, value]
    setValue(field, next, { shouldDirty: true })
  }

  const onSubmit = async (values) => {
    try {
      await authService.updateProfile(values)
      toast.success(t('profile.saved'))
    } catch {
      toast.error(t('common.error'))
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-slate-900">{t('profile.title')}</h1>
        <p className="mt-1 text-sm text-slate-500">{t('profile.subtitle')}</p>
      </div>

      {/* Completeness */}
      <Card className="mb-6">
        <CardContent className="py-4">
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-slate-700">{t('profile.completeness')}</span>
            <span className="font-bold text-brand-700">{completeness}%</span>
          </div>
          <Progress value={completeness} />
          {completeness < 60 && (
            <p className="mt-2 text-xs text-amber-600">{t('profile.completeToRecommend')}</p>
          )}
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
        {/* Account */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-brand-600" />
              {t('profile.accountSection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field label={t('auth.fullName')} error={t(`auth.errors.${errors.name?.message}`, { defaultValue: '' })}>
                <Input {...register('name')} />
              </Field>
              <Field label={`${t('profile.phone')} (${t('common.optional')})`}>
                <Input placeholder="017XXXXXXXX" {...register('phone')} />
              </Field>
            </div>
            <p className="text-xs text-slate-400">{user?.email}</p>
          </CardContent>
        </Card>

        {/* Academic */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-4 w-4 text-brand-600" />
              {t('profile.academicSection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-x-4 sm:grid-cols-2">
              <Field
                label={t('profile.sscGpa')}
                hint={t('profile.gpaHint')}
                error={t(`profile.errors.${errors.sscGpa?.message}`, { defaultValue: '' })}
              >
                <Input type="number" step="0.01" min="0" max="5" placeholder="5.00" {...register('sscGpa')} />
              </Field>
              <Field
                label={t('profile.hscGpa')}
                hint={t('profile.gpaHint')}
                error={t(`profile.errors.${errors.hscGpa?.message}`, { defaultValue: '' })}
              >
                <Input type="number" step="0.01" min="0" max="5" placeholder="4.75" {...register('hscGpa')} />
              </Field>
            </div>

            <Field label={t('profile.group')} error={t(`profile.errors.${errors.group?.message}`, { defaultValue: '' })}>
              <div className="flex flex-wrap gap-2">
                {GROUPS.map((g) => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => setValue('group', g, { shouldDirty: true })}
                    className={cn(
                      'rounded-lg border px-4 py-2 text-sm font-medium transition-colors',
                      watched.group === g
                        ? 'border-brand-600 bg-brand-50 text-brand-800'
                        : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                    )}
                  >
                    {t(`profile.groups.${g}`)}
                  </button>
                ))}
              </div>
              <input type="hidden" {...register('group')} />
            </Field>
          </CardContent>
        </Card>

        {/* Preferences & budget */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Wallet className="h-4 w-4 text-brand-600" />
              {t('profile.preferencesSection')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Field
              label={t('profile.budget')}
              hint={t('profile.budgetHint')}
              error={t(`profile.errors.${errors.budget?.message}`, { defaultValue: '' })}
            >
              <Input type="number" step="1000" min="0" placeholder="600000" {...register('budget')} />
            </Field>

            <Field label={t('profile.preferredSubjects')}>
              <div className="flex flex-wrap gap-2">
                {Object.keys(DEPARTMENT_NAMES).map((s) => {
                  const active = watched.preferredSubjects?.includes(s)
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => toggleArrayValue('preferredSubjects', s)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-brand-600 bg-brand-50 text-brand-800'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {t(`profile.subjects.${s}`)}
                    </button>
                  )
                })}
              </div>
            </Field>

            <Field label={t('profile.preferredCities')}>
              <div className="flex flex-wrap gap-2">
                {CITY_KEYS.map((c) => {
                  const active = watched.preferredCities?.includes(c)
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => toggleArrayValue('preferredCities', c)}
                      className={cn(
                        'rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors',
                        active
                          ? 'border-brand-600 bg-brand-50 text-brand-800'
                          : 'border-slate-300 text-slate-600 hover:bg-slate-50'
                      )}
                    >
                      {t(`profile.cities.${c}`)}
                    </button>
                  )
                })}
              </div>
            </Field>

            <label className="flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
              <Heart className="h-4 w-4 text-brand-600" />
              <span className="flex-1 text-sm font-medium text-slate-700">
                {t('profile.needsHostel')}
              </span>
              <Checkbox
                checked={Boolean(watched.needsHostel)}
                onCheckedChange={(v) => setValue('needsHostel', Boolean(v), { shouldDirty: true })}
              />
            </label>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" loading={isSubmitting} disabled={!isDirty && !isSubmitting}>
            {!isSubmitting && <Save className="h-4 w-4" />}
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </div>
      </form>
    </div>
  )
}
