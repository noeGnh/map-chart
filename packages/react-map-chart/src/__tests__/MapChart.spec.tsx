import { cleanup, fireEvent, render } from '@testing-library/react'
import countries from 'i18n-iso-countries'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { AfricaMap, MapChart } from '../index'

// Africa map ships real ISO alpha-2 ids, e.g. #EG (Egypt), used below to
// exercise the code paths that only apply to built-in maps (case
// normalization, i18n-iso-countries lookups) — customMapSvg intentionally
// bypasses those.

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new Error(message)
  return value
}

describe('buildStyles', () => {
  it('does not accumulate CSS rules across reactive data changes', () => {
    const { container, rerender } = render(
      <MapChart data={{ EG: 10 }}>
        <AfricaMap />
      </MapChart>
    )

    const containerId = required(
      container.querySelector('.v3mc-map')?.id,
      'container id not found'
    )
    const styleEl = required(
      document.getElementById(`${containerId}-styles`),
      'style tag not found'
    )

    for (const value of [20, 30, 40]) {
      rerender(
        <MapChart data={{ EG: value }}>
          <AfricaMap />
        </MapChart>
      )
    }

    const content = required(styleEl.textContent, 'style tag is empty')
    const occurrences = (content.match(/#EG \{/g) || []).length
    expect(occurrences).toBe(1)
  })
})

describe('data key case normalization', () => {
  it('colors the map and reports the right value regardless of key case', () => {
    const onMapItemMouseover = vi.fn()
    const { container } = render(
      <MapChart data={{ eg: 42 }} onMapItemMouseover={onMapItemMouseover}>
        <AfricaMap />
      </MapChart>
    )

    const containerId = required(
      container.querySelector('.v3mc-map')?.id,
      'container id not found'
    )
    const styleEl = required(
      document.getElementById(`${containerId}-styles`),
      'style tag not found'
    )
    expect(styleEl.textContent).toContain('#EG {')

    const egPath = required(container.querySelector('#EG'), '#EG path not found')
    fireEvent.mouseOver(egPath)

    expect(onMapItemMouseover).toHaveBeenCalledWith('EG', 42)
  })
})

describe('areaNameOnMap reactivity', () => {
  it('renders no labels when set to none, and adds them when toggled to all', () => {
    const { container, rerender } = render(
      <MapChart data={{}} areaNameOnMap="none">
        <AfricaMap />
      </MapChart>
    )
    expect(container.querySelectorAll('.labels-group').length).toBe(0)

    rerender(
      <MapChart data={{}} areaNameOnMap="all">
        <AfricaMap />
      </MapChart>
    )

    expect(container.querySelectorAll('.labels-group').length).toBeGreaterThan(0)
    expect(container.querySelectorAll('.labels-group text').length).toBeGreaterThan(1)
  })

  it('labels only the countries present in data when set to data-only', () => {
    const { container } = render(
      <MapChart data={{ eg: 5 }} areaNameOnMap="data-only">
        <AfricaMap />
      </MapChart>
    )

    expect(container.querySelectorAll('.labels-group text').length).toBe(1)
  })
})

describe('component instance ids', () => {
  it('never collides between two mounted instances', () => {
    const first = render(
      <MapChart data={{}}>
        <AfricaMap />
      </MapChart>
    )
    const second = render(
      <MapChart data={{}}>
        <AfricaMap />
      </MapChart>
    )

    const firstId = first.container.querySelector('.v3mc-map')?.id
    const secondId = second.container.querySelector('.v3mc-map')?.id

    expect(firstId).toBeDefined()
    expect(firstId).not.toBe(secondId)
  })
})

describe('langCode reactivity', () => {
  it('registers a new locale when langCode changes after mount', () => {
    const spy = vi.spyOn(countries, 'registerLocale')

    const { rerender } = render(
      <MapChart data={{}} langCode="en">
        <AfricaMap />
      </MapChart>
    )
    expect(spy).toHaveBeenCalledTimes(1)

    rerender(
      <MapChart data={{}} langCode="fr">
        <AfricaMap />
      </MapChart>
    )
    expect(spy).toHaveBeenCalledTimes(2)
  })
})

describe('sanitizeCustomMapSvg', () => {
  const dirtySvg =
    '<svg xmlns="http://www.w3.org/2000/svg">' +
    '<path id="AAA" onclick="alert(1)" d="M0 0"/></svg>'

  it('strips unsafe attributes by default', () => {
    const { container } = render(<MapChart data={{}} customMapSvg={dirtySvg} />)

    expect(container.querySelector('#AAA')?.getAttribute('onclick')).toBeNull()
  })

  it('preserves the raw markup when disabled', () => {
    const { container } = render(
      <MapChart data={{}} customMapSvg={dirtySvg} sanitizeCustomMapSvg={false} />
    )

    expect(container.querySelector('#AAA')?.getAttribute('onclick')).toBe('alert(1)')
  })
})
