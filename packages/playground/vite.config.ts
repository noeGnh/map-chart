import vue from '@vitejs/plugin-vue'
// import { visualizer } from 'rollup-plugin-visualizer'
import AutoImport from 'unplugin-auto-import/vite'
import { defineConfig } from 'vite'
import SvgLoader from 'vite-svg-loader'

process.env.NODE_ENV
export default defineConfig({
  base: process.env.NODE_ENV === 'production' ? '/map-chart' : '/',
  plugins: [
    vue(),
    /* visualizer({
      filename: 'dist/stats.html',
      open: true, // open in browser
      gzipSize: true,
      brotliSize: true,
      template: 'treemap', // or 'sunburst', 'network'
    }), */
    AutoImport({
      // targets to transform
      include: [
        /\.[tj]sx?$/, // .ts, .tsx, .js, .jsx
        /\.vue$/,
        /\.vue\?vue/, // .vue
        /\.md$/, // .md
      ],
      // global imports to register
      imports: [
        // presets
        'vue',
      ],

      // Auto import for module exports under directories
      // by default it only scan one level of modules under the directory
      dirs: [],

      // Auto import inside Vue template
      // see https://github.com/unjs/unimport/pull/15 and https://github.com/unjs/unimport/pull/72
      vueTemplate: true,

      eslintrc: {
        enabled: true, // Default `false`
        filepath: './.eslintrc-auto-import.json', // Default `./.eslintrc-auto-import.json`
        globalsPropValue: true, // Default `true`, (true | false | 'readonly' | 'readable' | 'writable' | 'writeable')
      },
    }),
    SvgLoader({
      defaultImport: 'url', // or 'raw'
    }),
  ],
  resolve: {
    alias: {
      'vue3-map-chart':
        process.env.NODE_ENV === 'production'
          ? 'vue3-map-chart'
          : 'vue3-map-chart/src/index.ts',
      'vue3-map-chart-lite':
        process.env.NODE_ENV === 'production'
          ? 'vue3-map-chart-lite'
          : 'vue3-map-chart-lite/src/index.ts',
    },
    dedupe: ['vue'],
  },
  build: {
    minify: false,
    rollupOptions: {
      //
    },
  },
  optimizeDeps: {
    exclude: ['vue3-map-chart', 'vue3-map-chart-lite'],
  },
  server: {
    port: 4320,
  },
})
