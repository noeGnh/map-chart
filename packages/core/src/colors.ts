import type { MapData } from './types'
import { isObject } from './utils'

/**
 * Keys built-in maps exactly as the SVG element ids expect them (uppercase
 * ISO codes, so `data: { fr: 1 }` behaves like `{ FR: 1 }`) and leaves a
 * customMapSvg's data untouched, since its ids are whatever the author chose.
 */
export function normalizeMapData(data: MapData, isCustomSvg: boolean): MapData {
  if (isCustomSvg) return data

  const result: MapData = {}
  Object.keys(data).forEach((key) => {
    result[key.toUpperCase()] = data[key]
  })
  return result
}

export interface MapStyleOptions {
  containerId: string
  baseColor: string
  displayLegend: boolean
}

/**
 * Builds the CSS rules (fill/opacity per area, scaled between the data's min
 * and max) for a given container id. Caller is responsible for injecting the
 * result into a <style> tag and for resetting it between calls — otherwise
 * rules only ever accumulate.
 */
export function buildMapStyleCss(data: MapData, options: MapStyleOptions): string {
  let css = ''

  if (!isObject(data)) return css

  let min: number | undefined
  let max: number | undefined
  Object.keys(data).forEach((key) => {
    const dataValue = data[key]

    if (typeof dataValue === 'number') {
      if (min === undefined || dataValue < min) {
        min = dataValue
      }

      if (max === undefined || dataValue > max) {
        max = dataValue
      }
    } else if (isObject(dataValue)) {
      const value = dataValue?.value || 0

      if (min === undefined || value < min) {
        min = value
      }

      if (max === undefined || value > max) {
        max = value
      }
    }
  })

  Object.keys(data).forEach((id) => {
    const dataValue = data[id]

    let value, color, opacity
    if (typeof dataValue === 'number') {
      value = dataValue
    } else if (isObject(dataValue)) {
      value = dataValue?.value
      color = dataValue?.color
    }

    if (value === undefined || max === undefined || min === undefined) {
      opacity = 1
    } else {
      opacity = (value - min) / (max - min)
      opacity = opacity == 0 ? 0.05 : opacity
    }

    css += ` #${options.containerId} #${id} { fill: ${
      color || options.baseColor
    }; fill-opacity: ${opacity}; cursor: ${
      options.displayLegend ? 'pointer' : 'default'
    }; } `
    css += ` #${options.containerId} #${id}:hover { fill-opacity: ${
      opacity + 0.05
    }; } `
  })

  return css
}
