import { useQuery } from '@tanstack/react-query'
import { recommendationService } from '@/services/recommendationService'
import { useAuthStore } from '@/store/authStore'

/** AI-4 — recommendations for the signed-in student. */
export function useRecommendations() {
  const hasProfile = useAuthStore((s) => {
    const p = s.user?.profile
    return Boolean(p && p.hscGpa != null && p.group)
  })

  return useQuery({
    queryKey: ['recommendations'],
    queryFn: recommendationService.getRecommendations,
    enabled: hasProfile,
    retry: false,
    // 422 (incomplete profile) is surfaced via isError, not a retry loop
  })
}
