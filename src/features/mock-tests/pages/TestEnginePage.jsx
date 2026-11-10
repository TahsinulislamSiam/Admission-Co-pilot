import { useCallback, useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import toast from 'react-hot-toast'
import {
  ChevronLeft,
  ChevronRight,
  Flag,
  Timer as TimerIcon,
  Send,
  CheckCircle2,
  Circle,
  CircleDashed,
} from 'lucide-react'
import { useTestEngineStore } from '@/store/testEngineStore'
import { testService } from '@/services/testService'
import { Button } from '@/components/ui/Button'
import { Card, CardContent } from '@/components/ui/Card'
import { Modal } from '@/components/ui/Modal'
import { useLocale } from '@/hooks/useLocale'
import { formatClock } from '@/lib/utils'
import { ROUTES, route } from '@/routes/constants'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { cn } from '@/lib/utils'

/**
 * FR-7 — Test engine.
 * - countdown timer with auto-submit on timeout
 * - question palette with answered / marked / current states
 * - mark-for-review toggle
 * - negative marking notice
 * - confirm-submit modal
 * - per-question time & answer-change tracking (analytics input)
 * - beforeunload guard against accidental refresh/leave
 */
export default function TestEnginePage() {
  const { id } = useParams()
  useDocumentTitle('tests.title')
  const { t } = useTranslation()
  const { loc } = useLocale()
  const navigate = useNavigate()

  // ---- engine state (persisted to sessionStorage for refresh safety) ----
  const testId = useTestEngineStore((s) => s.testId)
  const questions = useTestEngineStore((s) => s.questions)
  const testTitle = useTestEngineStore((s) => s.testTitle)
  const remainingSec = useTestEngineStore((s) => s.remainingSec)
  const currentIndex = useTestEngineStore((s) => s.currentIndex)
  const answers = useTestEngineStore((s) => s.answers)
  const marked = useTestEngineStore((s) => s.marked)
  const stats = useTestEngineStore((s) => s.stats)
  const attemptId = useTestEngineStore((s) => s.attemptId)
  const tick = useTestEngineStore((s) => s.tick)
  const setCurrentIndex = useTestEngineStore((s) => s.setCurrentIndex)
  const selectAnswer = useTestEngineStore((s) => s.selectAnswer)
  const toggleMarked = useTestEngineStore((s) => s.toggleMarked)
  const markSubmitted = useTestEngineStore((s) => s.markSubmitted)

  const [confirmOpen, setConfirmOpen] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const submittedRef = useRef(false)

  // redirect if engine was not initialised for this test
  useEffect(() => {
    if (testId !== id || questions.length === 0) {
      navigate(route(ROUTES.testInstructions, { id }), { replace: true })
    }
  }, [testId, id, questions.length, navigate])

  const submit = useCallback(
    async (auto = false) => {
      if (submittedRef.current) return
      submittedRef.current = true
      setSubmitting(true)
      const durationUsedSec = useTestEngineStore.getState().remainingSec
      const payload = {
        attemptId,
        testId: id,
        answers,
        stats,
        durationUsedSec: Math.max(0, durationUsedSec),
        autoSubmitted: auto,
      }
      try {
        const result = await testService.submitAttempt(payload)
        markSubmitted(auto)
        toast.success(auto ? t('tests.engine.autoSubmittedToast') : t('tests.engine.submittedToast'))
        navigate(route(ROUTES.testResult, { attemptId: result.attemptId }), { replace: true })
      } catch {
        submittedRef.current = false
        setSubmitting(false)
        toast.error(t('tests.engine.submitError'))
      }
    },
    [attemptId, id, answers, stats, markSubmitted, navigate, t]
  )

  // ---- countdown timer: 1 tick per second ----
  useEffect(() => {
    if (questions.length === 0) return undefined
    const interval = setInterval(() => {
      const s = useTestEngineStore.getState()
      tick()
      // auto-submit when the clock hits zero
      if (s.remainingSec - 1 <= 0 && !submittedRef.current) {
        clearInterval(interval)
        submit(true)
      }
    }, 1000)
    return () => clearInterval(interval)
  }, [questions.length, tick, submit])

  // ---- prevent accidental refresh / tab close ----
  useEffect(() => {
    const handler = (e) => {
      // Browsers require returnValue for the confirmation dialog
      e.preventDefault()
      e.returnValue = t('tests.engine.leaveWarning')
      return t('tests.engine.leaveWarning')
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [t])

  const current = questions[currentIndex]
  if (!current) return null

  const answeredCount = Object.keys(answers).length
  const markedCount = Object.values(marked).filter(Boolean).length
  const timeCritical = remainingSec <= 60

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-slate-50">
      {/* ---------- top bar ---------- */}
      <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-slate-800">{loc(testTitle)}</p>
          <p className="text-xs text-slate-400">
            {t('tests.engine.answered')}: {answeredCount}/{questions.length} ·{' '}
            {t('tests.engine.markedForReview')}: {markedCount}
          </p>
        </div>

        {/* countdown */}
        <div
          className={cn(
            'flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-lg font-bold tabular-nums',
            timeCritical ? 'animate-pulse bg-rose-100 text-rose-700' : 'bg-slate-100 text-slate-700'
          )}
          role="timer"
          aria-live="off"
        >
          <TimerIcon className="h-5 w-5" />
          {formatClock(remainingSec)}
        </div>

        <Button size="sm" onClick={() => setConfirmOpen(true)} disabled={submitting}>
          <Send className="h-4 w-4" />
          {t('tests.engine.submit')}
        </Button>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* ---------- question area ---------- */}
        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto p-4 sm:p-6 scrollbar-slim">
          <div className="mx-auto w-full max-w-3xl">
            {/* negative marking notice */}
            <div className="mb-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-xs font-medium text-rose-700">
              ⚠️ {t('tests.rules.r3', { penalty: 0.25 })}
            </div>

            <p className="mb-4 text-sm font-medium text-slate-500">
              {t('tests.engine.question', { current: currentIndex + 1, total: questions.length })}
            </p>

            <Card>
              <CardContent className="py-6">
                {/* question text */}
                <h2 className="text-lg font-semibold leading-relaxed text-slate-900">
                  {loc(current.text)}
                </h2>

                {/* options */}
                <div className="mt-6 space-y-3">
                  {current.options.map((opt, i) => {
                    const selected = answers[current.id] === i
                    return (
                      <button
                        key={i}
                        onClick={() => selectAnswer(current.id, i)}
                        className={cn(
                          'flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm leading-relaxed transition-colors',
                          selected
                            ? 'border-brand-500 bg-brand-50 ring-1 ring-brand-400'
                            : 'border-slate-200 bg-white hover:border-brand-300 hover:bg-slate-50'
                        )}
                      >
                        <span
                          className={cn(
                            'flex h-6 w-6 shrink-0 items-center justify-center rounded-full border text-xs font-bold',
                            selected
                              ? 'border-brand-600 bg-brand-600 text-white'
                              : 'border-slate-300 text-slate-500'
                          )}
                        >
                          {String.fromCharCode(65 + i)}
                        </span>
                        <span className="text-slate-700">{loc(opt)}</span>
                      </button>
                    )
                  })}
                </div>

                {/* actions */}
                <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentIndex === 0}
                    onClick={() => setCurrentIndex(currentIndex - 1)}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    {t('common.previous')}
                  </Button>

                  <Button
                    variant={marked[current.id] ? 'accent' : 'ghost'}
                    size="sm"
                    onClick={() => toggleMarked(current.id)}
                  >
                    <Flag className="h-4 w-4" />
                    {marked[current.id] ? t('tests.engine.unmarkReview') : t('tests.engine.markReview')}
                  </Button>

                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentIndex === questions.length - 1}
                    onClick={() => setCurrentIndex(currentIndex + 1)}
                  >
                    {t('common.next')}
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </main>

        {/* ---------- palette sidebar ---------- */}
        <aside className="w-full shrink-0 border-t border-slate-200 bg-white p-4 lg:w-72 lg:border-l lg:border-t-0 lg:overflow-y-auto lg:scrollbar-slim">
          <p className="mb-3 text-sm font-semibold text-slate-700">{t('tests.engine.palette')}</p>

          <div className="grid grid-cols-6 gap-2 lg:grid-cols-5">
            {questions.map((q, i) => {
              const isAnswered = answers[q.id] !== undefined
              const isMarked = marked[q.id]
              const isCurrent = i === currentIndex
              return (
                <button
                  key={q.id}
                  onClick={() => setCurrentIndex(i)}
                  className={cn(
                    'relative flex h-9 w-9 items-center justify-center rounded-lg border text-sm font-semibold transition-all',
                    isCurrent && 'ring-2 ring-brand-500 ring-offset-1',
                    isMarked
                      ? 'border-accent-400 bg-accent-100 text-accent-800'
                      : isAnswered
                        ? 'border-brand-500 bg-brand-500 text-white'
                        : 'border-slate-300 bg-white text-slate-500 hover:border-brand-400'
                  )}
                  title={
                    isMarked
                      ? t('tests.engine.legendMarked')
                      : isAnswered
                        ? t('tests.engine.legendAnswered')
                        : t('tests.engine.legendUnanswered')
                  }
                >
                  {i + 1}
                  {isMarked && (
                    <Flag className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-accent-500 p-0.5 text-white" />
                  )}
                </button>
              )
            })}
          </div>

          {/* legend */}
          <div className="mt-4 space-y-1.5 text-xs text-slate-500">
            <p className="flex items-center gap-2">
              <CheckCircle2 className="h-3.5 w-3.5 text-brand-500" />
              {t('tests.engine.legendAnswered')} ({answeredCount})
            </p>
            <p className="flex items-center gap-2">
              <Flag className="h-3.5 w-3.5 text-accent-500" />
              {t('tests.engine.legendMarked')} ({markedCount})
            </p>
            <p className="flex items-center gap-2">
              <Circle className="h-3.5 w-3.5 text-slate-400" />
              {t('tests.engine.legendUnanswered')} ({questions.length - answeredCount})
            </p>
            <p className="flex items-center gap-2">
              <CircleDashed className="h-3.5 w-3.5 text-brand-500" />
              {t('tests.engine.legendCurrent')}
            </p>
          </div>

          <Button className="mt-5 w-full" onClick={() => setConfirmOpen(true)} disabled={submitting}>
            <Send className="h-4 w-4" />
            {submitting ? t('tests.engine.submitting') : t('tests.engine.submit')}
          </Button>
        </aside>
      </div>

      {/* ---------- confirm submit modal ---------- */}
      <Modal
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title={t('tests.engine.confirmTitle')}
        description={t('tests.engine.confirmBody')}
        footer={
          <>
            <Button variant="outline" onClick={() => setConfirmOpen(false)} disabled={submitting}>
              {t('tests.engine.keepGoing')}
            </Button>
            <Button variant="brand" loading={submitting} onClick={() => submit(false)}>
              {t('tests.engine.confirmSubmit')}
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-2xl font-bold text-brand-600">{answeredCount}</p>
            <p className="text-xs text-slate-500">{t('tests.engine.answered')}</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-2xl font-bold text-slate-400">{questions.length - answeredCount}</p>
            <p className="text-xs text-slate-500">{t('tests.engine.unanswered')}</p>
          </div>
          <div className="rounded-lg bg-slate-50 py-3">
            <p className="text-2xl font-bold text-accent-500">{markedCount}</p>
            <p className="text-xs text-slate-500">{t('tests.engine.markedForReview')}</p>
          </div>
        </div>
      </Modal>
    </div>
  )
}
