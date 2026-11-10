import React from 'react'
import ReactDOM from 'react-dom/client'
import App from '@/app/App'
import '@/lib/i18n'
import '@/styles/index.css'

// Enable the MSW mock backend in dev (and in preview when VITE_ENABLE_MOCKS=true)
async function prepare() {
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_MOCKS === 'true') {
    const { worker } = await import('@/mocks/browserWorker')
    return worker.start({ onUnhandledRequest: 'bypass' })
  }
}

prepare().then(() => {
  ReactDOM.createRoot(document.getElementById('root')).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )
})
