import { defineConfig } from 'vite'
import { loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const backendPort = env.PORT || '3001'
  const fishHost = env.FISH_HOST || '127.0.0.1'
  const fishPort = env.FISH_PORT || '8000'
  const fishTarget = `http://${fishHost}:${fishPort}`

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
        },
        '/fish-api': {
          target: fishTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/fish-api/, '/api'),
        },
        '/fish-auth': {
          target: fishTarget,
          changeOrigin: true,
          rewrite: (path) => path.replace(/^\/fish-auth/, '/auth'),
        },
        '/fish-ws': {
          target: fishTarget,
          changeOrigin: true,
          ws: true,
          rewrite: (path) => path.replace(/^\/fish-ws/, '/ws'),
        },
      },
    },
  }
})
