import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import { GraduationCap, Plus, Trash2, Search, Users, ExternalLink } from 'lucide-react'
import { useProfessors, useAddProfessor, useDeleteProfessor } from '@/features/professors/hooks/useProfessors'
import { Card, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input, Label, Field } from '@/components/ui/Input'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const EMPTY = {
  university: '',
  universityRank: '',
  city: '',
  country: '',
  universityWebsite: '',
  facultyDirectory: '',
  name: '',
  title: '',
  email: '',
  department: '',
  researchFields: '',
  profileUrl: '',
}

/**
 * Faculty directory editor. Adds one professor row at a time (the form asks for
 * the university details too, because rows are denormalised) and removes rows;
 * the student page groups whatever is stored here by university.
 */
export function AdminProfessorsPage() {
  const { t } = useTranslation()
  const [form, setForm] = useState(EMPTY)
  const [q, setQ] = useState('')

  useDocumentTitle(t('admin.professors.title'))
  const { data: professors = [], isLoading } = useProfessors(q)
  const addProfessor = useAddProfessor()
  const deleteProfessor = useDeleteProfessor()

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }))

  const grouped = useMemo(() => {
    const map = new Map()
    for (const p of professors) {
      if (!map.has(p.university)) map.set(p.university, [])
      map.get(p.university).push(p)
    }
    return [...map.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  }, [professors])

  const knownUniversities = useMemo(
    () => [...new Set(professors.map((p) => p.university))],
    [professors]
  )

  const submit = (e) => {
    e.preventDefault()
    addProfessor.mutate(form, {
      onSuccess: () => {
        toast.success(t('admin.professors.added'))
        // keep the university block so several professors can be added quickly
        setForm((f) => ({
          ...EMPTY,
          university: f.university,
          city: f.city,
          country: f.country,
          universityRank: f.universityRank,
          universityWebsite: f.universityWebsite,
          facultyDirectory: f.facultyDirectory,
        }))
      },
      onError: (err) => {
        const code = err?.message || 'serverError'
        toast.error(t(`admin.professors.errors.${code}`, t('admin.professors.errors.serverError')))
      },
    })
  }

  const remove = (p) => {
    deleteProfessor.mutate(p.id, {
      onSuccess: () => toast.success(t('admin.professors.removed', { name: p.name })),
      onError: () => toast.error(t('admin.professors.errors.serverError')),
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold text-slate-900">
          <GraduationCap className="h-6 w-6 text-brand-600" />
          {t('admin.professors.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.professors.subtitle')}</p>
      </div>

      <Card>
        <CardContent className="p-5">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-slate-500">
            {t('admin.professors.addHeading')}
          </h2>
          <form onSubmit={submit} className="space-y-5">
            <fieldset className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('admin.professors.universitySection')}
              </legend>
              <Field>
                <Label htmlFor="prof-university">{t('admin.professors.university')}</Label>
                <Input
                  id="prof-university"
                  list="known-universities"
                  value={form.university}
                  onChange={set('university')}
                  placeholder={t('admin.professors.universityPlaceholder')}
                  required
                />
                <datalist id="known-universities">
                  {knownUniversities.map((u) => (
                    <option key={u} value={u} />
                  ))}
                </datalist>
              </Field>
              <Field>
                <Label htmlFor="prof-rank">{t('admin.professors.rank')}</Label>
                <Input
                  id="prof-rank"
                  type="number"
                  min="1"
                  value={form.universityRank}
                  onChange={set('universityRank')}
                  placeholder="2"
                />
              </Field>
              <Field>
                <Label htmlFor="prof-city">{t('admin.professors.city')}</Label>
                <Input id="prof-city" value={form.city} onChange={set('city')} />
              </Field>
              <Field>
                <Label htmlFor="prof-country">{t('admin.professors.country')}</Label>
                <Input id="prof-country" value={form.country} onChange={set('country')} />
              </Field>
              <Field>
                <Label htmlFor="prof-website">{t('admin.professors.website')}</Label>
                <Input
                  id="prof-website"
                  value={form.universityWebsite}
                  onChange={set('universityWebsite')}
                  placeholder="https://"
                />
              </Field>
              <Field>
                <Label htmlFor="prof-directory">{t('admin.professors.directory')}</Label>
                <Input
                  id="prof-directory"
                  value={form.facultyDirectory}
                  onChange={set('facultyDirectory')}
                  placeholder="https://"
                />
              </Field>
            </fieldset>

            <fieldset className="grid gap-4 border-t border-slate-100 pt-4 sm:grid-cols-2 lg:grid-cols-3">
              <legend className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
                {t('admin.professors.professorSection')}
              </legend>
              <Field>
                <Label htmlFor="prof-name">{t('admin.professors.name')}</Label>
                <Input
                  id="prof-name"
                  value={form.name}
                  onChange={set('name')}
                  placeholder={t('admin.professors.namePlaceholder')}
                  required
                />
              </Field>
              <Field className="lg:col-span-2">
                <Label htmlFor="prof-title">{t('admin.professors.titleLabel')}</Label>
                <Input
                  id="prof-title"
                  value={form.title}
                  onChange={set('title')}
                  placeholder={t('admin.professors.titlePlaceholder')}
                />
              </Field>
              <Field>
                <Label htmlFor="prof-email">{t('admin.professors.email')}</Label>
                <Input
                  id="prof-email"
                  type="email"
                  value={form.email}
                  onChange={set('email')}
                  placeholder="name@university.edu"
                />
              </Field>
              <Field>
                <Label htmlFor="prof-department">{t('admin.professors.department')}</Label>
                <Input id="prof-department" value={form.department} onChange={set('department')} />
              </Field>
              <Field>
                <Label htmlFor="prof-profile">{t('admin.professors.profileUrl')}</Label>
                <Input
                  id="prof-profile"
                  value={form.profileUrl}
                  onChange={set('profileUrl')}
                  placeholder="https://"
                />
              </Field>
              <Field className="sm:col-span-2 lg:col-span-3">
                <Label htmlFor="prof-fields">{t('admin.professors.researchFields')}</Label>
                <Input
                  id="prof-fields"
                  value={form.researchFields}
                  onChange={set('researchFields')}
                  placeholder={t('admin.professors.researchFieldsPlaceholder')}
                />
                <p className="mt-1 text-xs text-slate-400">
                  {t('admin.professors.researchFieldsHint')}
                </p>
              </Field>
            </fieldset>

            <Button type="submit" disabled={addProfessor.isPending}>
              <Plus className="h-4 w-4" />
              {addProfessor.isPending ? t('admin.professors.adding') : t('admin.professors.add')}
            </Button>
          </form>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
          {t('admin.professors.directory', { count: professors.length })}
        </h2>
        <div className="relative w-full max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={t('admin.professors.searchPlaceholder')}
            className="pl-9"
            aria-label={t('admin.professors.searchPlaceholder')}
          />
        </div>
      </div>

      {isLoading ? (
        <SkeletonList count={3} />
      ) : grouped.length === 0 ? (
        <Card>
          <EmptyState
            icon={Users}
            title={t('admin.professors.emptyTitle')}
            description={t('admin.professors.emptyBody')}
          />
        </Card>
      ) : (
        <div className="space-y-6">
          {grouped.map(([university, list]) => (
            <Card key={university}>
              <CardContent className="p-5">
                <div className="mb-3 flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold text-slate-800">{university}</h3>
                  <Badge variant="brand">{list.length}</Badge>
                  {list[0]?.universityWebsite && (
                    <a
                      href={list[0].universityWebsite}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="inline-flex items-center gap-1 text-xs text-brand-600 hover:underline"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                      {t('admin.professors.website')}
                    </a>
                  )}
                </div>
                <ul className="divide-y divide-slate-100">
                  {list.map((p) => (
                    <li key={p.id} className="flex items-start gap-3 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium text-slate-800">{p.name}</p>
                        <p className="text-xs text-slate-500">
                          {[p.title, p.department].filter(Boolean).join(' · ') || '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          {p.email || t('admin.professors.noEmail')}
                        </p>
                        {(p.researchFields ?? []).length > 0 && (
                          <div className="mt-1 flex flex-wrap gap-1">
                            {p.researchFields.slice(0, 5).map((f) => (
                              <span
                                key={f}
                                className="rounded-full bg-slate-100 px-2 py-0.5 text-[11px] text-slate-600"
                              >
                                {f}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => remove(p)}
                        disabled={deleteProfessor.isPending}
                        className="text-red-600 hover:bg-red-50"
                        aria-label={t('admin.professors.remove')}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export default AdminProfessorsPage
