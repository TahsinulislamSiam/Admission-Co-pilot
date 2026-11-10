import { create } from 'zustand'

export const MAX_COMPARE = 3

/** Selection state for the private-university side-by-side comparison (FR-3). */
export const useCompareStore = create((set, get) => ({
  ids: [],

  toggle: (id) => {
    const current = get().ids
    if (current.includes(id)) {
      set({ ids: current.filter((x) => x !== id) })
      return 'removed'
    }
    if (current.length >= MAX_COMPARE) return 'max'
    set({ ids: [...current, id] })
    return 'added'
  },
  remove: (id) => set((s) => ({ ids: s.ids.filter((x) => x !== id) })),
  clear: () => set({ ids: [] }),
}))
