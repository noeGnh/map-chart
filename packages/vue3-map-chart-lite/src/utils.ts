import DOMPurify from 'dompurify'

/**
 * Checks if the given value is an object and not an array or null.
 *
 * @param {any} value - The value to check.
 * @return {boolean} Returns true if the value is an object and not an array or null, false otherwise.
 */
export function isObject(value: any): boolean {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
}

/**
 * Formats a number with a magnitude suffix.
 *
 * @param {number} number - The number to be formatted.
 * @return {string|number} The formatted number with the magnitude suffix.
 */
export function formatNumberWithSIPrefix(number: number): string | number {
  var SI_SYMBOL = ['', 'k', 'M', 'G', 'T', 'P', 'E']

  var tier = (Math.log10(Math.abs(number)) / 3) | 0

  if (tier == 0) return number

  var suffix = SI_SYMBOL[tier]
  var scale = Math.pow(10, tier * 3)

  var scaled = number / scale

  return scaled.toFixed(1) + suffix
}

/**
 * Generates a random integer between the provided minimum and maximum values (inclusive).
 *
 * @param {number} min - The minimum value for the random integer.
 * @param {number} max - The maximum value for the random integer.
 * @return {number} The randomly generated integer.
 */
export function getRandomInteger(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

// Module-scoped counter, shared by every MapChart instance across the app, so
// their DOM ids are guaranteed unique instead of relying on a random number
// that can collide.
let instanceCount = 0

/**
 * Returns a new, monotonically increasing id unique to this module instance.
 *
 * @return {number} The next instance id.
 */
export function getNextInstanceId(): number {
  instanceCount += 1
  return instanceCount
}

/**
 * Checks if the given code is a valid ISO code.
 *
 * @param {string} code - The code to be checked.
 * @return {boolean} Returns true if the code is a valid ISO code, false otherwise.
 */
export function isValidIsoCode(code: string): boolean {
  const isoCodeRegex = /^(?:[A-Z]{2,3}|[A-Z]{2}-[A-Z0-9]{1,3})$/
  return isoCodeRegex.test(code)
}

/**
 * Checks if the given string is a valid SVG document.
 *
 * @param {string} input - The string to be checked.
 * @return {boolean} Returns true if the string is a valid SVG document, false otherwise.
 */
export function isSVG(input: string): boolean {
  try {
    const parser = new DOMParser()
    const doc = parser.parseFromString(input.trim(), 'image/svg+xml')

    if (doc.getElementsByTagName('parsererror').length > 0) return false

    const root = doc.documentElement
    return root.tagName.toLowerCase() === 'svg'
  } catch {
    return false
  }
}

/**
 * Removes unsafe elements/attributes (scripts, event handlers, foreignObject, ...)
 * from an SVG document before it is injected into the DOM via v-html.
 *
 * @param {string} input - The raw SVG markup to sanitize.
 * @return {string} The sanitized SVG markup.
 */
export function sanitizeSVG(input: string): string {
  return DOMPurify.sanitize(input, {
    USE_PROFILES: { svg: true, svgFilters: true },
  })
}
