import { auth } from '@/auth'
import createIntlMiddleware from 'next-intl/middleware'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const intlMiddleware = createIntlMiddleware({
  locales: ['bg'],
  defaultLocale: 'bg',
})

export default auth((req: NextRequest & { auth: unknown }) => {
  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!api/mobile|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
