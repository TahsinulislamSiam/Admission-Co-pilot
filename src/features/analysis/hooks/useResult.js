import { useQuery } from '@tanstack/react-query'
import { testService } from '@/services/testService'
import { analysisService } from '@/services/analysisService'

/** Result for one attempt (AI-5/AI-6/AI-7 payload). */
export function useResult(attemptId) {
  return useQuery({
    queryKey: ['results', attemptId],
    queryFn: () => testService.getResult(attemptId),
    enabled: Boolean(attemptId),
  })
}

/** Step-by-step Bangla explanation for a question (AI-5). */
export function useExplanation(questionId, enabled) {
  return useQuery({
    queryKey: ['explanations', questionId],
    queryFn: () => analysisService.getExplanation(questionId),
    enabled: Boolean(questionId) && enabled,
    staleTime: 5 * 60_000,
  })
}
