import { useTranslation } from 'react-i18next'
import { Bot, UserRound, ExternalLink, ShieldAlert, RefreshCw, AlertTriangle } from 'lucide-react'
import { MarkdownContent } from '@/components/common/MarkdownContent'
import { useLocale } from '@/hooks/useLocale'
import { cn } from '@/lib/utils'

/**
 * One chat bubble.
 * - user: right-aligned brand bubble
 * - assistant: left, with sources under the reply (FR-5)
 * - status flags: pending (typing dots), error (retry), no_record (honest empty state)
 */
export function ChatMessage({ message, onRetry }) {
  const { t } = useTranslation()
  const { loc } = useLocale()
  const isUser = message.role === 'user'

  if (isUser) {
    return (
      <div className="flex justify-end gap-3">
        <div className="max-w-[85%] rounded-2xl rounded-br-sm bg-brand-600 px-4 py-2.5 text-sm leading-relaxed text-white">
          {message.content}
        </div>
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700">
          <UserRound className="h-4 w-4" />
        </span>
      </div>
    )
  }

  // typing indicator (pending assistant reply)
  if (message.status === 'pending') {
    return (
      <div className="flex gap-3">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
          <Bot className="h-4 w-4" />
        </span>
        <div className="flex items-center gap-2 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
          <span className="text-xs text-slate-500">{t('assistant.thinking')}</span>
          <span className="flex gap-1">
            <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-slate-400" />
            <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-slate-400 [animation-delay:150ms]" />
            <span className="h-1.5 w-1.5 animate-typing-dot rounded-full bg-slate-400 [animation-delay:300ms]" />
          </span>
        </div>
      </div>
    )
  }

  // error state
  if (message.status === 'error') {
    return (
      <div className="flex gap-3">
        <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-100 text-rose-600">
          <AlertTriangle className="h-4 w-4" />
        </span>
        <div className="rounded-2xl rounded-bl-sm border border-rose-200 bg-rose-50 px-4 py-3">
          <p className="text-sm font-semibold text-rose-700">{t('assistant.errorTitle')}</p>
          <p className="mt-1 text-sm text-rose-600">{message.content}</p>
          <button
            onClick={onRetry}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-rose-700"
          >
            <RefreshCw className="h-3 w-3" />
            {t('assistant.retrySend')}
          </button>
        </div>
      </div>
    )
  }

  // no verified record state (AI-2 honesty requirement)
  const isNoRecord = message.status === 'no_record'

  return (
    <div className="flex gap-3">
      <span
        className={cn(
          'mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
          isNoRecord ? 'bg-amber-100 text-amber-600' : 'bg-slate-200 text-slate-600'
        )}
      >
        <Bot className="h-4 w-4" />
      </span>
      <div
        className={cn(
          'max-w-[88%] rounded-2xl rounded-bl-sm px-4 py-3',
          isNoRecord ? 'border border-amber-200 bg-amber-50' : 'bg-slate-100'
        )}
      >
        {isNoRecord && (
          <p className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
            <ShieldAlert className="h-4 w-4" />
            {t('assistant.noRecordTitle')}
          </p>
        )}

        <MarkdownContent content={message.content} />

        {/* sources under each reply */}
        {message.sources?.length > 0 && (
          <div className="mt-3 border-t border-slate-200/70 pt-2.5">
            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide text-slate-400">
              {isNoRecord ? `${t('assistant.checkOfficial')} · ${t('assistant.sources')}` : t('assistant.sources')}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {message.sources.map((s, i) => (
                <a
                  key={i}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 rounded-full border border-brand-200 bg-white px-2.5 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
                >
                  <ExternalLink className="h-3 w-3" />
                  {loc(s.label)}
                </a>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

/** Suggested question chips above the composer. */
export function SuggestedQuestions({ questions, onPick, pending }) {
  const { t } = useTranslation()
  if (!questions?.length) return null
  return (
    <div>
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
        {t('assistant.suggested')}
      </p>
      <div className="flex flex-wrap gap-2">
        {questions.slice(0, 6).map((q, i) => (
          <button
            key={i}
            disabled={pending}
            onClick={() => onPick(q)}
            className="rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 transition-colors hover:border-brand-400 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}
