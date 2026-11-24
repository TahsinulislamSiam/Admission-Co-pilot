
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const assistantPort = env.ASSISTANT_PORT || '8787';
  const liveAssistant = env.VITE_ASSISTANT_MODE === 'live';
  const useDb = env.VITE_USE_DB === 'true';
  const dbProxy = useDb
    ? Object.fromEntries(
        [
          '/api/auth',
          '/api/users',
          '/api/universities',
          '/api/admin/users',
          '/api/admin/universities',
          '/api/admin/videos',
          '/api/videos',
          '/api/mail',
          '/api/professors',
          '/api/admin/professors',
          '/api/news',
        ].map((p) => [
          p,
          { target: `http://localhost:${assistantPort}`, changeOrigin: true },
        ])
      )
    : {};

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
      proxy: {
        ...dbProxy,
        ...(liveAssistant
          ? {
              // live mode: Gemini streaming proxy (server/index.js, `npm run dev:server`)
              '/api/assistant': {
                target: `http://localhost:${assistantPort}`,
                changeOrigin: true,
              },
              // Postgres health (server/db.js) lives on the same API server.
              '/api/db': `http://localhost:${assistantPort}`,
              '/api/health': `http://localhost:${assistantPort}`,
            }
          : {
              // default: Gemini server (server/gemini.js, `npm run server`)
              '/api/assistant/chat': 'http://localhost:3001',
              // Postgres health (server/db.js) lives on the same API server.
              '/api/db': `http://localhost:${assistantPort}`,
              '/api/health': `http://localhost:${assistantPort}`,
            }),
      },
    },

    test: {
      environment: 'jsdom',
      setupFiles: ['./vitest.setup.js'],
      globals: true,
      css: true,
      // heavy pages (charts, MSW round-trips) exceed 5s when all files run in parallel
      testTimeout: 20000,
      hookTimeout: 20000,
    },
  }
})
