import { cleanup, render, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

// Real SVG from @map-chart/core, used as the mocked fetch response so these
// tests exercise the real isSVG/sanitizeSVG pipeline on real content instead
// of a hand-rolled fixture — the same source the real fetch pulls from.
import AfricaMapSvg from '@map-chart/core/assets/maps/continents/africa.svg?raw'
import { AfricaMap, MapChart } from '../index'
import { PACKAGE_VERSION } from '../version'

afterEach(() => {
  cleanup()
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

    const { container } = render(
      <MapChart data={{}}>
        <AfricaMap />
      </MapChart>
    )

    // Synchronous portion of the load effect runs before the first `await`,
    // so the loader wrapper is already visible right after mount.
    const loaderWrapper = container.querySelector('.v3mc-tiny-loader-wrapper')
    expect(loaderWrapper).not.toBeNull()
    expect((loaderWrapper as HTMLElement).style.display).not.toBe('none')

    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const [calledUrl] = fetchMock.mock.calls[0] as [string]
    expect(calledUrl).toBe(
      `https://cdn.jsdelivr.net/gh/noeGnh/vue3-map-chart@v${PACKAGE_VERSION}/packages/core/src/assets/maps/continents/africa.svg`
    )

    await waitFor(() =>
      expect((loaderWrapper as HTMLElement).style.display).toBe('none')
    )
    expect(container.querySelector('.v3mc-map path[id]')).not.toBeNull()
  })

  it('caches the fetched map under a version-scoped key and skips a second fetch', async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      status: 200,
      text: async () => AfricaMapSvg,
    }))
    vi.stubGlobal('fetch', fetchMock)

    render(
      <MapChart data={{}}>
        <AfricaMap />
      </MapChart>
    )
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(1))

    const cacheKey = `AfricaMap@${PACKAGE_VERSION}`
    expect(localStorage.getItem(cacheKey)).toBeTruthy()

    render(
      <MapChart data={{}}>
        <AfricaMap />
      </MapChart>
    )
    await new Promise((resolve) => setTimeout(resolve, 0))
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('renders nothing and does not throw when the response is not ok', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: false, status: 404, text: async () => '' }))
    )
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)

    const { container } = render(
      <MapChart data={{}}>
        <AfricaMap />
      </MapChart>
    )

    await waitFor(() => expect(errorSpy).toHaveBeenCalled())
    expect(container.querySelector('.v3mc-map')?.innerHTML).not.toContain('<svg')
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

    const { container } = render(
      <MapChart data={{}}>
        <AfricaMap />
      </MapChart>
    )

    await waitFor(() => expect(errorSpy).toHaveBeenCalled())
    expect(container.querySelector('.v3mc-map')?.innerHTML).not.toContain(
      'not an svg'
    )
  })

  it('sanitizes a malicious remote payload before injecting it', async () => {
    const malicious =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<script>alert(1)</script><path id="FR" onclick="alert(1)" d="M0 0"/></svg>'

    vi.stubGlobal(
      'fetch',
      vi.fn(async () => ({ ok: true, status: 200, text: async () => malicious }))
    )

    const { container } = render(
      <MapChart data={{}}>
        <AfricaMap />
      </MapChart>
    )

    await waitFor(() => expect(container.querySelector('#FR')).not.toBeNull())

    const html = container.querySelector('.v3mc-map')?.innerHTML ?? ''
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onclick')
  })
})
