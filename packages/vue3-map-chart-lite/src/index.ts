import MapChart from './components/MapChart.vue'

// Export MapChart component
export { MapChart }

// Tree-shakeable map exports — the { name, template } descriptors are
// generated once in @map-chart/core and shared verbatim, since the lite
// package never needs to bundle the actual SVG content (fetched at runtime).
export * from '@map-chart/core/maps'

// Plugin export (import separately to avoid bundling issues)
export { default as plugin } from './plugin'
export { default } from './plugin'
