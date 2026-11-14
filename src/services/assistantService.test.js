import { describe, it, expect, vi, afterEach } from 'vitest'
import { assistantService, isLiveAssistant } from './assistantService'

/** Build a Response whose body streams the given SSE frames. */
function sseResponse(frames, { ok = true, status = 200 } = {}) {
  const encoder = new TextEncoder()
  const body = new ReadableStream({
    start(controller) {
      for (const f of frames) controller.enqueue(encoder.encode(f))
      controller.close()
    },
  })
  return { ok, status, body, json: async () => ({}) }
}

const frame = (event, data) => `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`

describe('assistantService.streamMessage', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('accumulates deltas, sources and final status', async () => {
    const frames = [
      frame('delta', { text: 'Hello ' }),
      frame('delta', { text: 'world' }),
      frame('sources', { sources: [{ url: 'https://admission.buet.ac.bd' }] }),
      frame('done', { status: 'ok' }),
    ]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(frames)))

    const chunks = []
    const result = await assistantService.streamMessage({
      message: 'hi',
      lang: 'en',
      onDelta: (t) => chunks.push(t),
    })

    expect(chunks).toEqual(['Hello ', 'world'])
    expect(result.text).toBe('Hello world')
    expect(result.status).toBe('ok')
    expect(result.sources).toHaveLength(1)
  })

  it('handles frames split across chunk boundaries', async () => {
    const whole = frame('delta', { text: 'split' }) + frame('done', { status: 'ok' })
    // Chop into awkward 7-byte pieces to force partial frames
    const pieces = whole.match(/[\s\S]{1,7}/g)
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(pieces)))

    const result = await assistantService.streamMessage({ message: 'x', lang: 'en' })
    expect(result.text).toBe('split')
  })

  it('surfaces a no_record status', async () => {
    const frames = [frame('delta', { text: 'no data' }), frame('done', { status: 'no_record' })]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(frames)))
    const result = await assistantService.streamMessage({ message: 'x', lang: 'bn' })
    expect(result.status).toBe('no_record')
  })

  it('throws a normalized error for non-OK responses', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 503,
        body: null,
        json: async () => ({ message: 'missingApiKey' }),
      })
    )
    await expect(assistantService.streamMessage({ message: 'x', lang: 'en' })).rejects.toEqual({
      status: 503,
      message: 'missingApiKey',
    })
  })

  it('throws an error when the stream reports one mid-flight', async () => {
    const frames = [frame('delta', { text: 'partial' }), frame('error', { message: 'assistantError' })]
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(sseResponse(frames)))
    await expect(assistantService.streamMessage({ message: 'x', lang: 'en' })).rejects.toEqual({
      status: 502,
      message: 'assistantError',
    })
  })
})

describe('isLiveAssistant', () => {
  it('defaults to mock mode when the flag is not set', () => {
    expect(isLiveAssistant()).toBe(false)
  })
})
