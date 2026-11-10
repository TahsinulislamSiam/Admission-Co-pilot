import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  LayoutDashboard,
  FileUp,
  Database,
  ClipboardCheck,
  BarChart3,
  Clock,
  ChevronRight,
  UploadCloud,
} from 'lucide-react'
import { useAdminOverview, useCirculars } from '../hooks/useAdmin'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useLocale } from '@/hooks/useLocale'
import { formatDate } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const statusVariant = { pending_review: 'warning', approved: 'success', rejected: 'danger' }

/** Admin home — content pipeline stats, recent uploads, quick actions. */
export default function AdminOverviewPage() {
  useDocumentTitle('admin.nav.overview')
  const { t } = useTranslation()
  const { lang } = useLocale()
  const { data: stats, isLoading } = useAdminOverview()
  const { data: circulars = [] } = useCirculars()

  if (isLoading) return <SkeletonList count={4} className="h-28" />

  const recent = (stats?.recentUploads || circulars).slice(0, 5)

  const cards = [
    {
      label: t('admin.overview.pendingCirculars'),
      value: stats?.pendingCirculars ?? 0,
      icon: FileUp,
      to: ROUTES.adminCirculars,
      tone: 'text-amber-600 bg-amber-50',
    },
    {
      label: t('admin.overview.publishedRecords'),
      value: stats?.publishedRecords ?? 0,
      icon: Database,
      to: ROUTES.adminRecords,
      tone: 'text-emerald-600 bg-emerald-50',
    },
    {
      label: t('admin.overview.pendingQuestions'),
      value: stats?.pendingQuestions ?? 0,
      icon: ClipboardCheck,
      to: ROUTES.adminQuestions,
      tone: 'text-sky-600 bg-sky-50',
    },
    {
      label: t('admin.overview.totalResults'),
      value: stats?.totalResults ?? 0,
      icon: BarChart3,
      to: ROUTES.dashboard,
      tone: 'text-purple-600 bg-purple-50',
    },
  ]

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <LayoutDashboard className="h-5 w-5 text-brand-600" />
          {t('admin.overview.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('admin.subtitle')}</p>
      </div>

      {/* stats */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map(({ label, value, icon: Icon, to, tone }) => (
          <Link key={label} to={to}>
            <Card className="h-full transition-shadow hover:shadow-card-hover">
              <CardContent className="flex items-center gap-4">
                <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-lg ${tone}`}>
                  <Icon className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <p className="text-2xl font-bold text-slate-900">{value}</p>
                  <p className="truncate text-xs font-medium text-slate-500">{label}</p>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* quick actions */}
      <Card className="mt-6">
        <CardContent className="flex flex-wrap items-center gap-3">
          <p className="mr-auto text-sm font-semibold text-slate-700">
            {t('admin.overview.quickActions')}
          </p>
          <Link to={ROUTES.adminCirculars}>
            <Button>
              <UploadCloud className="h-4 w-4" />
              {t('admin.overview.uploadCircular')}
            </Button>
          </Link>
          <Link to={ROUTES.adminQuestions}>
            <Button variant="secondary">
              <ClipboardCheck className="h-4 w-4" />
              {t('admin.overview.reviewQuestions')}
            </Button>
          </Link>
        </CardContent>
      </Card>

      {/* recent uploads */}
      <Card className="mt-6">
        <CardContent>
          <h3 className="mb-4 text-sm font-semibold text-slate-700">
            {t('admin.circulars.uploadedList')}
          </h3>
          {recent.length === 0 ? (
            <EmptyState icon={FileUp} title={t('admin.circulars.noCirculars')} />
          ) : (
            <ul className="divide-y divide-slate-100">
              {recent.map((c) => (
                <li key={c.id} className="flex items-center gap-3 py-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100">
                    <FileUp className="h-4 w-4 text-slate-500" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {c.universityName?.[lang] || c.fileName}
                    </p>
                    <p className="mt-0.5 flex items-center gap-2 text-xs text-slate-400">
                      <Clock className="h-3 w-3" />
                      {formatDate(c.uploadedAt, lang)}
                      <span className="hidden sm:inline">· {c.fileName}</span>
                    </p>
                  </div>
                  <Badge variant={statusVariant[c.status]}>
                    {t(`admin.circulars.statuses.${c.status}`)}
                  </Badge>
                  {c.status === 'pending_review' && (
                    <Link
                      to={route(ROUTES.adminCircularReview, { id: c.id })}
                      className="shrink-0"
                    >
                      <Button size="sm" variant="outline">
                        {t('admin.circulars.review')}
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Button>
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
