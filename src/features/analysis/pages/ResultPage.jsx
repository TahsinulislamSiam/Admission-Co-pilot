import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import {
  BarChart3,
  CheckCircle2,
  XCircle,
  MinusCircle,
  Target,
  Timer,
  Percent,
  TrendingDown,
  ListChecks,
  LayoutDashboard,
} from 'lucide-react'
import { useResult } from '../hooks/useResult'
import { QuestionReviewItem } from '../components/QuestionReviewItem'
import { StrategyComparisonChart } from '../components/StrategyComparisonChart'
import { MistakeLegend } from '../components/MistakeBadge'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/Tabs'
import { PageLoader } from '@/components/common/Loader'
import { EmptyState } from '@/components/common/EmptyState'
import { Badge } from '@/components/ui/Badge'
import { useLocale } from '@/hooks/useLocale'
import { useTest } from '@/features/mock-tests/hooks/useTests'
import { formatDuration } from '@/lib/utils'
import { ROUTES } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/**
 * AI-5/AI-6/AI-7 — Result & mistake analysis page:
 * score summary, per-question review with mistake labels + Bangla explanations,
 * and the strategy comparison chart (answer everything vs only confident).
 */
export default function ResultPage() {
  const { attemptId } = useParams()
  useDocumentTitle('analysis.resultTitle')
  const { t } = useTranslation()
  const { lang } = useLocale()
  const { data: result, isLoading } = useResult(attemptId)
  const { data: test } = useTest(result?.testId)
  const [filter, setFilter] = useState('all')

  if (isLoading) return <PageLoader />
  if (!result)
    return (
      <EmptyState
        icon={BarChart3}
        title={t('analysis.noResultTitle')}
        action={
          <Link to={ROUTES.tests}>
            <Button>{t('analysis.backToTests')}</Button>
          </Link>
        }
      />
    )

  const { totals, review, strategyComparison } = result

  const filteredReview = review.filter((r) => {
    if (filter === 'all') return true
    if (filter === 'wrong') return !r.isCorrect
    if (filter === 'correct') return r.isCorrect
    if (filter === 'skipped') return r.isSkipped
    if (filter === 'marked') return r.label // any mistake label
    return true
  })

  return (
    <div className="mx-auto max-w-4xl">
      {/* header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <BarChart3 className="h-5 w-5 text-brand-600" />
            {t('analysis.resultTitle')}
          </h1>
          {result.autoSubmitted && (
            <Badge variant="warning" className="mt-2">
              <Timer className="h-3 w-3" />
              {t('analysis.autoSubmittedNote')}
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          <Link to={ROUTES.tests}>
            <Button variant="outline" size="sm">
              {t('analysis.backToTests')}
            </Button>
          </Link>
          <Link to={ROUTES.dashboard}>
            <Button size="sm">
              <LayoutDashboard className="h-4 w-4" />
              {t('analysis.goDashboard')}
            </Button>
          </Link>
        </div>
      </div>

      {/* ---------- score summary ---------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('analysis.summary')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-xl bg-brand-600 px-4 py-4 text-center text-white">
              <p className="text-3xl font-extrabold">{totals.score}</p>
              <p className="mt-1 text-xs opacity-80">
                {t('analysis.score')} / {totals.totalMarks}
              </p>
            </div>
            {[
              { icon: CheckCircle2, label: t('analysis.correct'), value: totals.correct, tone: 'text-emerald-600' },
              { icon: XCircle, label: t('analysis.wrong'), value: totals.wrong, tone: 'text-rose-600' },
              { icon: MinusCircle, label: t('analysis.unanswered'), value: totals.unanswered, tone: 'text-slate-400' },
              { icon: Target, label: t('analysis.accuracy'), value: `${totals.accuracy}%`, tone: 'text-brand-600' },
              { icon: Percent, label: t('dashboard.score'), value: `${totals.percentage}%`, tone: 'text-brand-700' },
              { icon: TrendingDown, label: t('analysis.penalty'), value: totals.penaltyMarks, tone: 'text-rose-500' },
            ].map((s, i) => (
              <div key={i} className="rounded-xl bg-slate-50 px-3 py-4 text-center">
                <s.icon className={`mx-auto h-5 w-5 ${s.tone}`} />
                <p className="mt-1.5 text-xl font-bold text-slate-800">{s.value}</p>
                <p className="mt-0.5 text-[11px] text-slate-400">{s.label}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 flex items-center gap-1.5 text-xs text-slate-400">
            <Timer className="h-3.5 w-3.5" />
            {t('analysis.timeUsed')}: {formatDuration(result.durationUsedSec, lang)}
            {test && ` · ${t('tests.subject')}: ${lang === 'bn' ? test.subject?.bn : test.subject?.en}`}
          </p>
        </CardContent>
      </Card>

      {/* ---------- strategy comparison (AI-7) ---------- */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>{t('analysis.strategyTitle')}</CardTitle>
          <p className="mt-0.5 text-sm text-slate-500">{t('analysis.strategySubtitle')}</p>
        </CardHeader>
        <CardContent>
          <StrategyComparisonChart data={strategyComparison} />
          <p className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm leading-relaxed text-slate-700">
            {t('analysis.strategyNote', {
              score: strategyComparison.confidentOnly,
              diff: strategyComparison.diff,
            })}
          </p>
        </CardContent>
      </Card>

      {/* ---------- question review (AI-5, AI-6) ---------- */}
      <Card>
        <CardHeader className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="flex items-center gap-2">
              <ListChecks className="h-4 w-4 text-brand-600" />
              {t('analysis.reviewTitle')}
            </CardTitle>
            <p className="mt-0.5 text-sm text-slate-500">{t('analysis.reviewSubtitle')}</p>
          </div>
          <MistakeLegend />
        </CardHeader>
        <CardContent>
          <Tabs value={filter} onValueChange={setFilter} className="mb-4">
            <TabsList>
              <TabsTrigger value="all">{t('common.all')} ({review.length})</TabsTrigger>
              <TabsTrigger value="wrong">
                {t('analysis.wrong')} ({totals.wrong})
              </TabsTrigger>
              <TabsTrigger value="correct">
                {t('analysis.correct')} ({totals.correct})
              </TabsTrigger>
              <TabsTrigger value="skipped">
                {t('analysis.unanswered')} ({totals.unanswered})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="space-y-3">
            {filteredReview.map((r) => {
              const q = test?.questions?.find((x) => x.id === r.questionId)
              if (!q) return null
              return (
                <QuestionReviewItem
                  key={r.questionId}
                  review={r}
                  question={q}
                  index={review.indexOf(r)}
                  defaultOpen={!r.isCorrect && filter === 'wrong'}
                />
              )
            })}
            {filteredReview.length === 0 && (
              <p className="py-6 text-center text-sm text-slate-400">{t('common.all')} ✓</p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
