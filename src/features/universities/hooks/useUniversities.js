import { useQuery } from '@tanstack/react-query'
import { universityService } from '@/services/universityService'

/** Public university list (FR-2). */
export function usePublicUniversities(includeUnpublished = false) {
  return useQuery({
    queryKey: ['universities', 'public', { includeUnpublished }],
    queryFn: () => universityService.listPublic({ includeUnpublished }),
  })
}

export function usePublicUniversity(id) {
  return useQuery({
    queryKey: ['universities', 'public', id],
    queryFn: () => universityService.getPublic(id),
    enabled: Boolean(id),
  })
}

/** Private university list (FR-3). */
export function usePrivateUniversities(includeUnpublished = false) {
  return useQuery({
    queryKey: ['universities', 'private', { includeUnpublished }],
    queryFn: () => universityService.listPrivate({ includeUnpublished }),
  })
}

export function usePrivateUniversity(id) {
  return useQuery({
    queryKey: ['universities', 'private', id],
    queryFn: () => universityService.getPrivate(id),
    enabled: Boolean(id),
  })
}
