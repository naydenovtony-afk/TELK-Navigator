import { getRequestConfig } from 'next-intl/server'
import { routing } from './routing'

export default getRequestConfig(async ({ requestLocale }) => {
  let locale = await requestLocale
  if (!locale || !routing.locales.includes(locale as 'bg')) {
    locale = routing.defaultLocale
  }

  const [common, telk] = await Promise.all([
    import(`../../locales/${locale}/common.json`),
    import(`../../locales/${locale}/telk.json`),
  ])

  return {
    locale,
    messages: {
      ...common.default,
      telk: telk.default,
    },
  }
})
