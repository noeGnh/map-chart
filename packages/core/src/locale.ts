import countries from 'i18n-iso-countries'

import locales from './i18n-iso-countries-locales'

export async function registerLocale(langCode: string): Promise<void> {
  try {
    if (locales[langCode]) countries.registerLocale(locales[langCode])
  } catch (error) {
    console.error('Error loading locale:', error)
  }
}
