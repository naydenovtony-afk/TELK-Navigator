jest.mock('@/lib/rate-limit', () => ({
  rateLimit: jest.fn().mockReturnValue(true),
  getClientIp: jest.fn().mockReturnValue('127.0.0.1'),
}))

jest.mock('bcryptjs', () => ({ hash: jest.fn().mockResolvedValue('$2b$12$hashed') }))

jest.mock('@/db', () => ({
  db: {
    query: {
      users: { findFirst: jest.fn() },
    },
    insert: jest.fn(),
  },
}))

import { POST } from '@/app/api/register/route'
import { db } from '@/db'

const mockFindUser = db.query.users.findFirst as jest.Mock
const mockInsert = db.insert as jest.Mock

const NEW_USER = { id: 'u-new', email: 'new@example.com', role: 'patient' }

function makeReq(body: unknown) {
  return new Request('http://localhost/api/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

function setupInsert(user = NEW_USER) {
  const returning = jest.fn().mockResolvedValue([user])
  const values = jest.fn().mockReturnValue({ returning })
  // first insert = users, second insert = userPasswords
  mockInsert
    .mockReturnValueOnce({ values })
    .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) })
}

beforeEach(() => jest.clearAllMocks())

// ── Successful registration ────────────────────────────────────────────────────

describe('valid new account', () => {
  it('returns 200 with ok: true', async () => {
    mockFindUser.mockResolvedValue(null)
    setupInsert()

    const res = await POST(makeReq({ email: 'new@example.com', password: 'securepass' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
  })

  it('inserts both a user row and a password row', async () => {
    mockFindUser.mockResolvedValue(null)
    setupInsert()

    await POST(makeReq({ email: 'new@example.com', password: 'securepass' }))

    expect(mockInsert).toHaveBeenCalledTimes(2)
  })
})

// ── Duplicate email ────────────────────────────────────────────────────────────

describe('already registered email', () => {
  it('returns 409 when email already exists', async () => {
    mockFindUser.mockResolvedValue({ id: 'u-existing' })

    const res = await POST(makeReq({ email: 'existing@example.com', password: 'securepass' }))

    expect(res.status).toBe(409)
  })

  it('does not insert when email is taken', async () => {
    mockFindUser.mockResolvedValue({ id: 'u-existing' })

    await POST(makeReq({ email: 'existing@example.com', password: 'securepass' }))

    expect(mockInsert).not.toHaveBeenCalled()
  })
})

// ── Rate limiting ─────────────────────────────────────────────────────────────

describe('rate limiting', () => {
  it('returns 429 when the IP has exceeded the request limit', async () => {
    const { rateLimit } = await import('@/lib/rate-limit')
    ;(rateLimit as jest.Mock).mockReturnValueOnce(false)

    const res = await POST(makeReq({ email: 'new@example.com', password: 'securepass' }))

    expect(res.status).toBe(429)
  })
})

// ── Input validation ──────────────────────────────────────────────────────────

describe('invalid input', () => {
  it('returns 400 for invalid email format', async () => {
    const res = await POST(makeReq({ email: 'notanemail', password: 'securepass' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await POST(makeReq({ email: 'new@example.com', password: 'short' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeReq({ password: 'securepass' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeReq({ email: 'new@example.com' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/register', {
      method: 'POST',
      body: 'not-json',
    }) as unknown as import('next/server').NextRequest

    const res = await POST(req)
    expect(res.status).toBe(400)
  })
})
