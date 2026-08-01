// scripts/generate-svg-map-type.ts
import fg from 'fast-glob'
import { mkdirSync, writeFileSync } from 'fs'
import { basename, dirname } from 'path'

async function run() {
  const files = await fg('src/assets/maps/**/*.svg')

  const names = files.map((file) => basename(file).replace(/\.svg$/, ''))

  const uniqueNames = Array.from(new Set(names)).sort()

  const typeDef = `// This file is generated automatically.
// Do not modify manually.

export type MapName =
  ${uniqueNames.map((name) => `| '${name}'`).join('\n  ')};
`

  const outputPath = 'src/types/map-names.ts'

  mkdirSync(dirname(outputPath), { recursive: true })

  writeFileSync(outputPath, typeDef)

  console.log(`✅ Type MapName generated with ${uniqueNames.length} names.`)
}

run().catch((err) => {
  console.error('MapName type generation error:', err)
  process.exit(1)
})
