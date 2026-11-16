
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  const assistantPort = env.ASSISTANT_PORT || '8787';
  const liveAssistant = env.VITE_ASSISTANT_MODE === 'live';

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
            // live mode: OpenAI streaming proxy (server/index.js, `npm run dev:server`)
            '/api/assistant': {
              target: `http://localhost:${assistantPort}`,
              changeOrigin: true,
            },
          }
        : {
            // default: Gemini server (server/gemini.js, `npm run server`)
            '/api/assistant/chat': 'http://localhost:3001',
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
  };
});
