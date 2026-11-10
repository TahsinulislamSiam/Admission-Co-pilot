import { useQuery } from '@tanstack/react-query'
import { analysisService } from '@/services/analysisService'

/** FR-8 — aggregated dashboard analytics for the signed-in student. */
export function useDashboardAnalytics() {
  return useQuery({
    queryKey: ['analytics', 'dashboard'],
    queryFn: analysisService.getDashboard,
  })
}
