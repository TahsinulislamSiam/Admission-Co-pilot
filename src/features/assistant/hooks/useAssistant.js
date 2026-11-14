import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { assistantService, isLiveAssistant } from '@/services/assistantService'
import { useAssistantStore } from '@/store/assistantStore'
import { useLocale } from '@/hooks/useLocale'

/** Prior turns for the model, trimmed to plain { role, content }. */
const toHistory = (messages) =>
  messages
    .filter((m) => m.role === 'user' || (m.role === 'assistant' && m.content))
    .slice(-12)
    .map((m) => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : '',
    }))

/**
 * Mock replies arrive as `{ en, bn }` objects; live replies are plain strings.
 * Collapsing here keeps every consumer (markdown, history) on plain text —
 * otherwise `String({...})` renders the infamous "[object Object]".
 */
const asText = (value, lang) => {
  if (value == null) return ''
  if (typeof value === 'string') return value
  if (typeof value === 'number') return String(value)
  return value[lang] ?? value.en ?? value.bn ?? ''
}

/**
 * AI-2/AI-3 — sends a message through the assistant service and updates the
 * in-session chat history. The service enforces the NFR-1 10s timeout.
 *
 * In live mode (VITE_ASSISTANT_MODE=live) the reply is streamed token by token
 * from the proxy in server/; otherwise the mock returns one complete answer.
 */
export function useAssistant() {
  const { t } = useTranslation()
  const { lang } = useLocale()
  const store = useAssistantStore()
  const live = isLiveAssistant()

  const mutation = useMutation({
    mutationFn: async ({ message }) => {
      const history = toHistory(useAssistantStore.getState().messages.slice(0, -1))

      if (live) {
        return assistantService.streamMessage({
          message,
          lang,
          history,
          onDelta: (chunk) => store.appendToPendingReply(chunk),
        })
      }

      const data = await assistantService.sendMessage({ message, lang, history })
      // Mock returns bilingual { en, bn }; collapse to the active language.
      return {
        status: data.status,
        text: asText(data.message, lang),
        sources: data.sources || [],
      }
    },
    retry: 0,
    onMutate: ({ message }) => {
      store.addUserMessage(message)
      store.addPendingReply()
    },
    onSuccess: (data) => {
      store.resolvePendingReply({
        content: data.text,
        sources: data.sources,
        status: data.status === 'no_record' ? 'no_record' : 'done',
      })
    },
    onError: (err) => {
      const isTimeout = err.code === 'ECONNABORTED' || err.message === 'timeout'
      const friendly = {
        assistantRateLimited: t('assistant.rateLimited', {
          defaultValue: t('assistant.errorTitle'),
        }),
        missingApiKey: t('assistant.notConfigured', {
          defaultValue: 'The assistant is not configured on this server yet.',
        }),
      }[err.message]

      store.resolvePendingReply({
        content: isTimeout
          ? t('assistant.timeoutError')
          : friendly || t('common.errorDesc'),
        sources: [],
        status: 'error',
        isTimeout,
      })
    },
  })

  const send = (message) => {
    if (!message?.trim()) return
    if (store.pending) return
    mutation.mutate({ message })
  }

  const retry = () => {
    const messages = useAssistantStore.getState().messages
    const lastUser = [...messages].reverse().find((m) => m.role === 'user')
    if (lastUser) {
      store.retryLast()
      mutation.mutate({ message: lastUser.content })
    }
  }

  return {
    send,
    retry,
    clear: store.clear,
    messages: store.messages,
    pending: store.pending,
    isSending: mutation.isPending,
  }
}

/** Suggested questions from the backend (fallback: local i18n list). */
export function useSuggestions() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language === 'en' ? 'en' : 'bn'
  const local = t('assistant.suggestions', { returnObjects: true })

  return useQueryLite(async () => {
    try {
      const qs = await assistantService.getSuggestions()
      if (Array.isArray(qs) && qs.length) return qs.map((q) => (typeof q === 'string' ? q : q[lang]))
    } catch {
      /* fall back to i18n list */
    }
    return local
  })
}

// tiny wrapper to avoid importing useQuery in two places
import { useQuery } from '@tanstack/react-query'
function useQueryLite(fn) {
  return useQuery({ queryKey: ['assistant-suggestions'], queryFn: fn, staleTime: 5 * 60_000 })
}
