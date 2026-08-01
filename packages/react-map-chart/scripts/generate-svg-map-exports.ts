// scripts/generate-svg-map-exports.ts
//
// Same idea as vue3-map-chart's generator: turns @map-chart/core's source
// SVGs into `?raw` imports that get inlined into this package's own build.
// The extra `as unknown as ComponentType` cast exists only because JSX/TSX
// requires an element's tag to type-check as a component — MapChart never
// actually mounts these (it reads the raw string back off the vnode's
// `type`), so the cast is a compile-time-only fiction with no runtime
// effect, matching Vue's more permissive template typing for the same
// pattern.
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
      const exportName = toPascalCase(fileName) + 'Map'
      const rawImportName = '_' + exportName + 'Raw'
      return (
        `import ${rawImportName} from '@map-chart/core/assets/maps/${relativePath}?raw'\n` +
        `export const ${exportName} = ${rawImportName} as unknown as ComponentType`
      )
    })
    .join('\n')

  const indexContent = `// Auto-generated index file, run \`pnpm generate:svg-map-exports\`.
import type { ComponentType } from 'react'

import { MapChart } from './components/MapChart'

// Export MapChart component
export { MapChart }
export type { MapChartProps } from './components/MapChart'

// Tree-shakeable map exports
${directExports}
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
