import { flushPromises, mount } from '@vue/test-utils'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { h } from 'vue'

// Real SVG from the sibling full package, used as the mocked fetch response
// so these tests exercise the real isSVG/sanitizeSVG pipeline on real
// content instead of a hand-rolled fixture. Same relative-import pattern as
// scripts/generate-svg-map-exports.ts.
import AfricaMapSvg from '../../../vue3-map-chart/src/assets/maps/continents/africa.svg?raw'
import MapChart from '../components/MapChart.vue'

// Mirrors what scripts/generate-svg-map-exports.ts generates for a built-in
// map — MapChart reads this object off the vnode `type`, see loadSvgMap().
const AfricaMap = { name: 'AfricaMap', template: 'continents/africa.svg' }

const wrappers: ReturnType<typeof mount>[] = []

const mountWithMap = (props: Record<string, unknown> = {}) => {
  const wrapper = mount(MapChart, {
    attachTo: document.body,
    props: { data: {}, ...props },
    slots: { default: () => h(AfricaMap) },
  })
  wrappers.push(wrapper)
  return wrapper
}

afterEach(() => {
  wrappers.forEach((wrapper) => wrapper.unmount())
  wrappers.length = 0
  document.body.innerHTML = ''
  localStorage.clear()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
})

describe('built-in map fetch', () => {
  it('fetches the versioned jsDelivr URL, shows a loader, then renders the sanitized SVG', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => AfricaMapSvg,
    }))
    vi.stubGlobal('fetch', fetchMock)

    const wrapper = mountWithMap()

    // Synchronous portion of loadSvgMap runs before the first `await`, so
    // isLoading is already true right after mount (v-show sets no `style`
    // attribute at all when the element is shown).
    expect(
      wrapper.find('.v3mc-tiny-loader-wrapper').attributes('style') ?? ''
    ).not.toContain('display: none')

    await flushPromises()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    const [calledUrl] = fetchMock.mock.calls[0] as [string]
    expect(calledUrl).toBe(
      `https://cdn.jsdelivr.net/gh/noeGnh/vue3-map-chart@v${__V3MC_VERSION__}/packages/vue3-map-chart/src/assets/maps/continents/africa.svg`
    )

    expect(wrapper.find('.v3mc-tiny-loader-wrapper').attributes('style')).toContain(
      'display: none'
    )
    expect(wrapper.find('.v3mc-map path[id]').exists()).toBe(true)
  })

  it('caches the fetched map under a version-scoped key and skips a second fetch', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => AfricaMapSvg,
    }))
    vi.stubGlobal('fetch', fetchMock)

    mountWithMap()
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(1)

    const cacheKey = `AfricaMap@${__V3MC_VERSION__}`
    expect(localStorage.getItem(cacheKey)).toBeTruthy()

    mountWithMap()
    await flushPromises()
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('renders nothing and does not throw when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, text: async () => '' }))
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const wrapper = mountWithMap()
    await flushPromises()

    expect(wrapper.find('.v3mc-map').html()).not.toContain('<svg')
    expect(errorSpy).toHaveBeenCalled()
  })

  it('rejects a response that is not valid SVG', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({
        ok: true,
        status: 200,
        text: async () => 'not an svg document',
      }))
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const wrapper = mountWithMap()
    await flushPromises()

    expect(wrapper.find('.v3mc-map').html()).not.toContain('not an svg')
    expect(errorSpy).toHaveBeenCalled()
  })

  it('sanitizes a malicious remote payload before injecting it', async () => {
    const malicious =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<script>alert(1)</script><path id="FR" onclick="alert(1)" d="M0 0"/></svg>'

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, text: async () => malicious }))
    )

    const wrapper = mountWithMap()
    await flushPromises()

    const html = wrapper.find('.v3mc-map').html()
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onclick')
    expect(wrapper.find('#FR').exists()).toBe(true)
  })
})
