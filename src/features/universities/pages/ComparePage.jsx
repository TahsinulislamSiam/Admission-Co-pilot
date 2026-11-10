import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Scale, X, Building2, MapPin, CalendarDays, GraduationCap } from 'lucide-react'
import { usePrivateUniversities } from '../hooks/useUniversities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { SourceLink, VerifiedBadge } from '@/components/common/SourceLink'
import { useLocale } from '@/hooks/useLocale'
import { formatBDT, formatDate } from '@/lib/utils'
import { useCompareStore } from '@/store/compareStore'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

/**
 * FR-3 — Side-by-side comparison of 2–3 private universities.
 * Rows: lowest cost, tuition, credits, waivers, deadline, sources.
 */
export default function ComparePage() {
  useDocumentTitle('nav.compare')
  const { t } = useTranslation()
  const { loc, lang } = useLocale()
  const { data: universities = [], isLoading } = usePrivateUniversities()

  const compareIds = useCompareStore((s) => s.ids)
  const remove = useCompareStore((s) => s.remove)

  const selected = universities.filter((u) => compareIds.includes(u.id))

  if (isLoading) return <PageLoader />

  if (selected.length === 0) {
    return (
      <Card>
        <EmptyState
          icon={Scale}
          title={t('universities.compareEmpty')}
          description={t('universities.compareEmptyDesc')}
          action={
            <Link to={ROUTES.privateUniversities}>
              <Button>{t('universities.browseUniversities')}</Button>
            </Link>
          }
        />
      </Card>
    )
  }

  // Shared department union for the per-department cost grid
  const allDepts = [...new Set(selected.flatMap((u) => u.departments.map((d) => d.dept)))]
  const deptCost = (u, deptKey) => {
    const d = u.departments.find((x) => x.dept === deptKey)
    return d ? d.totalCost : null
  }
  const cheapestFor = (deptKey) =>
    Math.min(
      ...selected
        .map((u) => deptCost(u, deptKey))
        .filter((v) => v != null)
    )

  const statRow = (label, render) => (
    <tr className="border-b border-slate-100">
      <th className="w-44 bg-slate-50 px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">
        {label}
      </th>
      {selected.map((u) => (
        <td key={u.id} className="px-4 py-3 text-sm">
          {render(u)}
        </td>
      ))}
    </tr>
  )

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Scale className="h-5 w-5 text-brand-600" />
          {t('universities.compareTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('universities.compareSubtitle')}</p>
      </div>

      <Card>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>
            {selected.length} × {t('nav.compare')}
          </CardTitle>
          <Link to={ROUTES.privateUniversities} className="text-sm text-brand-700 hover:underline">
            + {t('universities.browseUniversities')}
          </Link>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0">
          <table className="w-full min-w-[720px]">
            <thead>
              <tr className="border-b border-slate-200">
                <th />
                {selected.map((u) => (
                  <th key={u.id} className="px-4 pb-4 pt-2 text-left align-top">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <Link
                          to={route(ROUTES.privateUniversityDetail, { id: u.id })}
                          className="text-sm font-semibold text-slate-800 hover:text-brand-700"
                        >
                          {loc(u.name)}
                        </Link>
                        <p className="mt-0.5 flex items-center gap-1 text-xs text-slate-400">
                          <Building2 className="h-3 w-3" />
                          {loc(u.shortName)}
                        </p>
                      </div>
                      <button
                        onClick={() => remove(u.id)}
                        className="rounded-md p-1 text-slate-300 hover:bg-rose-50 hover:text-rose-500"
                        title={t('universities.removeFromCompare')}
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {statRow(t('common.city'), (u) => (
                <span className="flex items-center gap-1 text-slate-600">
                  <MapPin className="h-3.5 w-3.5 text-brand-600" />
                  {loc(u.city)}
                </span>
              ))}

              {statRow(t('universities.departmentCount', { count: '' }), (u) => (
                <span className="flex items-center gap-1 font-medium text-slate-700">
                  <GraduationCap className="h-3.5 w-3.5 text-brand-600" />
                  {u.departments.length}
                </span>
              ))}

              {statRow(t('universities.minTotalCost'), (u) => {
                const min = Math.min(...u.departments.map((d) => d.totalCost))
                const isCheapest = min === Math.min(...selected.map((x) => Math.min(...x.departments.map((d) => d.totalCost))))
                return (
                  <span className={cn('font-semibold', isCheapest ? 'text-emerald-600' : 'text-slate-700')}>
                    {formatBDT(min)}
                    {isCheapest && ' ✓'}
                  </span>
                )
              })}

              {statRow(t('universities.tuitionPerCredit'), (u) => {
                const min = Math.min(...u.departments.map((d) => d.tuitionPerCredit))
                return <span className="font-medium text-slate-700">{formatBDT(min)}</span>
              })}

              {statRow(t('universities.maxWaiver', { pct: '' }), (u) => {
                const max = Math.max(0, ...u.departments.map((d) => d.maxWaiverPct || 0))
                const isBest = max === Math.max(...selected.map((x) => Math.max(0, ...x.departments.map((d) => d.maxWaiverPct || 0))))
                return (
                  <Badge variant={isBest ? 'success' : 'default'}>
                    {max}%
                  </Badge>
                )
              })}

              {statRow(t('common.deadline'), (u) => (
                <span className="flex items-center gap-1 text-slate-600">
                  <CalendarDays className="h-3.5 w-3.5 text-brand-600" />
                  {formatDate(u.admissionDeadline, lang)}
                </span>
              ))}

              {/* per-department cost grid */}
              {allDepts.map((deptKey) =>
                statRow(t(`profile.subjects.${deptKey}`), (u) => {
                  const cost = deptCost(u, deptKey)
                  if (cost == null) return <span className="text-slate-300">—</span>
                  const isCheapest = cost === cheapestFor(deptKey)
                  return (
                    <span className={cn(isCheapest ? 'font-semibold text-emerald-600' : 'text-slate-700')}>
                      {formatBDT(cost)}
                      {isCheapest && ' ✓'}
                    </span>
                  )
                })
              )}

              {/* FR-4: source + verified */}
              {statRow(t('universities.source'), (u) => (
                <div className="flex flex-col items-start gap-1">
                  <SourceLink url={u.sourceUrl} compact />
                  <VerifiedBadge date={u.lastVerified} />
                </div>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
