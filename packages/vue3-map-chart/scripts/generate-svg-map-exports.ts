// scripts/generate-index.ts
import fg from 'fast-glob'
import { mkdirSync, writeFileSync } from 'fs'
import { basename, dirname, relative } from 'path'

async function run() {
  const files = (await fg('src/assets/maps/**/*.svg')).sort()

  const names = files.map((file) => basename(file).replace(/\.svg$/, ''))

  const uniqueNames = Array.from(new Set(names)).sort()

  // Generate direct exports for tree shaking
  const directExports = files
    .map((file) => {
      const fileName = basename(file).replace(/\.svg$/, '')
      const relativePath = './' + relative('src', file).replace(/\\/g, '/')
      return `export { default as ${
        toPascalCase(fileName) + 'Map'
      } } from '${relativePath}?raw'`
    })
    .join('\n')

  // Generate path mapping for plugin
  /* const pathMapping = files
    .map((file) => {
      const fileName = basename(file).replace(/\.svg$/, '')
      const relativePath = relative('src/assets/maps', file).replace(/\\/g, '/')
      const pascalName = toPascalCase(fileName)
      return `  ${pascalName}: '${relativePath}',`
    })
    .join('\n') */

  // Generate maps.ts file
  /* const mapsContent = `// Auto-generated maps file
// Map of component names to their file paths
export const mapPaths: Record<string, string> = {
${pathMapping}
}
` */

  const indexContent = `// Auto-generated index file
import MapChart from './components/MapChart.vue'

// Export MapChart component
export { MapChart }

// Tree-shakeable map exports
${directExports}

// Plugin export (import separately to avoid bundling issues)
export { default as plugin } from './plugin'
export { default } from './plugin'
`

  const indexOutputPath = 'src/index.ts'
  // const mapsOutputPath = 'src/maps.ts'

  mkdirSync(dirname(indexOutputPath), { recursive: true })
  // mkdirSync(dirname(mapsOutputPath), { recursive: true })

  writeFileSync(indexOutputPath, indexContent)
  // writeFileSync(mapsOutputPath, mapsContent)

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
