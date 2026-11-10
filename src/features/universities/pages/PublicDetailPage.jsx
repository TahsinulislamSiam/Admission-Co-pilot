import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  ArrowLeft,
  Landmark,
  MapPin,
  Users,
  Banknote,
  CalendarDays,
  ClipboardList,
  Timer,
  Percent,
  Layers,
} from 'lucide-react'
import { usePublicUniversity } from '../hooks/useUniversities'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { PageLoader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { SourceLink, VerifiedBadge } from '@/components/common/SourceLink'
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/Table'
import { useLocale } from '@/hooks/useLocale'
import { formatDate, formatBDT } from '@/lib/utils'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAuthStore } from '@/store/authStore'

/** Public university detail: units table with dates, eligibility, exam pattern (FR-2/FR-4). */
export default function PublicDetailPage() {
  const { id } = useParams()
  useDocumentTitle('universities.publicTitle')
  const { t } = useTranslation()
  const { loc, lang } = useLocale()
  const { data: u, isLoading } = usePublicUniversity(id)
  const profile = useAuthStore((s) => s.user?.profile)

  if (isLoading) return <PageLoader />
  if (!u)
    return (
      <EmptyState
        icon={Landmark}
        title={t('universities.noResults')}
        description={t('universities.noResultsDesc')}
      />
    )

  const myGroup = profile?.group
  const unitsForGroup = myGroup ? u.units.filter((x) => x.group === myGroup) : u.units

  return (
    <div className="mx-auto max-w-5xl">
      <Link
        to={ROUTES.publicUniversities}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('universities.detail.backToList')}
      </Link>

      {/* Header card */}
      <Card className="mb-6">
        <CardContent className="py-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3">
                <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600 text-white">
                  <Landmark className="h-6 w-6" />
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
                  <Users className="h-4 w-4 text-brand-600" />
                  {u.seatsTotal.toLocaleString('en-IN')} {t('common.seats')}
                </span>
                <span className="flex items-center gap-1.5">
                  <Layers className="h-4 w-4 text-brand-600" />
                  {u.groups.map((g) => t(`profile.groups.${g}`)).join(' / ')}
                </span>
              </div>
            </div>
            {/* FR-4 source + verified */}
            <div className="flex flex-col items-end gap-2">
              <SourceLink url={u.sourceUrl} />
              <VerifiedBadge date={u.lastVerified} />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dates & fee grid */}
      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { icon: CalendarDays, label: t('universities.detail.applyStart'), value: formatDate(u.applicationStart, lang) },
          { icon: CalendarDays, label: t('universities.detail.applyDeadline'), value: formatDate(u.deadline, lang) },
          { icon: CalendarDays, label: t('universities.detail.examDate'), value: formatDate(u.examDate, lang) },
          { icon: Banknote, label: t('universities.detail.applicationFee'), value: formatBDT(u.applicationFee) },
        ].map((item, i) => (
          <Card key={i}>
            <CardContent className="py-4">
              <p className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-slate-400">
                <item.icon className="h-3.5 w-3.5" />
                {item.label}
              </p>
              <p className="mt-1.5 text-sm font-semibold text-slate-800">{item.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Units */}
      <Card>
        <CardHeader>
          <CardTitle>
            {myGroup
              ? t('universities.detail.groupEligibleUnits', { group: t(`profile.groups.${myGroup}`) })
              : t('universities.units')}
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table className="min-w-full border-0">
              <THead>
                <TR className="hover:bg-transparent">
                  <TH>{t('universities.unitName')}</TH>
                  <TH className="text-right">{t('common.seats')}</TH>
                  <TH>{t('universities.marks')}</TH>
                  <TH>{t('universities.duration')}</TH>
                  <TH>{t('universities.negativeMarking')}</TH>
                  <TH>{t('universities.eligibility')}</TH>
                  <TH>{t('universities.table.deadline')}</TH>
                </TR>
              </THead>
              <TBody>
                {unitsForGroup.map((unit) => (
                  <TR key={unit.id}>
                    <TD>
                      <span className="font-medium text-slate-800">{loc(unit.name)}</span>
                      <p className="text-xs text-slate-400">
                        {t(`profile.groups.${unit.group}`)}
                      </p>
                    </TD>
                    <TD className="text-right font-medium">{unit.seats.toLocaleString('en-IN')}</TD>
                    <TD>
                      <span className="flex items-center gap-1 text-sm">
                        <ClipboardList className="h-3.5 w-3.5 text-slate-400" />
                        {unit.examPattern.marks}
                      </span>
                    </TD>
                    <TD>
                      <span className="flex items-center gap-1 text-sm">
                        <Timer className="h-3.5 w-3.5 text-slate-400" />
                        {unit.examPattern.durationMin} {t('tests.minutes')}
                      </span>
                    </TD>
                    <TD>
                      {unit.examPattern.negativeMarking > 0 ? (
                        <Badge variant="danger">
                          <Percent className="h-3 w-3" />
                          {unit.examPattern.negativeMarking}
                        </Badge>
                      ) : (
                        <span className="text-xs text-slate-400">{t('universities.noNegative')}</span>
                      )}
                    </TD>
                    <TD className="text-xs">
                      SSC {unit.eligibility.sscGpa?.toFixed(2)} · HSC {unit.eligibility.hscGpa?.toFixed(2)}
                      {unit.eligibility.totalGpa ? ` · Σ ${unit.eligibility.totalGpa.toFixed(2)}` : ''}
                    </TD>
                    <TD className="text-sm">{formatDate(unit.applicationDeadline, lang)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
