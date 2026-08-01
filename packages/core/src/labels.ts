import countries from 'i18n-iso-countries'
import iso3166 from 'iso-3166-2'

import type { MapData, MapDataValue } from './types'
import { isValidIsoCode } from './utils'

export function getAreaName(
  id: string,
  options: {
    data: MapData
    langCode: string
    customMapLabels?: Record<string, string>
  }
): string {
  const dataValue = options.data[id]

  const customLegendLabel =
    dataValue && typeof dataValue === 'number'
      ? undefined
      : (dataValue as MapDataValue)?.legendLabel

  const customMapLabel =
    options.customMapLabels && options.customMapLabels[id]
      ? options.customMapLabels[id]
      : undefined

  const areaName =
    countries.getName(id, options.langCode) || iso3166.subdivision(id)?.name || id

  return customLegendLabel || customMapLabel || areaName || id
}

export interface RenderAreaLabelsOptions {
  areaNameOnMap: 'none' | 'all' | 'data-only'
  data: MapData
  langCode: string
  isCustomSvg: boolean
  customMapLabels?: Record<string, string>
  areaNameOnMapSize: number
  areaNameOnMapColor: string
  areaNameOnMapBgColor: string
}

/**
 * Rebuilds (not just creates once) the area name labels inside `container`.
 * Safe to call repeatedly — clears any labels from a previous run first, so
 * it can be driven by a reactive watcher/effect on data/props/map-load.
 */
export function renderAreaLabels(
  container: Element,
  options: RenderAreaLabelsOptions
): void {
  // Clear any labels from a previous run before regenerating them.
  container.querySelectorAll('.labels-group').forEach((group) => group.remove())

  if (options.areaNameOnMap == 'none') return

  const svgNS = 'http://www.w3.org/2000/svg'
  const areas: {
    element: SVGGraphicsElement
    id: string
    name: string
  }[] = Array.from(container.querySelectorAll<SVGGraphicsElement>('[id]'))
    .filter(
      (el) =>
        (((isValidIsoCode(el.id) &&
          !!(
            countries.getName(el.id, options.langCode) ||
            iso3166.subdivision(el.id)?.name
          )) ||
          options.isCustomSvg) &&
          options.areaNameOnMap == 'all') ||
        Object.keys(options.data).includes(el.id)
    )
    .map((el) => ({
      element: el,
      id: el.id,
      name:
        countries.getName(el.id, options.langCode) ||
        iso3166.subdivision(el.id)?.name ||
        '',
    }))

  // Create a group for all labels at the end of each SVG
  const svgContainers = new Set<SVGSVGElement>()
  areas.forEach((area) => {
    const svg = area.element.ownerSVGElement
    if (svg) svgContainers.add(svg)
  })

  // Create a label group per SVG
  const labelGroups = new Map<SVGSVGElement, SVGGElement>()
  svgContainers.forEach((svg) => {
    const group = document.createElementNS(svgNS, 'g')
    group.setAttribute('class', 'labels-group')
    svg.appendChild(group)
    labelGroups.set(svg, group)
  })

  areas.forEach((area) => {
    if (!('getBBox' in area.element)) return

    try {
      // Get the bounding box of the element
      const bbox = area.element.getBBox()

      // Calculate the center
      const centerX = bbox.x + bbox.width / 2
      const centerY = bbox.y + bbox.height / 2

      // Create an SVG text element
      const textElem = document.createElementNS(svgNS, 'text')
      textElem.setAttribute('x', centerX.toString())
      textElem.setAttribute('y', centerY.toString())
      textElem.setAttribute('text-anchor', 'middle')
      textElem.setAttribute('dominant-baseline', 'middle')
      textElem.setAttribute('font-size', `${options.areaNameOnMapSize}`)
      textElem.setAttribute('fill', `${options.areaNameOnMapColor}`)
      textElem.setAttribute('pointer-events', 'none')
      textElem.textContent = getAreaName(area.element.id, options)

      // Get the label group
      const svg = area.element.ownerSVGElement
      const group = svg ? labelGroups.get(svg) : null

      if (group) {
        // Add text to DOM first so getBBox() works
        group.appendChild(textElem)

        // Now get the text bounding box and create background
        const textBBox = textElem.getBBox()
        const rectBg = document.createElementNS(svgNS, 'rect')
        rectBg.setAttribute('x', (textBBox.x - 4).toString())
        rectBg.setAttribute('y', (textBBox.y - 2).toString())
        rectBg.setAttribute('width', (textBBox.width + 7).toString())
        rectBg.setAttribute('height', (textBBox.height + 3).toString())
        rectBg.setAttribute('fill', `${options.areaNameOnMapBgColor}`)
        rectBg.setAttribute('stroke-width', '0')
        rectBg.setAttribute('rx', '3')
        rectBg.setAttribute('pointer-events', 'none')

        // Insert background before text (so text is on top)
        group.insertBefore(rectBg, textElem)
      }
    } catch (_) {
      //
    }
  })
}
