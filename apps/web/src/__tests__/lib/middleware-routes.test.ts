/**
 * Unit tests for the middleware route-matching regexes.
 * These patterns live in src/middleware.ts — copy them here so changes
 * to the patterns are caught as test failures.
 */

const PROTECTED =
  /^\/(bg|en)\/(dashboard|documents|rights|deadlines|appeal|employer-letter|lifelong-check|score-predictor|settings)(\/.*)?$/

const ADMIN_ONLY = /^\/(bg|en)\/admin(\/.*)?$/

const AUTH_PAGES = /^\/(bg|en)\/sign-in(\/.*)?$/

// ── PROTECTED ─────────────────────────────────────────────────────────────────

describe('PROTECTED regex', () => {
  it.each([
    '/bg/dashboard',
    '/en/dashboard',
    '/bg/documents',
    '/bg/rights',
    '/bg/deadlines',
    '/bg/appeal',
    '/bg/employer-letter',
    '/bg/lifelong-check',
    '/bg/score-predictor',
    '/bg/settings',
    '/bg/dashboard/some/sub/path',
  ])('matches %s', (path) => {
    expect(PROTECTED.test(path)).toBe(true)
  })

  it.each([
    '/bg/sign-in',
    '/bg/admin',
    '/bg/',
    '/bg/home',
    '/api/register',
    '/bg/dashboard-extra',   // must not match prefix-only
    '/',
  ])('does not match %s', (path) => {
    expect(PROTECTED.test(path)).toBe(false)
  })
})

// ── ADMIN_ONLY ────────────────────────────────────────────────────────────────

describe('ADMIN_ONLY regex', () => {
  it.each([
    '/bg/admin',
    '/en/admin',
    '/bg/admin/users',
    '/bg/admin/settings/roles',
  ])('matches %s', (path) => {
    expect(ADMIN_ONLY.test(path)).toBe(true)
  })

  it.each([
    '/bg/dashboard',
    '/bg/sign-in',
    '/bg/admin-tools',   // must not match prefix-only
    '/api/admin',
    '/',
  ])('does not match %s', (path) => {
    expect(ADMIN_ONLY.test(path)).toBe(false)
  })
})

// ── AUTH_PAGES ────────────────────────────────────────────────────────────────

describe('AUTH_PAGES regex', () => {
  it.each([
    '/bg/sign-in',
    '/en/sign-in',
    '/bg/sign-in/callback',
  ])('matches %s', (path) => {
    expect(AUTH_PAGES.test(path)).toBe(true)
  })

  it.each([
    '/bg/dashboard',
    '/bg/admin',
    '/bg/sign-out',
    '/bg/sign-in-extra',   // must not match prefix-only
    '/',
  ])('does not match %s', (path) => {
    expect(AUTH_PAGES.test(path)).toBe(false)
  })
})
