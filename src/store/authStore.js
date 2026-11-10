import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { STORAGE_KEYS, ROLES } from '@/lib/constants'

/**
 * Auth + session state (persisted to localStorage).
 * The actual login/register calls live in authService — the store only keeps state.
 */
export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      status: 'idle', // idle | authenticated

      setAuth: ({ user, token }) => set({ user, token, status: 'authenticated' }),
      setUser: (user) => set({ user }),
      clearAuth: () => set({ user: null, token: null, status: 'idle' }),

      logout: () => {
        set({ user: null, token: null, status: 'idle' })
        return get()
      },
    }),
    {
      name: STORAGE_KEYS.auth,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ user: s.user, token: s.token, status: s.status }),
    }
  )
)

// Selectors
export const selectIsAuthenticated = (s) => Boolean(s.token)
export const selectIsAdmin = (s) => s.user?.role === ROLES.ADMIN
