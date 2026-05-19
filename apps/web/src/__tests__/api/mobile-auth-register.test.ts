/**
 * Test Scenario: Mobile Registration
 * Covers new account creation, duplicate detection, and input validation.
 */

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token'),
  })),
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

import { POST } from '@/app/api/mobile/auth/register/route'
import { db } from '@/db'

const mockFindUser = db.query.users.findFirst as jest.Mock
const mockInsert = db.insert as jest.Mock

const NEW_USER = { id: 'u-new', email: 'new@example.com', role: 'patient' }

function makeReq(body: unknown) {
  return new Request('http://localhost/api/mobile/auth/register', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

function setupInsert(user = NEW_USER) {
  const returning = jest.fn().mockResolvedValue([user])
  const values = jest.fn().mockReturnValue({ returning })
  mockInsert
    .mockReturnValueOnce({ values })
    .mockReturnValueOnce({ values: jest.fn().mockResolvedValue([]) })
}

beforeEach(() => jest.clearAllMocks())

// ── Successful registration ────────────────────────────────────────────────────

describe('valid new account', () => {
  it('returns 201 with token and userId', async () => {
    mockFindUser.mockResolvedValue(null)
    setupInsert()

    const res = await POST(makeReq({ email: 'new@example.com', password: 'securepassword' }))
    const json = await res.json()

    expect(res.status).toBe(201)
    expect(json).toHaveProperty('token', 'mock.jwt.token')
    expect(json).toHaveProperty('userId', 'u-new')
  })
})

// ── Duplicate email ────────────────────────────────────────────────────────────

describe('already registered email', () => {
  it('returns 409 when the email already exists', async () => {
    mockFindUser.mockResolvedValue({ id: 'u-existing', email: 'new@example.com', role: 'patient' })

    const res = await POST(makeReq({ email: 'new@example.com', password: 'securepassword' }))
    const json = await res.json()

    expect(res.status).toBe(409)
    expect(json).toHaveProperty('error', 'Email already registered')
  })

  it('does not insert a new user when email is taken', async () => {
    mockFindUser.mockResolvedValue({ id: 'u-existing' })

    await POST(makeReq({ email: 'new@example.com', password: 'securepassword' }))

    expect(mockInsert).not.toHaveBeenCalled()
  })
})

// ── Empty fields ───────────────────────────────────────────────────────────────

describe('empty fields', () => {
  it('returns 400 when both fields are empty', async () => {
    const res = await POST(makeReq({ email: '', password: '' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when email is missing', async () => {
    const res = await POST(makeReq({ password: 'securepassword' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when password is missing', async () => {
    const res = await POST(makeReq({ email: 'new@example.com' }))

    expect(res.status).toBe(400)
  })
})

// ── Format validation ──────────────────────────────────────────────────────────

describe('malformed input', () => {
  it('returns 400 for invalid email format', async () => {
    const res = await POST(makeReq({ email: 'notvalid', password: 'securepassword' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await POST(makeReq({ email: 'new@example.com', password: 'short' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when body is not valid JSON', async () => {
    const req = new Request('http://localhost/api/mobile/auth/register', {
      method: 'POST',
      body: 'not-json',
    }) as unknown as import('next/server').NextRequest

    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})
