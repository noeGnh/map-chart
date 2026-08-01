import { describe, expect, it } from 'vitest'

import {
  formatNumberWithSIPrefix,
  getNextInstanceId,
  getRandomInteger,
  isObject,
  isSVG,
  isValidIsoCode,
  sanitizeSVG,
} from '../utils'

describe('isObject', () => {
  it('returns true for a plain object', () => {
    expect(isObject({ a: 1 })).toBe(true)
  })

  it('returns false for an array', () => {
    expect(isObject([1, 2, 3])).toBe(false)
  })

  it('returns false for null', () => {
    expect(isObject(null)).toBe(false)
  })

  it('returns false for a primitive', () => {
    expect(isObject('foo')).toBe(false)
    expect(isObject(42)).toBe(false)
  })
})

describe('formatNumberWithSIPrefix', () => {
  it('leaves 0 and small numbers untouched', () => {
    expect(formatNumberWithSIPrefix(0)).toBe(0)
    expect(formatNumberWithSIPrefix(42)).toBe(42)
    expect(formatNumberWithSIPrefix(999)).toBe(999)
  })

  it('formats thousands with a k suffix', () => {
    expect(formatNumberWithSIPrefix(1500)).toBe('1.5k')
  })

  it('formats millions with an M suffix', () => {
    expect(formatNumberWithSIPrefix(2_500_000)).toBe('2.5M')
  })

  it('preserves the sign for negative numbers', () => {
    expect(formatNumberWithSIPrefix(-2_500_000)).toBe('-2.5M')
  })
})

describe('getRandomInteger', () => {
  it('always returns an integer within the given bounds', () => {
    for (let i = 0; i < 50; i++) {
      const value = getRandomInteger(10, 20)
      expect(Number.isInteger(value)).toBe(true)
      expect(value).toBeGreaterThanOrEqual(10)
      expect(value).toBeLessThanOrEqual(20)
    }
  })
})

describe('getNextInstanceId', () => {
  it('strictly increases on every call', () => {
    const first = getNextInstanceId()
    const second = getNextInstanceId()
    const third = getNextInstanceId()

    expect(second).toBeGreaterThan(first)
    expect(third).toBeGreaterThan(second)
  })
})

describe('isValidIsoCode', () => {
  it('accepts valid ISO country/subdivision codes', () => {
    expect(isValidIsoCode('FR')).toBe(true)
    expect(isValidIsoCode('USA')).toBe(true)
    expect(isValidIsoCode('US-CA')).toBe(true)
  })

  it('rejects invalid codes', () => {
    expect(isValidIsoCode('fr')).toBe(false)
    expect(isValidIsoCode('1F')).toBe(false)
    expect(isValidIsoCode('TOOLONG')).toBe(false)
  })
})

describe('isSVG', () => {
  it('accepts a minimal valid SVG document', () => {
    expect(isSVG('<svg xmlns="http://www.w3.org/2000/svg"></svg>')).toBe(true)
  })

  it('rejects non-SVG content', () => {
    expect(isSVG('<div>not svg</div>')).toBe(false)
    expect(isSVG('just some text')).toBe(false)
    expect(isSVG('')).toBe(false)
  })
})

describe('sanitizeSVG', () => {
  it('strips script tags and event handler attributes', () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script>' +
      '<path id="FR" onclick="alert(1)" d="M0 0"/></svg>'

    const clean = sanitizeSVG(dirty)

    expect(clean).not.toContain('<script')
    expect(clean).not.toContain('onclick')
    expect(clean).toContain('id="FR"')
  })

  it('strips foreignObject', () => {
    const dirty =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<foreignObject><div>html</div></foreignObject></svg>'

    expect(sanitizeSVG(dirty)).not.toContain('foreignObject')
  })

  it('leaves legitimate SVG content intact', () => {
    const legit =
      '<svg xmlns="http://www.w3.org/2000/svg">' +
      '<defs><linearGradient id="g"></linearGradient></defs>' +
      '<g><path id="FR" d="M0 0 L10 10"/></g></svg>'

    const clean = sanitizeSVG(legit)

    expect(clean).toContain('linearGradient')
    expect(clean).toContain('id="FR"')
    expect(clean).toContain('d="M0 0 L10 10"')
  })
})
