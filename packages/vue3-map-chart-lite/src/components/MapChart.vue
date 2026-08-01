<script setup lang="ts">
  import type { MapData, MapDataValue } from '@/types'
  import {
    useElementBounding,
    useEventListener,
    useMouse,
    useMouseInElement,
    useStyleTag,
  } from '@vueuse/core'
  import countries from 'i18n-iso-countries'
  import iso3166 from 'iso-3166-2'
  import type { CSSProperties } from 'vue'

  import locales from '../i18n-iso-countries-locales'
  import {
    formatNumberWithSIPrefix,
    getNextInstanceId,
    isObject,
    isSVG,
    isValidIsoCode,
    sanitizeSVG,
  } from '../utils'
  import Tooltip from './Tooltip.vue'

  // handle props

  interface Props {
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
    loaderColor?: string
    customMapSvg?: string
    sanitizeCustomMapSvg?: boolean
    customMapLabels?: Record<string, string>
    data: MapData
  }

  const props = withDefaults(defineProps<Props>(), {
    langCode: 'en',
    height: 500,
    width: '100%',
    mapStyles: () => ({}),
    displayLegend: true,
    displayLegendWhenEmpty: true,
    areaNameOnMap: 'none',
    areaNameOnMapSize: 12,
    areaNameOnMapColor: '#ffffff',
    areaNameOnMapBgColor: 'rgba(0, 0, 0, 0.6)',
    formatValueWithSiPrefix: false,
    forceCursorPointer: false,
    legendBgColor: undefined,
    legendTextColor: undefined,
    legendDividerColor: undefined,
    legendValuePrefix: '',
    legendValueSuffix: '',
    defaultFillColor: 'rgb(236, 236, 236)',
    defaultFillHoverColor: 'rgb(226, 226, 226)',
    defaultStrokeHoverColor: 'rgb(200, 200, 200)',
    defaultStrokeColor: 'rgb(200, 200, 200)',
    baseColor: '#0782c5',
    loaderColor: '#3498db',
    customMapSvg: '',
    sanitizeCustomMapSvg: true,
    customMapLabels: () => ({}),
  })

  const registerLocale = async (langCode: string) => {
    try {
      if (locales[langCode]) countries.registerLocale(locales[langCode])
    } catch (error) {
      console.error('Error loading locale:', error)
    }
  }

  watch(() => props.langCode, registerLocale, { immediate: true })

  const mapHeight = computed(() =>
    typeof props.height === 'string' ? props.height : `${props.height}px`
  )

  const mapWidth = computed(() =>
    typeof props.width === 'string' ? props.width : `${props.width}px`
  )

  const loaderColor = computed(() => props.loaderColor)

  const defaultFillColor = computed(() => props.defaultFillColor)

  const defaultFillHoverColor = computed(() =>
    props.displayLegend && props.displayLegendWhenEmpty
      ? props.defaultFillHoverColor
      : props.defaultFillColor
  )

  const defaultStrokeColor = computed(() => props.defaultStrokeColor)

  const defaultCursor = computed(() => {
    if (props.forceCursorPointer) return 'pointer'

    return props.displayLegend && props.displayLegendWhenEmpty
      ? 'pointer'
      : 'default'
  })

  const cpntId = getNextInstanceId()

  // props.data keyed exactly as the SVG element ids expect it: uppercase ISO
  // codes for built-in maps (so `data: { fr: 1 }` behaves like `{ FR: 1 }`),
  // untouched for a customMapSvg where ids are whatever the author chose.
  const normalizedData = computed<MapData>(() => {
    if (props.customMapSvg && isSVG(props.customMapSvg)) return props.data

    const result: MapData = {}
    Object.keys(props.data).forEach((key) => {
      result[key.toUpperCase()] = props.data[key]
    })
    return result
  })

  // handle events

  const isOutsideMap = ref(true)
  const currentAreaId = ref<string | null>(null)
  const currentAreaValue = ref<number | MapDataValue | null | undefined>(null)

  const emits = defineEmits([
    'mapItemTouchstart',
    'mapItemMouseover',
    'mapItemMouseout',
    'mapItemClick',
  ])

  onMounted(() => {
    const el = document.getElementById(`v3mc-map-${cpntId}`)
    if (el) {
      const emitEvent = (
        target: HTMLElement,
        emitId:
          | 'mapItemMouseover'
          | 'mapItemMouseout'
          | 'mapItemClick'
          | 'mapItemTouchstart'
      ) => {
        const id = target.getAttribute('id')
        currentAreaId.value = id
        currentAreaValue.value = id ? normalizedData.value[id] : null
        if (
          (id &&
            isValidIsoCode(id) &&
            !!(
              countries.getName(id, props.langCode) ||
              iso3166.subdivision(id)?.name
            )) ||
          (props.customMapSvg && isSVG(props.customMapSvg))
        ) {
          emits(emitId, id, currentAreaValue.value)
          if (emitId == 'mapItemTouchstart') {
            isOutsideMap.value = false
          }
        } else {
          if (emitId == 'mapItemTouchstart') {
            isOutsideMap.value = true
          }
        }
      }
      useEventListener(el, 'touchstart', (event) => {
        emitEvent(event.target as HTMLElement, 'mapItemTouchstart')
      })
      useEventListener(el, 'mouseover', (event) => {
        emitEvent(event.target as HTMLElement, 'mapItemMouseover')
      })
      useEventListener(el, 'mouseout', (event) => {
        emitEvent(event.target as HTMLElement, 'mapItemMouseout')
      })
      useEventListener(el, 'click', (event) => {
        emitEvent(event.target as HTMLElement, 'mapItemClick')
      })
      const { isOutside } = useMouseInElement(el)
      watch(
        () => isOutside.value,
        (value) => {
          isOutsideMap.value = value
        }
      )
    }
  })

  // load svg map
  const slots = useSlots()
  const svgMap = ref<string | null>(null)
  const isLoading = ref(false)

  // Cache key includes the package version so upgrading never serves a map
  // fetched/cached by a previous release.
  const mapCacheKey = (name: string) => `${name}@${__V3MC_VERSION__}`

  const loadSvgMap = async (): Promise<void> => {
    if (props.customMapSvg && isSVG(props.customMapSvg)) {
      svgMap.value = props.sanitizeCustomMapSvg
        ? sanitizeSVG(props.customMapSvg)
        : props.customMapSvg
      return
    }

    try {
      if (slots.default) {
        const slotContent = slots.default()

        const type = slotContent[0]?.type as { name: string; template: string }

        if (typeof type == 'object') {
          const fetchData = async () => {
            // Pinned to this exact release (immutable) instead of a mutable
            // branch, and served through a real CDN rather than raw.githubusercontent.com.
            const svgUrl = `https://cdn.jsdelivr.net/gh/noeGnh/vue3-map-chart@v${__V3MC_VERSION__}/packages/vue3-map-chart/src/assets/maps/${type.template}`

            isLoading.value = true

            const response = await fetch(svgUrl)
            if (!response.ok) {
              throw new Error(`Failed to fetch map "${type.name}": ${response.status}`)
            }

            const rawSvg = await response.text()
            if (!isSVG(rawSvg)) {
              throw new Error(`Fetched content for map "${type.name}" is not a valid SVG`)
            }

            svgMap.value = sanitizeSVG(rawSvg)

            const cacheData = {
              svg: svgMap.value,
              timestamp: Date.now(),
            }
            localStorage.setItem(mapCacheKey(type.name), JSON.stringify(cacheData))
          }

          const cachedData = localStorage.getItem(mapCacheKey(type.name))
          if (cachedData) {
            const { svg, timestamp } = JSON.parse(cachedData)

            const isCacheValid =
              Date.now() - timestamp < 28 * 24 * 60 * 60 * 1000

            if (isCacheValid) {
              svgMap.value = svg
            } else await fetchData()
          } else await fetchData()
        }
      } else {
        svgMap.value = ''
        console.warn('No map found')
      }
    } catch (error) {
      svgMap.value = ''
      console.error('Error loading map:', error)
    } finally {
      isLoading.value = false
    }
  }

  watch(
    () => slots.default,
    () => {
      loadSvgMap()
    },
    { immediate: true, deep: true }
  )

  // build map styles

  const { css } = useStyleTag('', {
    id: `v3mc-map-${cpntId}-styles`,
  })

  const buildStyles = () => {
    css.value = ''

    if (isObject(normalizedData.value)) {
      let min: number | undefined
      let max: number | undefined
      Object.keys(normalizedData.value).forEach((key) => {
        const dataValue = normalizedData.value[key]

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

      Object.keys(normalizedData.value).forEach((id) => {
        const dataValue = normalizedData.value[id]

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
        css.value += ` #v3mc-map-${cpntId} #${id} { fill: ${
          color || props.baseColor
        }; fill-opacity: ${opacity}; cursor: ${
          props.displayLegend ? 'pointer' : 'default'
        }; } `
        css.value += ` #v3mc-map-${cpntId} #${id}:hover { fill-opacity: ${
          opacity + 0.05
        }; } `
      })
    }
  }

  watch(
    () => props.data,
    () => {
      buildStyles()
    },
    { deep: true, immediate: true }
  )

  // tooltip

  const tooltipLabel = computed(() => {
    const customLegendLabel =
      typeof currentAreaValue.value === 'number'
        ? undefined
        : currentAreaValue.value?.legendLabel

    const customMapLabel =
      props.customMapLabels &&
      currentAreaId.value &&
      props.customMapLabels[currentAreaId.value]
        ? props.customMapLabels[currentAreaId.value]
        : undefined

    const areaName = currentAreaId.value
      ? countries.getName(currentAreaId.value, props.langCode) ||
        iso3166.subdivision(currentAreaId.value)?.name ||
        currentAreaId.value
      : currentAreaId.value

    return customLegendLabel || customMapLabel || areaName || ''
  })

  const tooltipValue = computed(() => {
    let value: number | string =
      (typeof currentAreaValue.value === 'number'
        ? currentAreaValue.value
        : currentAreaValue.value?.value) || ''

    if (typeof value !== 'number') return value

    value = props.formatValueWithSiPrefix
      ? formatNumberWithSIPrefix(value)
      : value

    value = props.legendValuePrefix + value + props.legendValueSuffix

    return value
  })

  const displayTooltip = computed(() => {
    return (
      !isOutsideMap.value &&
      props.displayLegend &&
      (props.displayLegendWhenEmpty || tooltipValue.value) &&
      tooltipLabel.value
    )
  })

  const tooltip = ref()
  const { x: mouseX, y: mouseY } = useMouse()
  const { width: tooltipWidth, height: tooltipHeight } = useElementBounding(
    tooltip as any
  )

  const tooltipLeft = computed(() => {
    const viewportMouseX = mouseX.value - window.scrollX

    let left = viewportMouseX + 12

    if (left + tooltipWidth.value > window.innerWidth) {
      left = viewportMouseX - tooltipWidth.value - 12
    }

    return `${left}px`
  })

  const tooltipTop = computed(() => {
    const viewportMouseY = mouseY.value - window.scrollY

    let top = viewportMouseY + 12

    if (top + tooltipHeight.value > window.innerHeight) {
      top = viewportMouseY - tooltipHeight.value - 12
    }

    return `${top}px`
  })

  // Dynamically Display area name on map

  const getAreaName = (id: string) => {
    const customLegendLabel =
      normalizedData.value[id] && typeof normalizedData.value[id] === 'number'
        ? undefined
        : (normalizedData.value[id] as MapDataValue)?.legendLabel

    const customMapLabel =
      props.customMapLabels && props.customMapLabels[id]
        ? props.customMapLabels[id]
        : undefined

    const areaName =
      countries.getName(id, props.langCode) ||
      iso3166.subdivision(id)?.name ||
      id

    return customLegendLabel || customMapLabel || areaName || id
  }

  // Labels are rebuilt (not just created once) so they stay in sync when `data`
  // arrives/changes after mount, when `areaNameOnMap` is toggled, or when the
  // map SVG itself loads asynchronously (the built-in maps are fetched after mount).
  const renderAreaLabels = () => {
    const mapContainer = document.getElementById(`v3mc-map-${cpntId}`)
    if (!mapContainer) return

    // Clear any labels from a previous run before regenerating them.
    mapContainer
      .querySelectorAll('.labels-group')
      .forEach((group) => group.remove())

    if (props.areaNameOnMap == 'none') return

    const svgNS = 'http://www.w3.org/2000/svg'
    const areas: {
      element: SVGGraphicsElement
      id: string
      name: string
    }[] = Array.from(mapContainer.querySelectorAll<SVGGraphicsElement>('[id]'))
      .filter(
        (el) =>
          (((isValidIsoCode(el.id) &&
            !!(
              countries.getName(el.id, props.langCode) ||
              iso3166.subdivision(el.id)?.name
            )) ||
            (props.customMapSvg && isSVG(props.customMapSvg))) &&
            props.areaNameOnMap == 'all') ||
          Object.keys(normalizedData.value).includes(el.id)
      )
      .map((el) => ({
        element: el,
        id: el.id,
        name:
          countries.getName(el.id, props.langCode) ||
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
        textElem.setAttribute('font-size', `${props.areaNameOnMapSize}`)
        textElem.setAttribute('fill', `${props.areaNameOnMapColor}`)
        textElem.setAttribute('pointer-events', 'none')
        textElem.textContent = getAreaName(area.element.id)

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
          rectBg.setAttribute('fill', `${props.areaNameOnMapBgColor}`)
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

  // An immediate watcher's first call runs synchronously during setup, before
  // the component has actually mounted (flush: 'post' only changes the timing
  // of *subsequent* runs) — so the first render has to go through onMounted
  // instead, where the container is guaranteed to exist.
  onMounted(renderAreaLabels)

  watch([() => props.areaNameOnMap, () => props.data, svgMap], renderAreaLabels, {
    deep: true,
    flush: 'post',
  })
</script>

<template>
  <div class="v3mc-container">
    <div v-show="isLoading" class="v3mc-tiny-loader-wrapper">
      <slot name="loader">
        <div class="v3mc-tiny-loader"></div>
      </slot>
    </div>
    <div
      v-show="!isLoading"
      :id="`v3mc-map-${cpntId}`"
      class="v3mc-map"
      :style="mapStyles"
      v-html="svgMap"></div>
    <Tooltip
      v-if="displayTooltip"
      :id="`v3mc-tooltip-${cpntId}`"
      ref="tooltip"
      class="v3mc-tooltip"
      :label="tooltipLabel"
      :value="tooltipValue"
      :bg-color="props.legendBgColor"
      :text-color="props.legendTextColor"
      :divider-color="props.legendDividerColor" />
  </div>
</template>

<style scoped>
  .v3mc-container {
    padding: 5px;
    position: relative;
  }

  .v3mc-container,
  :deep(.v3mc-map > svg) {
    height: v-bind(mapHeight);
    width: v-bind(mapWidth);
  }

  :deep(.v3mc-map > svg) {
    stroke: v-bind(defaultStrokeColor);
    fill: v-bind(defaultFillColor);
    stroke-width: 0.4px;
  }

  :deep(.v3mc-map > svg > path) {
    cursor: v-bind(defaultCursor);
  }

  :deep(.v3mc-map > svg > path:hover) {
    fill: v-bind(defaultFillHoverColor);
    stroke: v-bind(defaultStrokeHoverColor);
    stroke-width: 0.5px;
  }

  .v3mc-tooltip {
    position: fixed;
    z-index: 9999;
    top: v-bind(tooltipTop);
    left: v-bind(tooltipLeft);
  }

  .v3mc-tiny-loader-wrapper {
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
  }

  .v3mc-tiny-loader {
    width: 20px;
    height: 20px;
    margin: 0 auto;
    border: 2px solid #f3f3f3;
    border-top: 2px solid v-bind(loaderColor);
    border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
</style>
