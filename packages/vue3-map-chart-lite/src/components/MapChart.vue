<script setup lang="ts">
  import type { MapData, MapDataValue } from '@/types'
  import {
    buildMapStyleCss,
    computeTooltipLabel,
    computeTooltipPosition,
    computeTooltipValue,
    fetchAndCacheMapSvg,
    getCachedMapSvg,
    getNextInstanceId,
    isSVG,
    type MapDescriptor,
    normalizeMapData,
    registerLocale,
    renderAreaLabels,
    resolveAreaEvent,
    resolveCustomMapSvg,
  } from '@map-chart/core'
  import {
    useElementBounding,
    useEventListener,
    useMouse,
    useMouseInElement,
    useStyleTag,
  } from '@vueuse/core'
  import type { CSSProperties } from 'vue'

  import { V3MC_VERSION } from '../version'
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
  const containerId = `v3mc-map-${cpntId}`

  const isCustomSvg = computed(() => !!(props.customMapSvg && isSVG(props.customMapSvg)))

  const normalizedData = computed<MapData>(() =>
    normalizeMapData(props.data, isCustomSvg.value)
  )

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
    const el = document.getElementById(containerId)
    if (el) {
      const emitEvent = (
        target: HTMLElement,
        emitId:
          | 'mapItemMouseover'
          | 'mapItemMouseout'
          | 'mapItemClick'
          | 'mapItemTouchstart'
      ) => {
        const resolved = resolveAreaEvent(target, {
          data: normalizedData.value,
          langCode: props.langCode,
          isCustomSvg: isCustomSvg.value,
        })
        currentAreaId.value = resolved.id
        currentAreaValue.value = resolved.value

        if (resolved.isValidArea) {
          emits(emitId, resolved.id, resolved.value)
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

  const loadSvgMap = async (): Promise<void> => {
    if (props.customMapSvg) {
      const resolved = resolveCustomMapSvg(props.customMapSvg, props.sanitizeCustomMapSvg)
      if (resolved !== null) {
        svgMap.value = resolved
        return
      }
    }

    try {
      if (slots.default) {
        const slotContent = slots.default()

        const type = slotContent[0]?.type as MapDescriptor

        if (typeof type == 'object') {
          const cached = getCachedMapSvg(type.name, V3MC_VERSION)
          if (cached !== null) {
            svgMap.value = cached
          } else {
            isLoading.value = true
            svgMap.value = await fetchAndCacheMapSvg(type, V3MC_VERSION)
          }
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
    id: `${containerId}-styles`,
  })

  const buildStyles = () => {
    css.value = buildMapStyleCss(normalizedData.value, {
      containerId,
      baseColor: props.baseColor,
      displayLegend: props.displayLegend,
    })
  }

  watch(
    () => props.data,
    () => {
      buildStyles()
    },
    { deep: true, immediate: true }
  )

  // tooltip

  const tooltipLabel = computed(() =>
    computeTooltipLabel({
      areaId: currentAreaId.value,
      areaValue: currentAreaValue.value,
      langCode: props.langCode,
      customMapLabels: props.customMapLabels,
    })
  )

  const tooltipValue = computed(() =>
    computeTooltipValue({
      areaValue: currentAreaValue.value,
      formatValueWithSiPrefix: props.formatValueWithSiPrefix,
      legendValuePrefix: props.legendValuePrefix,
      legendValueSuffix: props.legendValueSuffix,
    })
  )

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

  const tooltipPosition = computed(() =>
    computeTooltipPosition({
      mouseX: mouseX.value,
      mouseY: mouseY.value,
      scrollX: window.scrollX,
      scrollY: window.scrollY,
      tooltipWidth: tooltipWidth.value,
      tooltipHeight: tooltipHeight.value,
      viewportWidth: window.innerWidth,
      viewportHeight: window.innerHeight,
    })
  )

  const tooltipLeft = computed(() => tooltipPosition.value.left)
  const tooltipTop = computed(() => tooltipPosition.value.top)

  // Dynamically Display area name on map

  // Labels are rebuilt (not just created once) so they stay in sync when `data`
  // arrives/changes after mount, when `areaNameOnMap` is toggled, or when the
  // map SVG itself loads asynchronously (the built-in maps are fetched after mount).
  const renderLabels = () => {
    const mapContainer = document.getElementById(containerId)
    if (!mapContainer) return

    renderAreaLabels(mapContainer, {
      areaNameOnMap: props.areaNameOnMap,
      data: normalizedData.value,
      langCode: props.langCode,
      isCustomSvg: isCustomSvg.value,
      customMapLabels: props.customMapLabels,
      areaNameOnMapSize: props.areaNameOnMapSize,
      areaNameOnMapColor: props.areaNameOnMapColor,
      areaNameOnMapBgColor: props.areaNameOnMapBgColor,
    })
  }

  // An immediate watcher's first call runs synchronously during setup, before
  // the component has actually mounted (flush: 'post' only changes the timing
  // of *subsequent* runs) — so the first render has to go through onMounted
  // instead, where the container is guaranteed to exist.
  onMounted(renderLabels)

  watch([() => props.areaNameOnMap, () => props.data, svgMap], renderLabels, {
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
      :id="containerId"
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
