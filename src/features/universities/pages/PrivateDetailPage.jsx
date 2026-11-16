import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Building2,
  MapPin,
  Wallet,
  CalendarDays,
  Info,
} from 'lucide-react'
import { usePrivateUniversity } from '../hooks/useUniversities'
import { privateUniversitiesMeta } from '@/mocks/seed/privateUniversities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { PageLoader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { SourceLink, VerifiedBadge } from '@/components/common/SourceLink'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { useLocale } from '@/hooks/useLocale'
import { formatBDT } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** Private university detail: departments with estimated total degree cost (FR-3/FR-4). */
export default function PrivateDetailPage() {
  const { id } = useParams()
  useDocumentTitle('nav.privateUniversities')
  const { t } = useTranslation()
  const { loc } = useLocale()
  const { data: u, isLoading } = usePrivateUniversity(id)

  if (isLoading) return <PageLoader />
  if (!u)
    return (
      <EmptyState
        icon={Building2}
        title={t('universities.noResults')}
        description={t('universities.noResultsDesc')}
      />
    )

  const sortedDepts = [...u.departments].sort((a, b) => a.totalCost - b.totalCost)
  const formatRange = (min, max) =>
    min == null && max == null
      ? '—'
      : min === max
        ? formatBDT(min)
        : `${formatBDT(min)} – ${formatBDT(max)}`

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
                    {loc(u.shortName)}
                    {u.rank ? ` · ${t('universities.shortlistRank', { rank: u.rank })}` : ''}
                  </p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-600">
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-600" />
                  {u.location || loc(u.city)}
                </span>
                <span className="flex items-center gap-1.5">
                  <Wallet className="h-4 w-4 text-brand-600" />
                  {t('universities.estimatedDegreeCost')}: {formatRange(u.costMin, u.costMax)}
                </span>
                {u.perCreditMin != null && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays className="h-4 w-4 text-brand-600" />
                    {t('universities.tuitionPerCredit')}: {formatRange(u.perCreditMin, u.perCreditMax)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex flex-col items-end gap-2">
              <SourceLink url={u.sourceUrl} />
              <VerifiedBadge date={u.lastVerified} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Departments with estimated total degree cost */}
      <Card>
        <CardHeader>
          <CardTitle>{t('universities.departments')}</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full border-0">
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>{t('universities.table.dept')}</TH>
                  <TH className="text-right">{t('universities.estimatedDegreeCost')}</TH>
                </TR>
              </THead>
              <TBody>
                {sortedDepts.map((d) => (
                  <TR key={d.id}>
                    <TD>
                      <span className="font-medium text-slate-800">{loc(d.name)}</span>
                      {d.basis && (
                        <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                          {t('universities.estimate')}
                        </span>
                      )}
                    </TD>
                    <TD className="text-right font-semibold text-slate-900">
                      {formatRange(d.costMin, d.costMax)}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Cost scope / caveat from the dataset */}
      {privateUniversitiesMeta.costNote && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-4 w-4 text-brand-600" />
              {t('universities.costNote')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-slate-600">{privateUniversitiesMeta.costNote}</p>
          </CardContent>
        </Card>
      )}

      <div className="mt-6 flex justify-end">
        <Link to={route(ROUTES.compare, {})}>
          <Button variant="secondary">{t('universities.goCompare')}</Button>
        </Link>
      </div>
    </div>
  )
}
