
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'node:path'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const assistantPort = env.ASSISTANT_PORT || '8787'
  const liveAssistant = env.VITE_ASSISTANT_MODE === 'live'

  return {
    plugins: [react()],

    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
    },

    server: {
      port: 5173,

      // Assistant API proxy
      proxy: liveAssistant
        ? {
            '/api/assistant': {
              target: `http://localhost:${assistantPort}`,
              changeOrigin: true,
            },
          }
        : {
            '/api/assistant/chat': {
              target: 'http://localhost:3001',
              changeOrigin: true,
            },
          },
    },

    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.js'],
      globals: true,
      css: true,
    },
  }
})
