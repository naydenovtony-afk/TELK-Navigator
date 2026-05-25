import { auth } from '@/auth'
import createIntlMiddleware from 'next-intl/middleware'
import { routing } from '@/i18n/routing'
import { NextResponse } from 'next/server'

const intlMiddleware = createIntlMiddleware(routing)

// Routes that require a logged-in session
const PROTECTED = /^\/(bg|en)\/(dashboard|documents|rights|deadlines|appeal|employer-letter|lifelong-check|score-predictor|settings)(\/.*)?$/
// Routes that require admin role
const ADMIN_ONLY = /^\/(bg|en)\/admin(\/.*)?$/
// Auth pages — redirect away if already logged in
const AUTH_PAGES = /^\/(bg|en)\/sign-in(\/.*)?$/

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session?.user
  const isAdmin = (session?.user as { role?: string })?.role === 'admin'
  const path = nextUrl.pathname

  if (PROTECTED.test(path) && !isLoggedIn) {
    return NextResponse.redirect(new URL('/bg/sign-in', nextUrl))
  }

  if (ADMIN_ONLY.test(path) && (!isLoggedIn || !isAdmin)) {
    return NextResponse.redirect(new URL(isLoggedIn ? '/bg/dashboard' : '/bg/sign-in', nextUrl))
  }

  if (AUTH_PAGES.test(path) && isLoggedIn) {
    return NextResponse.redirect(new URL('/bg/dashboard', nextUrl))
  }

  return intlMiddleware(req)
})

export const config = {
  matcher: [
    '/((?!api/|_next/static|_next/image|favicon.ico|.*\\..*).*)',
  ],
}
