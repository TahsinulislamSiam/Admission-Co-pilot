import { useQuery } from '@tanstack/react-query'
import { newsService } from '@/services/newsService'

/**
 * Headlines refresh on their own: the server caches each feed for 10 minutes,
 * so polling every 5 minutes is cheap and picks up new stories automatically.
 */
export function useNews(scope = 'all') {
  return useQuery({
    queryKey: ['news', scope],
    queryFn: () => newsService.list(scope, 24),
    staleTime: 5 * 60 * 1000,
    refetchInterval: 5 * 60 * 1000,
    refetchOnWindowFocus: true,
  })
}

export function useNewsPapers() {
  return useQuery({
    queryKey: ['news', 'papers'],
    queryFn: () => newsService.papers(),
    staleTime: 15 * 60 * 1000,
    refetchInterval: 15 * 60 * 1000,
  })
}
