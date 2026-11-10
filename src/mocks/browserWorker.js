/** MSW browser worker wiring (dev-only fake backend). */
import { setupWorker } from 'msw/browser'
import { handlers } from './handlers'

export const worker = setupWorker(...handlers)
