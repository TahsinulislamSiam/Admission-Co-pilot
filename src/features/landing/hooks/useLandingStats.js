import { useQuery } from '@tanstack/react-query'
import { universityService } from '@/services/universityService'
import { testService } from '@/services/testService'

/**
 * Live numbers for the home page stat cards.
 *
 * Nothing here is hardcoded: the counts come from the same endpoints the rest of
 * the app uses, so publishing a university or adding a test in the admin panel
 * changes the landing page too. Cached for 5 minutes so a visitor costs two GETs.
 */
export function useLandingStats() {
  return useQuery({
    queryKey: ['landing', 'stats'],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const [publicUnis, privateUnis, tests] = await Promise.all([
        universityService.listPublic(),
        universityService.listPrivate(),
        testService.list(),
      ])

      // Practice questions are counted once each, not once per test that uses them.
      const questionIds = new Set()
      for (const test of tests) {
        for (const id of test.questionIds || []) questionIds.add(id)
      }

      return {
        universities: publicUnis.length + privateUnis.length,
        questions: questionIds.size,
        tests: tests.length,
      }
    },
  })
}
