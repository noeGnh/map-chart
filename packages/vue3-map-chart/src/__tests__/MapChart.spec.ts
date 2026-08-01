import { flushPromises, mount } from '@vue/test-utils'
import countries from 'i18n-iso-countries'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h, nextTick } from 'vue'

import AfricaMap from '../assets/maps/continents/africa.svg?raw'
import MapChart from '../components/MapChart.vue'

// Africa map ships real ISO alpha-2 ids, e.g. #EG (Egypt), used below to
// exercise the code paths that only apply to built-in maps (case
// normalization, i18n-iso-countries lookups) — customMapSvg intentionally
// bypasses those.

const wrappers: ReturnType<typeof mount>[] = []

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new Error(message)
  return value
}

const mountChart = (props: Record<string, unknown> = {}, withMap = true) => {
  const wrapper = mount(MapChart, {
    attachTo: document.body,
    props: { data: {}, ...props },
    slots: withMap ? { default: () => h(AfricaMap) } : undefined,
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
  document.body.innerHTML = ''
  vi.restoreAllMocks()
})

describe('buildStyles', () => {
  it('does not accumulate CSS rules across reactive data changes', async () => {
    const wrapper = mountChart({ data: { EG: 10 } })
    await flushPromises()

    const containerId = required(
      wrapper.find('.v3mc-map').attributes('id'),
      'container id not found'
    )
    const styleEl = required(
      document.getElementById(`${containerId}-styles`),
      'style tag not found'
    )

    for (const value of [20, 30, 40]) {
      await wrapper.setProps({ data: { EG: value } })
      await nextTick()
    }

    const content = required(styleEl.textContent, 'style tag is empty')
    const occurrences = (content.match(/#EG \{/g) || []).length
    expect(occurrences).toBe(1)
  })
})

describe('data key case normalization', () => {
  it('colors the map and reports the right value regardless of key case', async () => {
    const wrapper = mountChart({ data: { eg: 42 } })
    await flushPromises()

    const containerId = required(
      wrapper.find('.v3mc-map').attributes('id'),
      'container id not found'
    )
    const styleEl = required(
      document.getElementById(`${containerId}-styles`),
      'style tag not found'
    )
    expect(styleEl.textContent).toContain('#EG {')

    await wrapper.find('#EG').trigger('mouseover')

    const events = wrapper.emitted('mapItemMouseover')
    expect(events).toBeTruthy()
    expect(events?.[0]).toEqual(['EG', 42])
  })
})

describe('areaNameOnMap reactivity', () => {
  it('renders no labels when set to none, and adds them when toggled to all', async () => {
    const wrapper = mountChart({ areaNameOnMap: 'none' })
    await flushPromises()
    expect(wrapper.findAll('.labels-group').length).toBe(0)

    await wrapper.setProps({ areaNameOnMap: 'all' })
    await nextTick()
    await flushPromises()

    expect(wrapper.findAll('.labels-group').length).toBeGreaterThan(0)
    expect(wrapper.findAll('.labels-group text').length).toBeGreaterThan(1)
  })

  it('labels only the countries present in data when set to data-only', async () => {
    const wrapper = mountChart({ data: { eg: 5 }, areaNameOnMap: 'data-only' })
    await nextTick()
    await flushPromises()
    await nextTick()

    expect(wrapper.findAll('.labels-group text').length).toBe(1)
  })
})

describe('component instance ids', () => {
  it('never collides between two mounted instances', () => {
    const first = mountChart()
    const second = mountChart()

    const firstId = first.find('.v3mc-map').attributes('id')
    const secondId = second.find('.v3mc-map').attributes('id')

    expect(firstId).toBeDefined()
    expect(firstId).not.toBe(secondId)
  })
})

describe('langCode reactivity', () => {
  it('registers a new locale when langCode changes after mount', async () => {
    const spy = vi.spyOn(countries, 'registerLocale')

    const wrapper = mountChart({ langCode: 'en' })
    await flushPromises()
    expect(spy).toHaveBeenCalledTimes(1)

    await wrapper.setProps({ langCode: 'fr' })
    await flushPromises()
    expect(spy).toHaveBeenCalledTimes(2)
  })
})

describe('sanitizeCustomMapSvg', () => {
  const dirtySvg =
    '<svg xmlns="http://www.w3.org/2000/svg">' +
    '<path id="AAA" onclick="alert(1)" d="M0 0"/></svg>'

  it('strips unsafe attributes by default', async () => {
    const wrapper = mountChart({ customMapSvg: dirtySvg }, false)
    await flushPromises()

    expect(wrapper.find('#AAA').attributes('onclick')).toBeUndefined()
  })

  it('preserves the raw markup when disabled', async () => {
    const wrapper = mountChart(
      { customMapSvg: dirtySvg, sanitizeCustomMapSvg: false },
      false
    )
    await flushPromises()

    expect(wrapper.find('#AAA').attributes('onclick')).toBe('alert(1)')
  })
})
