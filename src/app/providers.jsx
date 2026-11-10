/**
 * Provider composition lives in App.jsx (QueryClientProvider + RouterProvider
 * + Toaster + i18n via side-effect import). Kept separate so tests can mount
 * individual providers as needed.
 */
export { default } from './App'
