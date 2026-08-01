// scripts/generate-svg-map-exports.ts
//
// Re-exports @map-chart/core's { name, template } descriptors as-is (the
// lite package never bundles the actual SVG content, fetched at runtime),
// with an `as unknown as ComponentType` cast — needed only so `<AfricaMap />`
// type-checks as JSX (MapChart never actually mounts it, it reads the
// descriptor back off the vnode's `type`).
import fg from 'fast-glob'
import { writeFileSync } from 'fs'
import { basename } from 'path'

async function run() {
  const files = (await fg('../core/src/assets/maps/**/*.svg')).sort()

  const names = files.map((file) => basename(file).replace(/\.svg$/, ''))
  const uniqueNames = Array.from(new Set(names)).sort()

  const exportNames = uniqueNames.map((name) => toPascalCase(name) + 'Map')

  const directExports = exportNames
    .map((exportName) => `export const ${exportName} = coreMaps.${exportName} as unknown as ComponentType`)
    .join('\n')

  const indexContent = `// Auto-generated index file, run \`pnpm generate:svg-map-exports\`.
import type { ComponentType } from 'react'

import * as coreMaps from '@map-chart/core/maps'

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
