import countries from 'i18n-iso-countries'
import iso3166 from 'iso-3166-2'

import type { MapData, MapDataValue } from './types'
import { isValidIsoCode } from './utils'

export interface AreaEventResolution {
  id: string | null
  value: number | MapDataValue | null | undefined
  /**
   * Whether this target represents a real, recognized area — a valid ISO
   * country/subdivision code on a built-in map, or any id at all on a
   * customMapSvg (whose ids are author-defined, not ISO codes).
   */
  isValidArea: boolean
}

/**
 * Resolves a hover/click DOM target against the (already case-normalized)
 * data, for a framework wrapper to turn into an event/callback.
 */
export function resolveAreaEvent(
  target: { getAttribute(name: string): string | null },
  options: { data: MapData; langCode: string; isCustomSvg: boolean }
): AreaEventResolution {
  const id = target.getAttribute('id')
  const value = id ? options.data[id] : null

  const isValidArea = !!(
    (id &&
      isValidIsoCode(id) &&
      (countries.getName(id, options.langCode) || iso3166.subdivision(id)?.name)) ||
    options.isCustomSvg
  )

  return { id, value, isValidArea }
}
