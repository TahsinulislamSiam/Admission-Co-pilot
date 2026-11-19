import { describe, expect, it, vi, afterEach } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useCountUp } from './useCountUp'

/** Pretend the visitor asked for reduced motion (or not). */
const setReducedMotion = (reduced) => {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query) => ({
      matches: reduced && query.includes('prefers-reduced-motion'),
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }))
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('useCountUp', () => {
  it('jumps straight to the value when motion is reduced', () => {
    setReducedMotion(true)
    const { result } = renderHook(() => useCountUp(42))
    expect(result.current).toBe(42)
  })

  it('shows the final value while disabled, then counts up once enabled', async () => {
    setReducedMotion(false)
    const { result, rerender } = renderHook(({ enabled }) => useCountUp(20, { enabled }), {
      initialProps: { enabled: false },
    })
    // Not animating yet: no flash of zero for content the visitor can already see.
    expect(result.current).toBe(20)

    rerender({ enabled: true })
    await waitFor(() => expect(result.current).toBe(20), { timeout: 3000 })
  })

  it('passes null through for a missing value (not yet loaded)', () => {
    setReducedMotion(false)
    const { result } = renderHook(() => useCountUp(undefined))
    expect(result.current).toBeNull()
  })
})
