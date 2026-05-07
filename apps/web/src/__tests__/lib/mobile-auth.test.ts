import crypto from 'crypto'

// Mock jose (ESM-only package) with a Node crypto-based HS256 implementation
jest.mock('jose', () => {
  const crypto = require('crypto') as typeof import('crypto')

  return {
    jwtVerify: async (token: string, key: Uint8Array) => {
      const parts = token.split('.')
      if (parts.length !== 3) throw new Error('Invalid token structure')
      const [headerB64, payloadB64, sigB64] = parts
      const expected = crypto
        .createHmac('sha256', Buffer.from(key))
        .update(`${headerB64}.${payloadB64}`)
        .digest('base64url')
      if (expected !== sigB64) throw new Error('Invalid signature')
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString('utf8'))
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired')
      }
      return { payload }
    },
  }
})

import { verifyMobileToken, verifyMobileTokenFull } from '@/lib/mobile-auth'

const SECRET = 'test-secret-at-least-32-characters-long'
const SECRET_BYTES = new TextEncoder().encode(SECRET)

beforeAll(() => {
  process.env.NEXTAUTH_SECRET = SECRET
})

function signToken(
  payload: Record<string, unknown>,
  expiresOffsetSeconds = 3600,
): string {
  const header = Buffer.from(JSON.stringify({ alg: 'HS256', typ: 'JWT' })).toString('base64url')
  const now = Math.floor(Date.now() / 1000)
  const full = { iat: now, exp: now + expiresOffsetSeconds, ...payload }
  const body = Buffer.from(JSON.stringify(full)).toString('base64url')
  const sig = crypto
    .createHmac('sha256', Buffer.from(SECRET_BYTES))
    .update(`${header}.${body}`)
    .digest('base64url')
  return `${header}.${body}.${sig}`
}

function makeRequest(authHeader?: string) {
  return new Request('http://localhost/api/test', {
    headers: authHeader ? { authorization: authHeader } : {},
  }) as unknown as import('next/server').NextRequest
}

describe('verifyMobileToken', () => {
  it('returns null when authorization header is missing', async () => {
    expect(await verifyMobileToken(makeRequest())).toBeNull()
  })

  it('returns null when header does not start with Bearer', async () => {
    expect(await verifyMobileToken(makeRequest('Basic abc123'))).toBeNull()
  })

  it('returns null for a malformed token', async () => {
    expect(await verifyMobileToken(makeRequest('Bearer not.valid'))).toBeNull()
  })

  it('returns null for an expired token', async () => {
    const token = signToken({ sub: 'user-123' }, -10)
    expect(await verifyMobileToken(makeRequest(`Bearer ${token}`))).toBeNull()
  })

  it('returns userId for a valid token', async () => {
    const token = signToken({ sub: 'user-123' })
    expect(await verifyMobileToken(makeRequest(`Bearer ${token}`))).toBe('user-123')
  })
})

describe('verifyMobileTokenFull', () => {
  it('returns userId and role for a valid token', async () => {
    const token = signToken({ sub: 'user-456', role: 'admin' })
    expect(await verifyMobileTokenFull(makeRequest(`Bearer ${token}`))).toEqual({
      userId: 'user-456',
      role: 'admin',
    })
  })

  it('defaults role to patient when not in token', async () => {
    const token = signToken({ sub: 'user-789' })
    expect(await verifyMobileTokenFull(makeRequest(`Bearer ${token}`))).toEqual({
      userId: 'user-789',
      role: 'patient',
    })
  })

  it('returns null for missing header', async () => {
    expect(await verifyMobileTokenFull(makeRequest())).toBeNull()
  })
})
