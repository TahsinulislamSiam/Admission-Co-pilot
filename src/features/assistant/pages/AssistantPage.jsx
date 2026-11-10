import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MessagesSquare, SendHorizonal, Eraser, Info } from 'lucide-react'
import { useAssistant, useSuggestions } from '../hooks/useAssistant'
import { ChatMessage, SuggestedQuestions } from '../components/ChatMessage'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { useDocumentTitle } from '@/hooks/useDocumentTitle'
import { useAssistantStore } from '@/store/assistantStore'

/**
 * AI-2/AI-3 — bilingual AI assistant chat.
 * - typing indicator while "thinking"
 * - source links under every reply
 * - honest "no verified record" state with official links
 * - timeout/error state at 10s (NFR-1)
 * - suggested questions
 * - chat history kept in the session (Zustand memory store)
 */
export default function AssistantPage() {
  useDocumentTitle('nav.assistant')
  const { t } = useTranslation()
  const { send, retry, clear, messages, pending } = useAssistant()
  const { data: suggestions = [] } = useSuggestions()
  const welcomeShown = useAssistantStore((s) => s.messages.length > 0)

  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)

  // auto-scroll to bottom on new messages
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleSend = (text) => {
    const value = (text ?? draft).trim()
    if (!value || pending) return
    setDraft('')
    send(value)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8.5rem)] max-w-3xl flex-col">
      {/* header */}
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-xl font-bold text-slate-900">
            <MessagesSquare className="h-5 w-5 text-brand-600" />
            {t('assistant.title')}
          </h1>
          <p className="mt-0.5 text-sm text-slate-500">{t('assistant.subtitle')}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={clear} disabled={!welcomeShown}>
          <Eraser className="h-4 w-4" />
          {t('assistant.clearChat')}
        </Button>
      </div>

      <Card className="flex min-h-0 flex-1 flex-col">
        {/* messages */}
        <div ref={scrollRef} className="flex-1 space-y-4 overflow-y-auto p-5 scrollbar-slim">
          {/* welcome bubble */}
          {messages.length === 0 && (
            <div className="flex gap-3">
              <span className="mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-slate-200 text-slate-600">
                <MessagesSquare className="h-4 w-4" />
              </span>
              <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3 text-sm leading-relaxed text-slate-700">
                {t('assistant.welcome')}
              </div>
            </div>
          )}

          {messages.map((m) => (
            <ChatMessage key={m.id} message={m} onRetry={retry} />
          ))}
        </div>

        {/* composer */}
        <div className="border-t border-slate-100 p-4">
          <div className="mb-3">
            <SuggestedQuestions questions={suggestions} onPick={handleSend} pending={pending} />
          </div>
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={t('assistant.placeholder')}
              rows={1}
              className="max-h-32 flex-1 resize-none rounded-xl border border-slate-300 px-4 py-2.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 scrollbar-slim"
            />
            <Button onClick={() => handleSend()} loading={pending} disabled={!draft.trim() && !pending}>
              {!pending && <SendHorizonal className="h-4 w-4" />}
              {t('assistant.send')}
            </Button>
          </div>
          <p className="mt-2 flex items-start gap-1.5 text-[11px] leading-relaxed text-slate-400">
            <Info className="mt-0.5 h-3 w-3 shrink-0" />
            {t('assistant.disclaimer')}
          </p>
        </div>
      </Card>
    </div>
  )
}
