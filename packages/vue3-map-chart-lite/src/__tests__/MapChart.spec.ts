import { flushPromises, mount } from '@vue/test-utils'
import countries from 'i18n-iso-countries'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { nextTick } from 'vue'

import MapChart from '../components/MapChart.vue'

// These cases only need customMapSvg (synchronous, no network) — the
// built-in maps are fetched asynchronously, covered separately in
// MapChart.fetch.spec.ts where fetch is mocked.

const wrappers: ReturnType<typeof mount>[] = []

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new Error(message)
  return value
}

const mountChart = (props: Record<string, unknown> = {}) => {
  const wrapper = mount(MapChart, {
    attachTo: document.body,
    props: {
      data: {},
      customMapSvg:
        '<svg xmlns="http://www.w3.org/2000/svg">' +
        '<path id="AAA"/><path id="BBB"/></svg>',
      ...props,
    },
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
    const wrapper = mountChart({ data: { AAA: 10 } })
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
      await wrapper.setProps({ data: { AAA: value } })
      await nextTick()
    }

    const content = required(styleEl.textContent, 'style tag is empty')
    const occurrences = (content.match(/#AAA \{/g) || []).length
    expect(occurrences).toBe(1)
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
    const wrapper = mountChart({ customMapSvg: dirtySvg })
    await flushPromises()

    expect(wrapper.find('#AAA').attributes('onclick')).toBeUndefined()
  })

  it('preserves the raw markup when disabled', async () => {
    const wrapper = mountChart({
      customMapSvg: dirtySvg,
      sanitizeCustomMapSvg: false,
    })
    await flushPromises()

    expect(wrapper.find('#AAA').attributes('onclick')).toBe('alert(1)')
  })
})
