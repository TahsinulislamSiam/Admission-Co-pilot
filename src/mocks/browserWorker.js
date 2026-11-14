/** MSW browser worker wiring (dev-only fake backend). */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

const LIVE_ASSISTANT = import.meta.env.VITE_ASSISTANT_MODE === 'live'

/**
 * In live mode the assistant chat must reach the Node proxy in server/, so the
 * mock handlers for those paths are dropped. All other endpoints stay mocked.
 */
const activeHandlers = LIVE_ASSISTANT
  ? handlers.filter((h) => !String(h.info?.path).includes('/api/assistant'))
  : handlers

export const worker = setupWorker(...activeHandlers)
