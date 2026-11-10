import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ChevronDown, Languages, CheckCircle2, XCircle, MinusCircle, Clock, Repeat2 } from 'lucide-react'
import { MarkdownContent } from '@/components/common/MarkdownContent'
import { MistakeBadge } from './MistakeBadge'
import { useExplanation } from '../hooks/useResult'
import { useLocale } from '@/hooks/useLocale'
import { formatDuration } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Skeleton } from '@/components/ui/Skeleton'

/**
 * AI-5/AI-6 — one reviewed question:
 * your answer vs correct answer, mistake badge, time spent, answer changes,
 * and an "Explain in Bangla" button rendering a safe step-by-step explanation.
 */
export function QuestionReviewItem({ review, question, index, defaultOpen = false }) {
  const { t } = useTranslation()
  const { loc } = useLocale()
  const [open, setOpen] = useState(defaultOpen)
  const [showExplanation, setShowExplanation] = useState(false)

  const { data: explanation, isLoading, isError } = useExplanation(
    question.id,
    showExplanation
  )

  const statusIcon = review.isCorrect ? (
    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
  ) : review.isSkipped ? (
    <MinusCircle className="h-5 w-5 text-slate-300" />
  ) : (
    <XCircle className="h-5 w-5 text-rose-500" />
  )

  return (
    <div className="rounded-xl border border-slate-200 bg-white">
      {/* header row */}
      <button
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-3 px-4 py-3 text-left"
      >
        {statusIcon}
        <span className="text-xs font-bold text-slate-400">Q{index + 1}</span>
        <span className="min-w-0 flex-1 truncate text-sm text-slate-700">{loc(question.text)}</span>

        {review.isCorrect ? (
          <span className="shrink-0 text-xs font-medium text-emerald-600">
            {t('analysis.correctBadge')}
          </span>
        ) : review.isSkipped ? (
          <span className="shrink-0 text-xs font-medium text-slate-400">
            {t('analysis.notAttempted')}
          </span>
        ) : (
          <MistakeBadge type={review.label} />
        )}

        <ChevronDown
          className={cn(
            'h-4 w-4 shrink-0 text-slate-400 transition-transform',
            open && 'rotate-180'
          )}
        />
      </button>

      {open && (
        <div className="border-t border-slate-100 px-4 py-4">
          <p className="text-sm font-medium leading-relaxed text-slate-800">{loc(question.text)}</p>

          {/* options with highlights */}
          <div className="mt-3 space-y-2">
            {question.options.map((opt, i) => {
              const isCorrect = i === review.correctIndex
              const isMine = i === review.selectedIndex
              return (
                <div
                  key={i}
                  className={cn(
                    'flex items-center gap-3 rounded-lg border px-3 py-2 text-sm',
                    isCorrect
                      ? 'border-emerald-300 bg-emerald-50 font-medium text-emerald-800'
                      : isMine
                        ? 'border-rose-300 bg-rose-50 text-rose-800'
                        : 'border-slate-200 text-slate-600'
                  )}
                >
                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-current text-[10px] font-bold">
                    {String.fromCharCode(65 + i)}
                  </span>
                  <span className="flex-1">{loc(opt)}</span>
                  {isCorrect && (
                    <span className="text-[11px] font-semibold text-emerald-600">
                      ✓ {t('analysis.correctAnswer')}
                    </span>
                  )}
                  {isMine && !isCorrect && (
                    <span className="text-[11px] font-semibold text-rose-600">
                      ✗ {t('analysis.yourAnswer')}
                    </span>
                  )}
                </div>
              )
            })}
          </div>

          {/* stats row */}
          <div className="mt-3 flex flex-wrap items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              {t('analysis.timeSpent')}: {formatDuration(review.stat.timeSpentSec, 'bn')}
            </span>
            <span className="flex items-center gap-1.5">
              <Repeat2 className="h-3.5 w-3.5" />
              {t('analysis.changes', { count: review.stat.changes })}
            </span>
            {!review.isCorrect && !review.isSkipped && (
              <span className="flex items-center gap-1.5">
                {t('analysis.mistakeType')}: <MistakeBadge type={review.label} />
              </span>
            )}
          </div>

          {/* Explain in Bangla */}
          {!review.isCorrect && (
            <div className="mt-4">
              <button
                onClick={() => setShowExplanation((s) => !s)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-brand-300 bg-brand-50 px-3 py-1.5 text-sm font-medium text-brand-700 hover:bg-brand-100"
              >
                <Languages className="h-4 w-4" />
                {showExplanation ? t('analysis.hideExplanation') : t('analysis.explainBangla')}
              </button>

              {showExplanation && (
                <div className="mt-3 rounded-xl border border-brand-100 bg-brand-50/50 px-4 py-3">
                  {isLoading ? (
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-5/6" />
                      <p className="text-xs text-slate-400">{t('analysis.explainLoading')}</p>
                    </div>
                  ) : isError ? (
                    <p className="text-sm text-rose-600">{t('analysis.explainError')}</p>
                  ) : explanation?.bn ? (
                    <MarkdownContent content={explanation.bn} />
                  ) : explanation ? (
                    <MarkdownContent content={String(explanation)} />
                  ) : (
                    <p className="text-sm text-slate-500">{t('analysis.explainError')}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
