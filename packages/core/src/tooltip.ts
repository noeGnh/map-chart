import countries from 'i18n-iso-countries'
import iso3166 from 'iso-3166-2'

import type { MapDataValue } from './types'
import { formatNumberWithSIPrefix } from './utils'

export function computeTooltipLabel(options: {
  areaId: string | null
  areaValue: number | MapDataValue | null | undefined
  langCode: string
  customMapLabels?: Record<string, string>
}): string {
  const { areaId, areaValue, langCode, customMapLabels } = options

  const customLegendLabel =
    typeof areaValue === 'number' ? undefined : areaValue?.legendLabel

  const customMapLabel =
    customMapLabels && areaId && customMapLabels[areaId]
      ? customMapLabels[areaId]
      : undefined

  const areaName = areaId
    ? countries.getName(areaId, langCode) || iso3166.subdivision(areaId)?.name || areaId
    : areaId

  return customLegendLabel || customMapLabel || areaName || ''
}

export function computeTooltipValue(options: {
  areaValue: number | MapDataValue | null | undefined
  formatValueWithSiPrefix: boolean
  legendValuePrefix: string
  legendValueSuffix: string
}): string {
  const { areaValue, formatValueWithSiPrefix, legendValuePrefix, legendValueSuffix } =
    options

  let value: number | string =
    (typeof areaValue === 'number' ? areaValue : areaValue?.value) || ''

  if (typeof value !== 'number') return value

  value = formatValueWithSiPrefix ? formatNumberWithSIPrefix(value) : value

  value = legendValuePrefix + value + legendValueSuffix

  return value
}

export function computeTooltipPosition(options: {
  mouseX: number
  mouseY: number
  scrollX: number
  scrollY: number
  tooltipWidth: number
  tooltipHeight: number
  viewportWidth: number
  viewportHeight: number
}): { left: string; top: string } {
  const viewportMouseX = options.mouseX - options.scrollX
  let left = viewportMouseX + 12
  if (left + options.tooltipWidth > options.viewportWidth) {
    left = viewportMouseX - options.tooltipWidth - 12
  }

  const viewportMouseY = options.mouseY - options.scrollY
  let top = viewportMouseY + 12
  if (top + options.tooltipHeight > options.viewportHeight) {
    top = viewportMouseY - options.tooltipHeight - 12
  }

  return { left: `${left}px`, top: `${top}px` }
}
