import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { professorService } from '@/services/professorService'

/** Faculty directory queries — shared by the student page and the admin editor. */

export function useProfessors(q = '') {
  return useQuery({
    queryKey: ['professors', q],
    queryFn: () => professorService.list(q),
  })
}

export function useAddProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload) => professorService.create(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professors'] }),
  })
}

export function useDeleteProfessor() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (id) => professorService.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['professors'] }),
  })
}
