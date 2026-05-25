import { rateLimit, getClientIp } from '@/lib/rate-limit'

// ── rateLimit ─────────────────────────────────────────────────────────────────

describe('rateLimit', () => {
  beforeEach(() => jest.useFakeTimers())
  afterEach(() => jest.useRealTimers())

  it('allows the first request', () => {
    expect(rateLimit('key-first', 5, 60_000)).toBe(true)
  })

  it('allows requests up to the max limit', () => {
    const key = 'key-up-to-max'
    for (let i = 0; i < 5; i++) {
      expect(rateLimit(key, 5, 60_000)).toBe(true)
    }
  })

  it('blocks the request that exceeds the max', () => {
    const key = 'key-exceed'
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000)
    expect(rateLimit(key, 5, 60_000)).toBe(false)
  })

  it('continues to block all requests above the max', () => {
    const key = 'key-stays-blocked'
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000)
    expect(rateLimit(key, 5, 60_000)).toBe(false)
    expect(rateLimit(key, 5, 60_000)).toBe(false)
  })

  it('resets the counter after the window expires', () => {
    const key = 'key-reset'
    for (let i = 0; i < 5; i++) rateLimit(key, 5, 60_000)
    expect(rateLimit(key, 5, 60_000)).toBe(false)

    jest.advanceTimersByTime(60_001)

    expect(rateLimit(key, 5, 60_000)).toBe(true)
  })

  it('different keys do not share counts', () => {
    const keyA = 'key-isolate-a'
    const keyB = 'key-isolate-b'
    for (let i = 0; i < 5; i++) rateLimit(keyA, 5, 60_000)

    expect(rateLimit(keyA, 5, 60_000)).toBe(false)
    expect(rateLimit(keyB, 5, 60_000)).toBe(true)
  })

  it('max of 1 allows first request and blocks the second', () => {
    const key = 'key-max-one'
    expect(rateLimit(key, 1, 60_000)).toBe(true)
    expect(rateLimit(key, 1, 60_000)).toBe(false)
  })
})

// ── getClientIp ───────────────────────────────────────────────────────────────

describe('getClientIp', () => {
  function makeReq(headers: Record<string, string>) {
    return new Request('http://localhost', { headers })
  }

  it('returns the first IP from a comma-separated x-forwarded-for header', () => {
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4, 5.6.7.8, 9.10.11.12' })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('returns the single IP when x-forwarded-for has no commas', () => {
    const req = makeReq({ 'x-forwarded-for': '1.2.3.4' })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('trims whitespace from the extracted IP', () => {
    const req = makeReq({ 'x-forwarded-for': '  1.2.3.4  , 5.6.7.8' })
    expect(getClientIp(req)).toBe('1.2.3.4')
  })

  it('falls back to x-real-ip when x-forwarded-for is absent', () => {
    const req = makeReq({ 'x-real-ip': '9.8.7.6' })
    expect(getClientIp(req)).toBe('9.8.7.6')
  })

  it('returns unknown when both headers are absent', () => {
    const req = makeReq({})
    expect(getClientIp(req)).toBe('unknown')
  })

  it('prefers x-forwarded-for over x-real-ip when both are present', () => {
    const req = makeReq({ 'x-forwarded-for': '1.1.1.1', 'x-real-ip': '2.2.2.2' })
    expect(getClientIp(req)).toBe('1.1.1.1')
  })
})
