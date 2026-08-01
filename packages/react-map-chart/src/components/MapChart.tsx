import {
  buildMapStyleCss,
  computeTooltipLabel,
  computeTooltipPosition,
  computeTooltipValue,
  getNextInstanceId,
  isSVG,
  type MapData,
  type MapDataValue,
  normalizeMapData,
  registerLocale,
  renderAreaLabels,
  resolveAreaEvent,
  resolveCustomMapSvg,
} from '@map-chart/core'
import {
  Children,
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'

import { useElementSize } from '../hooks/useElementSize'
import { useMousePosition } from '../hooks/useMousePosition'
import { useStyleTag } from '../hooks/useStyleTag'
import { buildShellCss } from '../shellCss'
import '../styles.css'
import { Tooltip } from './Tooltip'

type AreaCallback = (
  id: string | null,
  value: number | MapDataValue | null | undefined
) => void

export interface MapChartProps {
  langCode?: string
  width?: number | string
  height?: number | string
  mapStyles?: CSSProperties
  displayLegend?: boolean
  displayLegendWhenEmpty?: boolean
  areaNameOnMap?: 'none' | 'all' | 'data-only'
  areaNameOnMapSize?: number
  areaNameOnMapColor?: string
  areaNameOnMapBgColor?: string
  formatValueWithSiPrefix?: boolean
  forceCursorPointer?: boolean
  legendBgColor?: string
  legendTextColor?: string
  legendDividerColor?: string
  legendValuePrefix?: string
  legendValueSuffix?: string
  defaultStrokeColor?: string
  defaultStrokeHoverColor?: string
  defaultFillColor?: string
  defaultFillHoverColor?: string
  baseColor?: string
  customMapSvg?: string
  sanitizeCustomMapSvg?: boolean
  customMapLabels?: Record<string, string>
  data: MapData
  children?: ReactNode
  onMapItemTouchstart?: AreaCallback
  onMapItemMouseover?: AreaCallback
  onMapItemMouseout?: AreaCallback
  onMapItemClick?: AreaCallback
}

export function MapChart({
  langCode = 'en',
  width = '100%',
  height = 500,
  mapStyles = {},
  displayLegend = true,
  displayLegendWhenEmpty = true,
  areaNameOnMap = 'none',
  areaNameOnMapSize = 12,
  areaNameOnMapColor = '#ffffff',
  areaNameOnMapBgColor = 'rgba(0, 0, 0, 0.6)',
  formatValueWithSiPrefix = false,
  forceCursorPointer = false,
  legendBgColor,
  legendTextColor,
  legendDividerColor,
  legendValuePrefix = '',
  legendValueSuffix = '',
  defaultStrokeColor = 'rgb(200, 200, 200)',
  defaultStrokeHoverColor = 'rgb(200, 200, 200)',
  defaultFillColor = 'rgb(236, 236, 236)',
  defaultFillHoverColor = 'rgb(226, 226, 226)',
  baseColor = '#0782c5',
  customMapSvg = '',
  sanitizeCustomMapSvg = true,
  customMapLabels = {},
  data,
  children,
  onMapItemTouchstart,
  onMapItemMouseover,
  onMapItemMouseout,
  onMapItemClick,
}: MapChartProps) {
  const [cpntId] = useState(() => getNextInstanceId())
  const containerId = `v3mc-map-${cpntId}`

  const containerRef = useRef<HTMLDivElement>(null)

  const mapHeight = typeof height === 'string' ? height : `${height}px`
  const mapWidth = typeof width === 'string' ? width : `${width}px`

  const defaultFillHoverColorResolved =
    displayLegend && displayLegendWhenEmpty ? defaultFillHoverColor : defaultFillColor

  const defaultCursor = forceCursorPointer
    ? 'pointer'
    : displayLegend && displayLegendWhenEmpty
      ? 'pointer'
      : 'default'

  const isCustomSvg = useMemo(
    () => !!(customMapSvg && isSVG(customMapSvg)),
    [customMapSvg]
  )

  const normalizedData = useMemo(
    () => normalizeMapData(data, isCustomSvg),
    [data, isCustomSvg]
  )

  // locale
  useEffect(() => {
    registerLocale(langCode)
  }, [langCode])

  // load svg map
  const [svgMap, setSvgMap] = useState('')

  useEffect(() => {
    let cancelled = false

    const load = () => {
      if (customMapSvg) {
        const resolved = resolveCustomMapSvg(customMapSvg, sanitizeCustomMapSvg)
        if (resolved !== null) {
          if (!cancelled) setSvgMap(resolved)
          return
        }
      }

      const child = Children.toArray(children)[0] as ReactElement | undefined
      if (child) {
        if (!cancelled) setSvgMap((child.type as unknown as string) ?? '')
      } else {
        console.warn('No map found')
        if (!cancelled) setSvgMap('')
      }
    }

    load()

    return () => {
      cancelled = true
    }
  }, [customMapSvg, sanitizeCustomMapSvg, children])

  // build map styles — the per-area data-driven fills from @map-chart/core,
  // plus the "shell" (sizing/stroke/fill/hover/cursor) that would be a
  // scoped v-bind() style in Vue but has to be plain CSS text here since it
  // targets the SVG injected via dangerouslySetInnerHTML.
  const setCss = useStyleTag(`${containerId}-styles`)

  useEffect(() => {
    const shellCss = buildShellCss({
      containerId,
      width: mapWidth,
      height: mapHeight,
      defaultStrokeColor,
      defaultFillColor,
      defaultCursor,
      defaultFillHoverColor: defaultFillHoverColorResolved,
      defaultStrokeHoverColor,
    })
    const areaCss = buildMapStyleCss(normalizedData, {
      containerId,
      baseColor,
      displayLegend,
    })
    setCss(shellCss + areaCss)
  }, [
    setCss,
    containerId,
    mapWidth,
    mapHeight,
    defaultStrokeColor,
    defaultFillColor,
    defaultCursor,
    defaultFillHoverColorResolved,
    defaultStrokeHoverColor,
    normalizedData,
    baseColor,
    displayLegend,
  ])

  // handle events
  const [isOutsideMap, setIsOutsideMap] = useState(true)
  const [currentAreaId, setCurrentAreaId] = useState<string | null>(null)
  const [currentAreaValue, setCurrentAreaValue] = useState<
    number | MapDataValue | null | undefined
  >(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return

    const emitEvent = (
      target: HTMLElement,
      emitId: 'mapItemMouseover' | 'mapItemMouseout' | 'mapItemClick' | 'mapItemTouchstart'
    ) => {
      const resolved = resolveAreaEvent(target, {
        data: normalizedData,
        langCode,
        isCustomSvg,
      })
      setCurrentAreaId(resolved.id)
      setCurrentAreaValue(resolved.value)

      if (resolved.isValidArea) {
        const callback = {
          mapItemMouseover: onMapItemMouseover,
          mapItemMouseout: onMapItemMouseout,
          mapItemClick: onMapItemClick,
          mapItemTouchstart: onMapItemTouchstart,
        }[emitId]
        callback?.(resolved.id, resolved.value)
        if (emitId === 'mapItemTouchstart') setIsOutsideMap(false)
      } else {
        if (emitId === 'mapItemTouchstart') setIsOutsideMap(true)
      }
    }

    const onTouchstart = (event: Event) =>
      emitEvent(event.target as HTMLElement, 'mapItemTouchstart')
    const onMouseover = (event: Event) =>
      emitEvent(event.target as HTMLElement, 'mapItemMouseover')
    const onMouseout = (event: Event) =>
      emitEvent(event.target as HTMLElement, 'mapItemMouseout')
    const onClick = (event: Event) => emitEvent(event.target as HTMLElement, 'mapItemClick')
    const onMouseEnter = () => setIsOutsideMap(false)
    const onMouseLeave = () => setIsOutsideMap(true)

    el.addEventListener('touchstart', onTouchstart)
    el.addEventListener('mouseover', onMouseover)
    el.addEventListener('mouseout', onMouseout)
    el.addEventListener('click', onClick)
    el.addEventListener('mouseenter', onMouseEnter)
    el.addEventListener('mouseleave', onMouseLeave)

    return () => {
      el.removeEventListener('touchstart', onTouchstart)
      el.removeEventListener('mouseover', onMouseover)
      el.removeEventListener('mouseout', onMouseout)
      el.removeEventListener('click', onClick)
      el.removeEventListener('mouseenter', onMouseEnter)
      el.removeEventListener('mouseleave', onMouseLeave)
    }
  }, [
    normalizedData,
    langCode,
    isCustomSvg,
    onMapItemMouseover,
    onMapItemMouseout,
    onMapItemClick,
    onMapItemTouchstart,
  ])

  // tooltip
  const tooltipLabel = useMemo(
    () =>
      computeTooltipLabel({
        areaId: currentAreaId,
        areaValue: currentAreaValue,
        langCode,
        customMapLabels,
      }),
    [currentAreaId, currentAreaValue, langCode, customMapLabels]
  )

  const tooltipValue = useMemo(
    () =>
      computeTooltipValue({
        areaValue: currentAreaValue,
        formatValueWithSiPrefix,
        legendValuePrefix,
        legendValueSuffix,
      }),
    [currentAreaValue, formatValueWithSiPrefix, legendValuePrefix, legendValueSuffix]
  )

  const displayTooltip = Boolean(
    !isOutsideMap && displayLegend && (displayLegendWhenEmpty || tooltipValue) && tooltipLabel
  )

  const mousePosition = useMousePosition()
  const { ref: tooltipRef, size: tooltipSize } = useElementSize()

  const tooltipPosition = useMemo(
    () =>
      computeTooltipPosition({
        mouseX: mousePosition.x,
        mouseY: mousePosition.y,
        scrollX: window.scrollX,
        scrollY: window.scrollY,
        tooltipWidth: tooltipSize.width,
        tooltipHeight: tooltipSize.height,
        viewportWidth: window.innerWidth,
        viewportHeight: window.innerHeight,
      }),
    [mousePosition, tooltipSize]
  )

  // area name labels — re-rendered (not just created once) whenever data,
  // areaNameOnMap, or the map SVG itself (loaded async in the lite package)
  // change; useEffect always runs after the DOM is committed, so unlike
  // Vue's watcher there's no need for a separate "first render" workaround.
  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    renderAreaLabels(container, {
      areaNameOnMap,
      data: normalizedData,
      langCode,
      isCustomSvg,
      customMapLabels,
      areaNameOnMapSize,
      areaNameOnMapColor,
      areaNameOnMapBgColor,
    })
  }, [
    areaNameOnMap,
    normalizedData,
    langCode,
    isCustomSvg,
    customMapLabels,
    areaNameOnMapSize,
    areaNameOnMapColor,
    areaNameOnMapBgColor,
    svgMap,
  ])

  return (
    <div className="v3mc-container" style={{ height: mapHeight, width: mapWidth }}>
      <div
        id={containerId}
        ref={containerRef}
        className="v3mc-map"
        style={mapStyles}
        dangerouslySetInnerHTML={{ __html: svgMap }}
      />
      {displayTooltip && (
        <Tooltip
          id={`v3mc-tooltip-${cpntId}`}
          innerRef={tooltipRef}
          className="v3mc-tooltip"
          style={{ top: tooltipPosition.top, left: tooltipPosition.left }}
          label={tooltipLabel}
          value={tooltipValue}
          bgColor={legendBgColor}
          textColor={legendTextColor}
          dividerColor={legendDividerColor}
        />
      )}
    </div>
  )
}
