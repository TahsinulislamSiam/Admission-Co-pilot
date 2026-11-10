import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import i18n from '@/lib/i18n'
import { STORAGE_KEYS } from '@/lib/constants'

/** UI state: active language + student sidebar (mobile) */
export const useUiStore = create(
  persist(
    (set) => ({
      language: i18n.language || 'bn',
      sidebarOpen: false,

      setLanguage: (lang) => {
        i18n.changeLanguage(lang)
        window.localStorage.setItem(STORAGE_KEYS.language, lang)
        document.documentElement.lang = lang
        set({ language: lang })
      },
      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
    }),
    {
      name: STORAGE_KEYS.language,
      storage: createJSONStorage(() => localStorage),
      partialize: (s) => ({ language: s.language }),
    }
  )
)
