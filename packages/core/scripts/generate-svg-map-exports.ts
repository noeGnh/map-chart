// scripts/generate-svg-map-exports.ts
//
// Generates lightweight map descriptors ({ name, template }) rather than
// importing the raw SVG content — core itself is never bundled/published, so
// there's no reason to inline 264 SVG strings here. Framework packages'
// "lite" flavors (which fetch maps at runtime) re-export these descriptors
// as-is; "full" flavors have their own generator that turns the same source
// files into `?raw` imports so the content gets inlined into their bundle.
import fg from 'fast-glob'
import { writeFileSync } from 'fs'
import { basename, relative } from 'path'

async function run() {
  const files = (await fg('src/assets/maps/**/*.svg')).sort()

  const names = files.map((file) => basename(file).replace(/\.svg$/, ''))
  const uniqueNames = Array.from(new Set(names)).sort()

  const descriptorExports = files
    .map((file) => {
      const fileName = basename(file).replace(/\.svg$/, '')
      const relativePath = relative('src/assets/maps', file).replace(/\\/g, '/')
      const exportName = toPascalCase(fileName) + 'Map'
      return `export const ${exportName} = { name: '${exportName}', template: '${relativePath}' }`
    })
    .join('\n')

  const indexContent = `// Auto-generated file, run \`pnpm generate:svg-map-exports\`.
// Lightweight descriptors — see scripts/generate-svg-map-exports.ts.
${descriptorExports}
`

  const outputPath = 'src/maps.ts'

  writeFileSync(outputPath, indexContent)

  console.log(`✅ src/maps.ts generated with ${uniqueNames.length} map descriptors.`)
}

function toPascalCase(str: string): string {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, (c) => c.toUpperCase())
}

run().catch((err) => {
  console.error('❌ Descriptor generation error:', err)
  process.exit(1)
})
