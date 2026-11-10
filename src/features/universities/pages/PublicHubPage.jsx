import { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Landmark, SearchX } from 'lucide-react'
import { usePublicUniversities } from '../hooks/useUniversities'
import { PublicUniversityCard } from '../components/PublicUniversityCard'
import { PublicFilters, ViewToggle } from '../components/PublicFilters'
import { Card } from '@/components/ui/Card'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { SourceLink, VerifiedBadge } from '@/components/common/SourceLink'
import { Badge } from '@/components/ui/Badge'
import { useLocale } from '@/hooks/useLocale'
import { formatDate, formatBDT } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/**
 * FR-2 — Public university hub.
 * Cards + table views, filters (dates, eligibility, exam pattern, fees, seats),
 * search; every record shows SourceLink + Last verified badge (FR-4).
 */
export default function PublicHubPage() {
  useDocumentTitle('nav.publicUniversities')
  const { t } = useTranslation()
  const { loc, lang } = useLocale()
  const { data: universities = [], isLoading, isError, error } = usePublicUniversities()

  const [filtered, setFiltered] = useState([])
  const [view, setView] = useState('cards')

  const handleFilter = useCallback((results) => setFiltered(results), [])

  if (isError) {
    return (
      <EmptyState
        icon={SearchX}
        title={t('common.error')}
        description={error?.message || t('common.errorDesc')}
      />
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <Landmark className="h-5 w-5 text-brand-600" />
          {t('universities.publicTitle')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('universities.publicSubtitle')}</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <PublicFilters universities={universities} onFilter={handleFilter} />

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-slate-500">
              {t('common.resultsCount', { count: filtered.length })}
            </p>
            <ViewToggle value={view} onChange={setView} />
          </div>

          {isLoading ? (
            <SkeletonList count={4} />
          ) : filtered.length === 0 ? (
            <Card>
              <EmptyState
                icon={SearchX}
                title={t('universities.noResults')}
                description={t('universities.noResultsDesc')}
              />
            </Card>
          ) : view === 'cards' ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((u) => (
                <PublicUniversityCard key={u.id} university={u} />
              ))}
            </div>
          ) : (
            /* Table view */
            <Table>
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>{t('universities.table.university')}</TH>
                  <TH>{t('universities.table.city')}</TH>
                  <TH>{t('universities.table.groups')}</TH>
                  <TH className="text-right">{t('universities.table.seats')}</TH>
                  <TH>{t('universities.table.deadline')}</TH>
                  <TH>{t('universities.table.fee')}</TH>
                  <TH>{t('universities.table.minHsc')}</TH>
                  <TH>{t('universities.table.pattern')}</TH>
                  <TH>{t('universities.source')}</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((u) => (
                  <TR key={u.id}>
                    <TD>
                      <Link
                        to={route(ROUTES.publicUniversityDetail, { id: u.id })}
                        className="font-medium text-brand-700 hover:underline"
                      >
                        {loc(u.name)}
                      </Link>
                      <p className="text-xs text-slate-400">{loc(u.shortName)}</p>
                    </TD>
                    <TD>{loc(u.city)}</TD>
                    <TD>
                      <div className="flex flex-wrap gap-1">
                        {u.groups.map((g) => (
                          <Badge key={g} variant="outline">
                            {t(`profile.groups.${g}`)}
                          </Badge>
                        ))}
                      </div>
                    </TD>
                    <TD className="text-right font-medium">{u.seatsTotal.toLocaleString('en-IN')}</TD>
                    <TD>{formatDate(u.deadline, lang)}</TD>
                    <TD>{formatBDT(u.applicationFee)}</TD>
                    <TD>{u.minHscGpa?.toFixed(2)}</TD>
                    <TD className="text-xs">{u.examPattern}</TD>
                    <TD>
                      <div className="flex flex-col gap-1">
                        <SourceLink url={u.sourceUrl} compact />
                        <VerifiedBadge date={u.lastVerified} />
                      </div>
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  )
}
