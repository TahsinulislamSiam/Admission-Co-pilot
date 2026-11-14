import { describe, it, expect, vi, beforeEach } from 'vitest'
import { renderHook, waitFor, act } from '@testing-library/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18n from '@/lib/i18n'
import { useAssistant } from './useAssistant'
import { assistantService } from '@/services/assistantService'
import { useAssistantStore } from '@/store/assistantStore'

/**
 * Regression test for the "[object Object]" bug.
 *
 * The mock backend answers with a bilingual `{ en, bn }` object. Passing that
 * object straight into the message store made MarkdownContent render
 * `String({...})` → "[object Object]". The hook must collapse it to text.
 */

const wrapper = ({ children }) => {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } })
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

describe('useAssistant', () => {
  beforeEach(async () => {
    useAssistantStore.getState().clear()
    await i18n.changeLanguage('en')
  })

  it('collapses a bilingual { en, bn } answer into readable text', async () => {
    vi.spyOn(assistantService, 'sendMessage').mockResolvedValue({
      status: 'ok',
      message: {
        en: 'BUET requires **GPA 4.00** in both SSC and HSC.',
        bn: 'বুয়েটে এসএসসি ও এইচএসসি উভয়ে **জিপিএ ৪.০০** লাগে।',
      },
      sources: [{ label: { en: 'BUET Admission', bn: 'বুয়েট' }, url: 'https://admission.buet.ac.bd' }],
    })

    const { result } = renderHook(() => useAssistant(), { wrapper })

    act(() => result.current.send('BUET eligibility?'))

    await waitFor(() => expect(result.current.pending).toBe(false))

    const reply = result.current.messages.find((m) => m.role === 'assistant')
    expect(typeof reply.content).toBe('string')
    expect(reply.content).not.toContain('[object Object]')
    // Picks the English copy while the UI language is English
    expect(reply.content).toContain('GPA 4.00')
    expect(reply.sources).toHaveLength(1)
  })

  it('keeps the no_record status so the honesty card renders', async () => {
    vi.spyOn(assistantService, 'sendMessage').mockResolvedValue({
      status: 'no_record',
      message: { en: 'No verified record.', bn: 'কোনো রেকর্ড নেই।' },
      sources: [],
    })

    const { result } = renderHook(() => useAssistant(), { wrapper })
    act(() => result.current.send('unknown topic'))
    await waitFor(() => expect(result.current.pending).toBe(false))

    const reply = result.current.messages.find((m) => m.role === 'assistant')
    expect(reply.status).toBe('no_record')
    expect(reply.content).toBe('No verified record.')
  })
})
