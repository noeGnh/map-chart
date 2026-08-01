// scripts/generate-svg-map-exports.ts
//
// Unlike @map-chart/core's own generator (which produces lightweight
// { name, template } descriptors), this package bundles the actual maps, so
// it turns @map-chart/core's source SVGs into `?raw` imports that get
// inlined into this package's own build.
import fg from 'fast-glob'
import { writeFileSync } from 'fs'
import { basename, relative } from 'path'

async function run() {
  const files = (await fg('../core/src/assets/maps/**/*.svg')).sort()

  const names = files.map((file) => basename(file).replace(/\.svg$/, ''))
  const uniqueNames = Array.from(new Set(names)).sort()

  const directExports = files
    .map((file) => {
      const fileName = basename(file).replace(/\.svg$/, '')
      const relativePath = relative('../core/src/assets/maps', file).replace(
        /\\/g,
        '/'
      )
      return `export { default as ${
        toPascalCase(fileName) + 'Map'
      } } from '@map-chart/core/assets/maps/${relativePath}?raw'`
    })
    .join('\n')

  const indexContent = `// Auto-generated index file, run \`pnpm generate:svg-map-exports\`.
import MapChart from './components/MapChart.vue'

// Export MapChart component
export { MapChart }

// Tree-shakeable map exports
${directExports}

// Plugin export (import separately to avoid bundling issues)
export { default as plugin } from './plugin'
export { default } from './plugin'
`

  writeFileSync('src/index.ts', indexContent)

  console.log(`✅ index.ts generated with ${uniqueNames.length} map exports.`)
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())
}

run().catch((err) => {
  console.error('❌ Index generation error:', err)
  process.exit(1)
})
