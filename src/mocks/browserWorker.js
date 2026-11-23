/** MSW browser worker wiring (dev-only fake backend). */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

const LIVE_ASSISTANT = import.meta.env.VITE_ASSISTANT_MODE === 'live'

/**
 * In live mode the assistant chat must reach the Node proxy in server/, so the
 * mock handlers for those paths are dropped. All other endpoints stay mocked.
 */
const USE_DB = import.meta.env.VITE_USE_DB === 'true'

/** Paths served by the real Express + Neon API when VITE_USE_DB=true. */
const DB_PATHS = [
  '/api/auth',
  '/api/users/me/profile',
  '/api/universities',
  // only the admin endpoints Express actually implements — overview, circulars
  // and questions still come from the mock DB
  '/api/admin/users',
  '/api/admin/universities',
  '/api/admin/videos',
  '/api/videos',
  '/api/mail',
]

const activeHandlers = handlers.filter((h) => {
  const path = String(h.info?.path)
  if (LIVE_ASSISTANT && path.includes('/api/assistant')) return false
  if (USE_DB && DB_PATHS.some((p) => path.startsWith(p))) return false
  return true
})

export const worker = setupWorker(...activeHandlers)
