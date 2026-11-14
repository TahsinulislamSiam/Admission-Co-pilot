import { useEffect, useRef, useState } from 'react'

/**
 * Reveal-on-scroll helper.
 *
 * Returns a [ref, shown] pair. `shown` flips to true the first time the
 * element enters the viewport, so callers can swap in a Tailwind animation
 * class. Elements already in view on mount animate immediately, and users
 * with `prefers-reduced-motion` never wait for a transition.
 *
 * Falls back to "always shown" where IntersectionObserver is unavailable
 * (jsdom tests, very old browsers).
 */
export function useReveal({ threshold = 0.15, rootMargin = '0px 0px -60px 0px' } = {}) {
  const ref = useRef(null)
  const [shown, setShown] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || typeof IntersectionObserver === 'undefined') {
      setShown(true)
      return undefined
    }

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduceMotion) {
      setShown(true)
      return undefined
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setShown(true)
            observer.disconnect()
          }
        }
      },
      { threshold, rootMargin }
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [threshold, rootMargin])

  return [ref, shown]
}
