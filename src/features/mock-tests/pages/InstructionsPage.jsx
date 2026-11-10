import { useState } from 'react'
import { useNavigate, useParams, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  ArrowLeft,
  ClipboardList,
  Clock,
  Percent,
  Timer,
  BookOpenCheck,
  Palette,
  Save,
} from 'lucide-react'
import { useTest } from '../hooks/useTests'
import { testService } from '@/services/testService'
import { useTestEngineStore } from '@/store/testEngineStore'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Checkbox } from '@/components/ui/FormControls'
import { PageLoader } from '@/components/common/Loader'
import { useLocale } from '@/hooks/useLocale'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'

/** FR-7 — instructions screen shown before entering the test engine. */
export default function InstructionsPage() {
  const { id } = useParams()
  useDocumentTitle('tests.instructionsTitle')
  const { t } = useTranslation()
  const { loc } = useLocale()
  const navigate = useNavigate()
  const { data: test, isLoading } = useTest(id)
  const [agreed, setAgreed] = useState(false)
  const [starting, setStarting] = useState(false)

  const initEngine = useTestEngineStore((s) => s.init)
  const hasExistingAttempt = useTestEngineStore((s) => s.testId === id && !s.submitted)

  const handleStart = async () => {
    setStarting(true)
    try {
      // Ask the backend to stamp a new attempt (or reuse if resuming)
      const { attemptId, durationSec, test: engineTest } = await testService.startAttempt(id)
      initEngine({ attemptId, test: engineTest, durationSec })
      navigate(route(ROUTES.testEngine, { id }), { replace: true })
    } catch {
      toast.error(t('common.errorDesc'))
      setStarting(false)
    }
  }

  const handleResume = () => {
    navigate(route(ROUTES.testEngine, { id }), { replace: true })
  }

  const handleFresh = async () => {
    useTestEngineStore.getState().reset()
    await handleStart()
  }

  if (isLoading) return <PageLoader />
  if (!test) return <p className="text-slate-500">{t('common.error')}</p>

  const rules = [
    t('tests.rules.r1', { count: test.questionIds.length, minutes: Math.round(test.durationSec / 60) }),
    t('tests.rules.r2', { marks: 1 }),
    t('tests.rules.r3', { penalty: 0.25 }),
    t('tests.rules.r4'),
    t('tests.rules.r5'),
    t('tests.rules.r6'),
  ]

  return (
    <div className="mx-auto max-w-2xl">
      <Link
        to={ROUTES.tests}
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-brand-700"
      >
        <ArrowLeft className="h-4 w-4" />
        {t('analysis.backToTests')}
      </Link>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <ClipboardList className="h-5 w-5 text-brand-600" />
            {t('tests.instructionsTitle')}
          </CardTitle>
          <p className="mt-1 text-sm text-slate-500">{t('tests.instructionsSubtitle')}</p>
        </CardHeader>

        <CardContent>
          <h2 className="mb-1 text-base font-semibold text-slate-800">{loc(test.title)}</h2>
          <p className="mb-6 text-sm text-slate-500">{loc(test.subject)}</p>

          {/* quick stats */}
          <div className="mb-6 grid grid-cols-3 gap-3 text-center">
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <BookOpenCheck className="mx-auto h-5 w-5 text-brand-600" />
              <p className="mt-1 text-lg font-bold text-slate-800">{test.questionIds.length}</p>
              <p className="text-xs text-slate-400">{t('tests.questions')}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <Timer className="mx-auto h-5 w-5 text-brand-600" />
              <p className="mt-1 text-lg font-bold text-slate-800">
                {Math.round(test.durationSec / 60)}
              </p>
              <p className="text-xs text-slate-400">{t('tests.minutes')}</p>
            </div>
            <div className="rounded-lg bg-slate-50 px-3 py-3">
              <Percent className="mx-auto h-5 w-5 text-brand-600" />
              <p className="mt-1 text-lg font-bold text-rose-600">0.25</p>
              <p className="text-xs text-slate-400">{t('tests.negativeMarking')}</p>
            </div>
          </div>

          {/* rules list */}
          <ul className="space-y-3">
            {rules.map((r, i) => (
              <li key={i} className="flex items-start gap-3 text-sm leading-relaxed text-slate-600">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-100 text-[11px] font-bold text-brand-700">
                  {i + 1}
                </span>
                {r}
              </li>
            ))}
          </ul>

          {/* icons legend */}
          <div className="mt-6 grid grid-cols-2 gap-3 rounded-lg bg-brand-50/60 p-4 text-xs text-slate-600">
            <span className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-brand-600" />
              {t('tests.engine.timeLeft')} — {t('tests.rules.r4')}
            </span>
            <span className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-brand-600" />
              {t('tests.engine.palette')}
            </span>
            <span className="flex items-center gap-2">
              <Save className="h-4 w-4 text-brand-600" />
              {t('tests.engine.confirmTitle')}
            </span>
            <span className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-rose-500" />
              {t('tests.negativeMarking')}
            </span>
          </div>

          {/* resume existing attempt */}
          {hasExistingAttempt && (
            <div className="mt-6 rounded-xl border border-amber-200 bg-amber-50 p-4">
              <p className="text-sm font-semibold text-amber-800">{t('tests.engine.resumePrompt')}</p>
              <div className="mt-3 flex gap-2">
                <Button size="sm" onClick={handleResume}>
                  {t('tests.engine.continueAttempt')}
                </Button>
                <Button size="sm" variant="outline" onClick={handleFresh} loading={starting}>
                  {t('tests.engine.newAttempt')}
                </Button>
              </div>
            </div>
          )}

          {/* agreement + start */}
          {!hasExistingAttempt && (
            <>
              <label className="mt-6 flex cursor-pointer items-center gap-3 rounded-lg border border-slate-200 px-4 py-3">
                <Checkbox
                  checked={agreed}
                  onCheckedChange={(v) => setAgreed(Boolean(v))}
                  id="agree-rules"
                />
                <span className="text-sm font-medium text-slate-700">{t('tests.agree')}</span>
              </label>

              <Button className="mt-4 w-full" size="lg" disabled={!agreed} loading={starting} onClick={handleStart}>
                {t('tests.startTest')}
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
