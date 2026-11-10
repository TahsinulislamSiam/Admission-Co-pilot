import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Wallet,
  BadgePercent,
  CalendarDays,
  Percent,
} from 'lucide-react'
import { usePrivateUniversity } from '../hooks/useUniversities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { SourceLink, VerifiedBadge } from '@/components/common/SourceLink'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { useLocale } from '@/hooks/useLocale'
import { formatDate, formatBDT } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/lib/utils'

/** Private university detail: departments table with cost breakdown + waiver rules (FR-3/FR-4). */
export default function PrivateDetailPage() {
  const { id } = useParams()
  useDocumentTitle('nav.privateUniversities')
  const { t } = useTranslation()
  const { loc, lang } = useLocale()
  const { data: u, isLoading } = usePrivateUniversity(id)
  const profile = useAuthStore((s) => s.user?.profile)

  if (isLoading) return <PageLoader />
  if (!u)
    return (
      <EmptyState
        icon={Building2}
        title={t('universities.noResults')}
        description={t('universities.noResultsDesc')}
      />
    )

  const mySsc = profile?.sscGpa ?? 0
  const myHsc = profile?.hscGpa ?? 0

  /** Best waiver the student qualifies for on a department. */
  const myWaiver = (d) =>
    (d.waiverRules || [])
      .filter((w) => mySsc >= w.minSscGpa && myHsc >= w.minHscGpa)
      .sort((a, b) => b.discountPct - a.discountPct)[0]

  const sortedDepts = [...u.departments].sort((a, b) => a.totalCost - b.totalCost)

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to={ROUTES.privateUniversities}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('universities.detail.backToList')}
      </Link>

      {/* Header */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Building2 className="h-6 w-6" />
                </span>
                <div>
                  <h1 className="text-xl font-bold text-slate-900">{loc(u.name)}</h1>
                  <p className="mt-0.5 text-sm text-slate-500">
                    {loc(u.shortName)} · {t('universities.established')} {u.established}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  {loc(u.city)}
                </span>
                <span className="flex items-center gap-1.5">
                  <CalendarDays className="h-4 w-4 text-brand-600" />
                  {t('common.deadline')}: {formatDate(u.admissionDeadline, lang)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-brand-600" />
                  {t('universities.admissionFee')}: {formatBDT(u.admissionFee)}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SourceLink url={u.sourceUrl} />
              <VerifiedBadge date={u.lastVerified} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments with per-dept cost + waivers */}
      <Card>
        <CardHeader>
          <CardTitle>{t('universities.units')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full border-0">
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>{t('universities.table.dept')}</TH>
                  <TH className="text-right">{t('universities.table.credits')}</TH>
                  <TH className="text-right">{t('universities.table.perCredit')}</TH>
                  <TH className="text-right">{t('universities.table.totalCost')}</TH>
                  <TH>{t('universities.table.waiver')}</TH>
                  <TH>{t('universities.deadline')}</TH>
                </TR>
              </THead>
              <TBody>
                {sortedDepts.map((d) => {
                  const w = myWaiver(d)
                  const costAfter = w
                    ? Math.round(d.totalCost * (1 - w.discountPct / 100))
                    : d.totalCost
                  return (
                    <TR key={d.id}>
                      <TD>
                        <span className="font-medium text-slate-800">{loc(d.name)}</span>
                        <p className="text-xs text-slate-400">
                          {t(`profile.subjects.${d.dept}`)} · {d.seats} {t('common.seats')}
                        </p>
                      </TD>
                      <TD className="text-right">{d.credits}</TD>
                      <TD className="text-right">{formatBDT(d.tuitionPerCredit)}</TD>
                      <TD className="text-right">
                        <span className="font-semibold text-slate-900">{formatBDT(costAfter)}</span>
                        {w && (
                          <p className="text-[11px] text-emerald-600 line-through">
                            {formatBDT(d.totalCost)}
                          </p>
                        )}
                      </TD>
                      <TD>
                        {w ? (
                          <Badge variant="success">
                            <Percent className="h-3 w-3" />
                            {w.discountPct}%
                          </Badge>
                        ) : (
                          <span className="text-xs text-slate-400">—</span>
                        )}
                      </TD>
                      <TD className="text-sm">{formatDate(d.deadline, lang)}</TD>
                    </TR>
                  )
                })}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Waiver rules detail */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BadgePercent className="h-4 w-4 text-brand-600" />
            {t('universities.waiverRules')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {u.departments.map((d) => (
            <div key={d.id} className="rounded-lg border border-slate-100 bg-slate-50/50 p-4">
              <p className="mb-2 text-sm font-semibold text-slate-700">{loc(d.name)}</p>
              <ul className="space-y-1.5">
                {(d.waiverRules || []).map((w, i) => {
                  const qualifies = mySsc >= w.minSscGpa && myHsc >= w.minHscGpa
                  return (
                    <li
                      key={i}
                      className={cn(
                        'flex items-start gap-2 text-sm',
                        qualifies ? 'text-slate-700' : 'text-slate-400'
                      )}
                    >
                      <span
                        className={cn(
                          'mt-0.5 rounded-full px-2 py-0.5 text-[11px] font-semibold',
                          qualifies ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-200 text-slate-500'
                        )}
                      >
                        {w.discountPct}%
                      </span>
                      {loc(w)}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </CardContent>
      </Card>

      <div className="mt-6 flex justify-end">
        <Link to={route(ROUTES.compare, {})}>
          <Button variant="secondary">{t('universities.goCompare')}</Button>
        </Link>
      </div>
    </div>
  )
}
