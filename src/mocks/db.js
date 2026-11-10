/**
 * In-memory "database" for MSW handlers. Mutated by POST/PATCH/DELETE calls so
 * the whole app behaves like a real backend during development.
 */
import { seedUsers } from './seed/users'
import { publicUniversities } from './seed/publicUniversities'
import { privateUniversities } from './seed/privateUniversities'
import { questionReviews } from './seed/questions'
import { tests, attempts } from './seed/tests'
import { circulars } from './seed/circulars'

const db = {
  users: JSON.parse(JSON.stringify(seedUsers)),
  publicUniversities: JSON.parse(JSON.stringify(publicUniversities)),
  privateUniversities: JSON.parse(JSON.stringify(privateUniversities)),
  questionReviews: JSON.parse(JSON.stringify(questionReviews)),
  tests: JSON.parse(JSON.stringify(tests)),
  attempts: JSON.parse(JSON.stringify(attempts)),
  circulars: JSON.parse(JSON.stringify(circulars)),
}

let nextAttempt = attempts.length + 1
export const createAttemptId = () => `attempt-${nextAttempt++}`

export default db
