import { useQuery } from '@tanstack/react-query'
import { testService } from '@/services/testService'

/** FR-6 — test list. */
export function useTests() {
  return useQuery({ queryKey: ['tests'], queryFn: testService.list })
}

export function useTest(id) {
  return useQuery({
    queryKey: ['tests', id],
    queryFn: () => testService.get(id),
    enabled: Boolean(id),
  })
}

export function useMyAttempts() {
  return useQuery({ queryKey: ['attempts', 'mine'], queryFn: testService.myAttempts })
}
