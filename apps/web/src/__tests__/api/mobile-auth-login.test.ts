/**
 * Test Scenario: Mobile Login
 * Tests all combinations of valid/invalid credentials per the QA test case matrix.
 */

jest.mock('jose', () => ({
  SignJWT: jest.fn().mockImplementation(() => ({
    setProtectedHeader: jest.fn().mockReturnThis(),
    setExpirationTime: jest.fn().mockReturnThis(),
    sign: jest.fn().mockResolvedValue('mock.jwt.token'),
  })),
}))

jest.mock('bcryptjs', () => ({ compare: jest.fn() }))

jest.mock('@/db', () => ({
  db: {
    query: {
      users: { findFirst: jest.fn() },
      userPasswords: { findFirst: jest.fn() },
    },
  },
}))

import { POST } from '@/app/api/mobile/auth/login/route'
import bcrypt from 'bcryptjs'
import { db } from '@/db'

const mockCompare = bcrypt.compare as jest.Mock
const mockFindUser = db.query.users.findFirst as jest.Mock
const mockFindPw = db.query.userPasswords.findFirst as jest.Mock

const VALID_USER = { id: 'u-1', email: 'patient@example.com', role: 'patient' }
const VALID_PW_ROW = { userId: 'u-1', hash: '$2b$12$hashedpassword' }

function makeReq(body: unknown) {
  return new Request('http://localhost/api/mobile/auth/login', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

beforeEach(() => jest.clearAllMocks())

// ── Valid credentials ──────────────────────────────────────────────────────────

describe('valid email and valid password', () => {
  it('returns 200 with token, userId, and role', async () => {
    mockFindUser.mockResolvedValue(VALID_USER)
    mockFindPw.mockResolvedValue(VALID_PW_ROW)
    mockCompare.mockResolvedValue(true)

    const res = await POST(makeReq({ email: 'patient@example.com', password: 'password123' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toHaveProperty('token', 'mock.jwt.token')
    expect(json).toHaveProperty('userId', 'u-1')
    expect(json).toHaveProperty('role', 'patient')
  })
})

// ── Invalid email ──────────────────────────────────────────────────────────────

describe('invalid email and valid password', () => {
  it('returns 401 when the account does not exist', async () => {
    mockFindUser.mockResolvedValue(null)

    const res = await POST(makeReq({ email: 'nobody@example.com', password: 'password123' }))

    expect(res.status).toBe(401)
  })
})

// ── Invalid password ───────────────────────────────────────────────────────────

describe('valid email and invalid password', () => {
  it('returns 401 when the password does not match', async () => {
    mockFindUser.mockResolvedValue(VALID_USER)
    mockFindPw.mockResolvedValue(VALID_PW_ROW)
    mockCompare.mockResolvedValue(false)

    const res = await POST(makeReq({ email: 'patient@example.com', password: 'wrongpassword' }))

    expect(res.status).toBe(401)
  })
})

// ── Both invalid ───────────────────────────────────────────────────────────────

describe('invalid email and invalid password', () => {
  it('returns 401 without querying passwords', async () => {
    mockFindUser.mockResolvedValue(null)

    const res = await POST(makeReq({ email: 'ghost@nowhere.com', password: 'wrongpassword' }))

    expect(res.status).toBe(401)
    expect(mockFindPw).not.toHaveBeenCalled()
  })
})

// ── Empty fields ───────────────────────────────────────────────────────────────

describe('empty fields', () => {
  it('returns 400 when both fields are empty strings', async () => {
    const res = await POST(makeReq({ email: '', password: '' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when only email is empty', async () => {
    const res = await POST(makeReq({ email: '', password: 'password123' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when only password is empty', async () => {
    const res = await POST(makeReq({ email: 'patient@example.com', password: '' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when body is missing entirely', async () => {
    const req = new Request('http://localhost/api/mobile/auth/login', {
      method: 'POST',
      body: 'not-json',
    }) as unknown as import('next/server').NextRequest

    const res = await POST(req)

    expect(res.status).toBe(400)
  })
})

// ── Format validation ──────────────────────────────────────────────────────────

describe('malformed input', () => {
  it('returns 400 when email has no @ symbol', async () => {
    const res = await POST(makeReq({ email: 'notanemail', password: 'password123' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when password is shorter than 8 characters', async () => {
    const res = await POST(makeReq({ email: 'patient@example.com', password: 'short' }))

    expect(res.status).toBe(400)
  })
})

// ── OAuth account (no local password) ─────────────────────────────────────────

describe('account linked to Google OAuth', () => {
  it('returns 401 when user exists but has no local password row', async () => {
    mockFindUser.mockResolvedValue(VALID_USER)
    mockFindPw.mockResolvedValue(null)

    const res = await POST(makeReq({ email: 'patient@example.com', password: 'password123' }))

    expect(res.status).toBe(401)
  })
})
