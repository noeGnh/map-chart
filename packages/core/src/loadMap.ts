import { isSVG, sanitizeSVG } from './utils'

/**
 * Validates and (by default) sanitizes a customMapSvg prop before it's
 * injected into the DOM. Returns null if the input isn't a well-formed SVG
 * document at all.
 */
export function resolveCustomMapSvg(
  customMapSvg: string,
  sanitize: boolean
): string | null {
  if (!isSVG(customMapSvg)) return null

  return sanitize ? sanitizeSVG(customMapSvg) : customMapSvg
}

export interface MapDescriptor {
  name: string
  template: string
}

const CACHE_TTL_MS = 28 * 24 * 60 * 60 * 1000

function mapCacheKey(name: string, version: string): string {
  return `${name}@${version}`
}

/**
 * Synchronous cache lookup — returns null on a miss or an expired entry, so
 * the caller can decide whether a fetch (and its loading state) is needed at
 * all without ever awaiting anything for a cache hit.
 */
export function getCachedMapSvg(name: string, version: string): string | null {
  const cached = localStorage.getItem(mapCacheKey(name, version))
  if (!cached) return null

  const { svg, timestamp } = JSON.parse(cached)
  return Date.now() - timestamp < CACHE_TTL_MS ? svg : null
}

/**
 * Fetches a built-in map's SVG over the network — no cache check, always
 * fetches — pinned to the exact release `version` (an immutable Git tag)
 * rather than a mutable branch. Validates, sanitizes, and caches the result
 * in localStorage for 28 days under a version-scoped key so upgrading never
 * serves a map cached by a previous release.
 */
export async function fetchAndCacheMapSvg(
  descriptor: MapDescriptor,
  version: string
): Promise<string> {
  const svgUrl = `https://cdn.jsdelivr.net/gh/noeGnh/vue3-map-chart@v${version}/packages/core/src/assets/maps/${descriptor.template}`

  const response = await fetch(svgUrl)
  if (!response.ok) {
    throw new Error(`Failed to fetch map "${descriptor.name}": ${response.status}`)
  }

  const rawSvg = await response.text()
  if (!isSVG(rawSvg)) {
    throw new Error(`Fetched content for map "${descriptor.name}" is not a valid SVG`)
  }

  const svg = sanitizeSVG(rawSvg)

  localStorage.setItem(mapCacheKey(descriptor.name, version), JSON.stringify({ svg, timestamp: Date.now() }))

  return svg
}
