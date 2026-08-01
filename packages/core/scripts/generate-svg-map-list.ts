// scripts/generate-svg-map-list.ts
import fg from 'fast-glob'
import { mkdirSync, writeFileSync } from 'fs'
import { basename, dirname } from 'path'

async function run() {
  const files = await fg('src/assets/maps/**/*.svg')

  const names = files.map((file) => basename(file).replace(/\.svg$/, ''))

  const uniqueNames = Array.from(new Set(names)).sort()

  const typeDef = `// This file is generated automatically.
// Do not modify manually.

  ${uniqueNames.map((name) => `${toPascalCase(name)}Map`).join('\n  ')}
`

  const outputPath = 'map-list.txt'

  mkdirSync(dirname(outputPath), { recursive: true })

  writeFileSync(outputPath, typeDef)

  console.log(`✅ Map list generated with ${uniqueNames.length} names.`)
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())
}

run().catch((err) => {
  console.error('Map list generation error:', err)
  process.exit(1)
})
