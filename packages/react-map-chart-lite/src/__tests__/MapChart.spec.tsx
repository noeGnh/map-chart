import { cleanup, render } from '@testing-library/react'
import countries from 'i18n-iso-countries'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { MapChart } from '../index'

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
})

function required<T>(value: T | null | undefined, message: string): T {
  if (value === null || value === undefined) throw new Error(message)
  return value
}

const customMapSvg =
  '<svg xmlns="http://www.w3.org/2000/svg"><path id="AAA"/><path id="BBB"/></svg>'

describe('buildStyles', () => {
  it('does not accumulate CSS rules across reactive data changes', () => {
    const { container, rerender } = render(
      <MapChart data={{ AAA: 10 }} customMapSvg={customMapSvg} />
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
      rerender(<MapChart data={{ AAA: value }} customMapSvg={customMapSvg} />)
    }

    const content = required(styleEl.textContent, 'style tag is empty')
    const occurrences = (content.match(/#AAA \{/g) || []).length
    expect(occurrences).toBe(1)
  })
})

describe('component instance ids', () => {
  it('never collides between two mounted instances', () => {
    const first = render(<MapChart data={{}} customMapSvg={customMapSvg} />)
    const second = render(<MapChart data={{}} customMapSvg={customMapSvg} />)

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
      <MapChart data={{}} customMapSvg={customMapSvg} langCode="en" />
    )
    expect(spy).toHaveBeenCalledTimes(1)

    rerender(<MapChart data={{}} customMapSvg={customMapSvg} langCode="fr" />)
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
