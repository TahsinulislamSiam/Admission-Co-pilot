import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { adminService } from '@/services/adminService'
import { universityService } from '@/services/universityService'

/** Admin overview stats (AI-1 counts + recent uploads). */
export function useAdminOverview() {
  return useQuery({ queryKey: ['admin', 'overview'], queryFn: adminService.getOverview })
}

/** All circulars (any status). */
export function useCirculars() {
  return useQuery({ queryKey: ['admin', 'circulars'], queryFn: adminService.listCirculars })
}

/** Single circular draft. */
export function useCircular(id) {
  return useQuery({
    queryKey: ['admin', 'circulars', id],
    queryFn: () => adminService.getCircular(id),
    enabled: Boolean(id),
  })
}

/** All university records, including unpublished ones (admin only). */
export function useAllUniversities() {
  return useQuery({
    queryKey: ['admin', 'universities'],
    queryFn: async () => {
      const [pub, priv] = await Promise.all([
        universityService.listPublic({ includeUnpublished: true }),
        universityService.listPrivate({ includeUnpublished: true }),
      ])
      return [...pub, ...priv]
    },
  })
}

/** Question bank with review statuses, optionally filtered. */
export function useQuestionReviews(status) {
  return useQuery({
    queryKey: ['admin', 'questions', status || 'all'],
    queryFn: () => adminService.listQuestions(status || undefined),
  })
}

/** Upload a PDF circular and let the backend run the extraction pipeline. */
export function useUploadCircular() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminService.uploadCircular(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin', 'circulars'] })
      qc.invalidateQueries({ queryKey: ['admin', 'overview'] })
    },
  })
}

/** Save edits to a circular draft (extraction review). */
export function useSaveCircularDraft() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => adminService.saveCircularDraft(id, payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin', 'circulars'] })
      qc.setQueryData(['admin', 'circulars', data.id], data)
    },
  })
}

/** Approve & publish a circular draft. */
export function useApproveCircular() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminService.approveCircular(id),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin'] })
      qc.setQueryData(['admin', 'circulars', data.id], data)
    },
  })
}

/** Reject a circular draft with a reason. */
export function useRejectCircular() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => adminService.rejectCircular(id, reason),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['admin'] })
      qc.setQueryData(['admin', 'circulars', data.id], data)
    },
  })
}

/** Create a university record. */
export function useCreateUniversity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => adminService.createUniversity(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

/** Update a university record (incl. publish toggle / verify). */
export function useUpdateUniversity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => adminService.updateUniversity(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

/** Delete a university record. */
export function useDeleteUniversity() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminService.deleteUniversity(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin'] }),
  })
}

/** Edit a question during review. */
export function useUpdateQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, payload }) => adminService.updateQuestion(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'questions'] }),
  })
}

/** Approve a question. */
export function useApproveQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => adminService.approveQuestion(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'questions'] }),
  })
}

/** Reject a question with a reason. */
export function useRejectQuestion() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({ id, reason }) => adminService.rejectQuestion(id, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin', 'questions'] }),
  })
}
