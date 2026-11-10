import { QueryClient } from '@tanstack/react-query'

/** Shared TanStack Query client with sane defaults for the mock API. */
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 15_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
    mutations: {
      retry: 0,
    },
  },
})
