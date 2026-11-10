import { useEffect } from 'react'
import { QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { queryClient } from '@/lib/queryClient'
import { authService } from '@/services/authService'
import { router } from './router'
import i18n from '@/lib/i18n'
import { useAuthStore } from '@/store/authStore'

/**
 * App bootstrap:
 * - wires i18n (default Bangla)
 * - revalidates the persisted auth token on boot
 * - mounts TanStack Query + the data router
 */
export default function App() {
  useEffect(() => {
    // Keep <html lang> in sync with the active language
    document.documentElement.lang = i18n.language
  }, [])

  useEffect(() => {
    const { token } = useAuthStore.getState()
    if (token) {
      // Silently re-validate; a 401 clears the store via the axios interceptor
      authService.me().catch(() => {})
    }
  }, [])

  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
      <Toaster
        position="top-center"
        toastOptions={{
          duration: 3500,
          style: {
            background: '#064e3b',
            color: '#fff',
            fontSize: '0.9rem',
            maxWidth: '480px',
          },
          success: { iconTheme: { primary: '#34d399', secondary: '#fff' } },
          error: { iconTheme: { primary: '#fda4af', secondary: '#fff' } },
        }}
      />
    </QueryClientProvider>
  )
}
