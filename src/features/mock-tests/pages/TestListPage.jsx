import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import {
  FileStack,
  Clock,
  ListChecks,
  Percent,
  Users,
  Trophy,
  ChevronRight,
} from 'lucide-react'
import { useTests, useMyAttempts } from '../hooks/useTests'
import { Card, CardContent } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { SkeletonList } from '@/components/ui/Skeleton'
import { EmptyState } from '@/components/common/EmptyState'
import { useLocale } from '@/hooks/useLocale'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

const difficultyVariant = { easy: 'success', medium: 'warning', hard: 'danger' }

/** FR-6 — mock test list with stats and last result. */
export default function TestListPage() {
  useDocumentTitle('nav.mockTests')
  const { t } = useTranslation()
  const { loc } = useLocale()
  const { data: tests = [], isLoading } = useTests()
  const { data: attempts = [] } = useMyAttempts()

  if (isLoading) return <SkeletonList count={4} className="h-28" />

  const lastAttemptFor = (testId) =>
    [...attempts].reverse().find((a) => a.testId === testId)

  const bestScoreFor = (testId) => {
    const list = attempts.filter((a) => a.testId === testId)
    return list.length ? Math.max(...list.map((a) => a.percentage)) : null
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
          <FileStack className="h-5 w-5 text-brand-600" />
          {t('tests.title')}
        </h1>
        <p className="mt-1 text-sm text-slate-500">{t('tests.subtitle')}</p>
      </div>

      {tests.length === 0 ? (
        <Card>
          <EmptyState icon={FileStack} title={t('dashboard.noData')} description={t('dashboard.noDataDesc')} />
        </Card>
      ) : (
        <div className="grid gap-5 md:grid-cols-2">
          {tests.map((test) => {
            const last = lastAttemptFor(test.id)
            const best = bestScoreFor(test.id)
            const count = attempts.filter((a) => a.testId === test.id).length
            return (
              <Card key={test.id} className="flex flex-col transition-shadow hover:shadow-card-hover">
                <CardContent className="flex flex-1 flex-col">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h3 className="text-base font-semibold text-slate-800">{loc(test.title)}</h3>
                      <p className="mt-0.5 text-xs text-slate-500">{loc(test.subject)}</p>
                    </div>
                    <Badge variant={difficultyVariant[test.difficulty]}>
                      {t(`tests.difficulty${test.difficulty.charAt(0).toUpperCase()}${test.difficulty.slice(1)}`)}
                    </Badge>
                  </div>

                  {/* stats */}
                  <div className="mt-4 grid grid-cols-4 gap-2 rounded-lg bg-slate-50 px-3 py-2.5 text-center">
                    <div>
                      <ListChecks className="mx-auto h-4 w-4 text-brand-600" />
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {test.questionIds.length}
                      </p>
                      <p className="text-[11px] text-slate-400">{t('tests.questions')}</p>
                    </div>
                    <div>
                      <Clock className="mx-auto h-4 w-4 text-brand-600" />
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {Math.round(test.durationSec / 60)}
                      </p>
                      <p className="text-[11px] text-slate-400">{t('tests.minutes')}</p>
                    </div>
                    <div>
                      <Percent className="mx-auto h-4 w-4 text-brand-600" />
                      <p className="mt-1 text-sm font-semibold text-slate-800">0.25</p>
                      <p className="text-[11px] text-slate-400">{t('tests.negativeMarking')}</p>
                    </div>
                    <div>
                      <Users className="mx-auto h-4 w-4 text-brand-600" />
                      <p className="mt-1 text-sm font-semibold text-slate-800">
                        {(test.attemptsCount / 1000).toFixed(1)}k
                      </p>
                      <p className="text-[11px] text-slate-400">{t('tests.attempts')}</p>
                    </div>
                  </div>

                  {/* last/best */}
                  <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
                    <span>
                      {t('tests.bestScore')}:{' '}
                      <span className="font-semibold text-slate-700">
                        {best != null ? `${best}%` : '—'}
                      </span>
                    </span>
                    <span>
                      {t('tests.attempts')}:{' '}
                      <span className="font-semibold text-slate-700">{count}</span>
                    </span>
                  </div>

                  {last && (
                    <div className="mt-2 flex items-center gap-2 rounded-lg border border-brand-100 bg-brand-50/50 px-3 py-2 text-xs">
                      <Trophy className="h-3.5 w-3.5 text-accent-500" />
                      <span className="text-slate-600">{t('tests.lastResult')}:</span>
                      <span className="font-bold text-brand-700">{last.percentage}%</span>
                      <Link
                        to={route(ROUTES.testResult, { attemptId: last.id })}
                        className="ml-auto font-medium text-brand-700 hover:underline"
                      >
                        {t('tests.viewResult')}
                      </Link>
                    </div>
                  )}

                  <div className="mt-4 flex-1" />

                  <Link to={route(ROUTES.testInstructions, { id: test.id })}>
                    <Button
                      className="w-full"
                      variant={last ? 'secondary' : 'default'}
                    >
                      {t('tests.start')}
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
