import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/map-chart' : '/',
  plugins: [react()],
  resolve: {
    alias: {
      '@arkn/react-map-chart':
        process.env.NODE_ENV === 'production'
          ? '@arkn/react-map-chart'
          : '@arkn/react-map-chart/src/index.ts',
      '@arkn/react-map-chart-lite':
        process.env.NODE_ENV === 'production'
          ? '@arkn/react-map-chart-lite'
          : '@arkn/react-map-chart-lite/src/index.ts',
    },
    dedupe: ['react', 'react-dom'],
  },
  build: {
    minify: false,
  },
  optimizeDeps: {
    exclude: ['@arkn/react-map-chart', '@arkn/react-map-chart-lite'],
  },
  server: {
    port: 4321,
  },
})
