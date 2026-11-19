import { useEffect, useRef, useState } from 'react'

const prefersReducedMotion = () =>
  typeof window !== 'undefined' &&
  typeof window.matchMedia === 'function' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Animate a number from 0 up to `value` once `enabled` turns true.
 *
 * Used by the home-page stat cards so the figures count up when they scroll into
 * view. Honours `prefers-reduced-motion` (jumps straight to the value) and
 * cancels the frame loop on unmount, so it cannot leak work.
 */
export function useCountUp(value, { duration = 900, enabled = true } = {}) {
  const target = typeof value === 'number' && Number.isFinite(value) ? value : null
  const [current, setCurrent] = useState(target && enabled ? 0 : target)
  const frame = useRef(0)

  useEffect(() => {
    if (target == null) {
      setCurrent(null)
      return undefined
    }
    if (!enabled || prefersReducedMotion()) {
      setCurrent(target)
      return undefined
    }

    const startAt = { current: null }
    const tick = (now) => {
      // The first frame defines the clock: mixing rAF timestamps with
      // performance.now() can be negative across environments (jsdom, workers).
      if (startAt.current == null) startAt.current = now
      const progress = Math.min(1, Math.max(0, (now - startAt.current) / duration))
      // easeOutCubic: fast first, gentle settle
      const eased = 1 - (1 - progress) ** 3
      setCurrent(Math.round(target * eased))
      if (progress < 1) frame.current = requestAnimationFrame(tick)
    }

    setCurrent(0)
    frame.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame.current)
  }, [target, duration, enabled])

  return current
}
