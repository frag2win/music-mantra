/// <reference types="vitest" />
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { requestHandler } from './server/index.ts'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-server-middleware',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          if (req.url && req.url.startsWith('/api')) {
            requestHandler(req, res)
          } else {
            next()
          }
        })
      },
    },
  ],

  server: {
    watch: {
      ignored: ['**/public/mantras/**'],
    },
  },

  // Allow AudioWorklet files to be served correctly
  worker: {
    format: 'es',
  },

  // Vitest configuration
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.test.ts'],
  },
})

