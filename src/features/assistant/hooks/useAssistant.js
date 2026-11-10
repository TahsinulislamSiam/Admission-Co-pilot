import { useMutation } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { assistantService } from '@/services/assistantService'
import { useAssistantStore } from '@/store/assistantStore'
import { useLocale } from '@/hooks/useLocale'

/**
 * AI-2/AI-3 — sends a message through the assistant service and updates the
 * in-session chat history. The service enforces the NFR-1 10s timeout.
 */
export function useAssistant() {
  const { t } = useTranslation()
  const { lang } = useLocale()
  const store = useAssistantStore()

  const mutation = useMutation({
    mutationFn: ({ message }) => assistantService.sendMessage({ message, lang }),
    retry: 0,
    onMutate: ({ message }) => {
      store.addUserMessage(message)
      store.addPendingReply()
    },
    onSuccess: (data) => {
      if (data.status === 'no_record') {
        // Honest "no verified record" answer — still rendered with sources
        store.resolvePendingReply({
          content: data.message,
          sources: data.sources,
          status: 'no_record',
        })
      } else {
        store.resolvePendingReply({
          content: data.message,
          sources: data.sources,
          status: 'done',
        })
      }
    },
    onError: (err) => {
      const isTimeout = err.code === 'ECONNABORTED' || err.message === 'timeout'
      store.resolvePendingReply({
        content: isTimeout ? t('assistant.timeoutError') : t('common.errorDesc'),
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
