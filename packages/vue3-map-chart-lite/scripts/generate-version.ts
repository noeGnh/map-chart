// scripts/generate-version.ts
import { readFileSync, writeFileSync } from 'fs'

function run() {
  const pkg = JSON.parse(readFileSync('package.json', 'utf-8'))

  const content = `// Auto-generated file, run \`pnpm generate:version\` after bumping the package version.
export const V3MC_VERSION = '${pkg.version}'
`

  writeFileSync('src/version.ts', content)

  console.log(`✅ src/version.ts generated with version ${pkg.version}.`)
}

run()
