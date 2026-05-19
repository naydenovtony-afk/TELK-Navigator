/**
 * Test Scenario: Mobile Password Change
 * Covers current password verification, new password validation,
 * mismatch detection, and OAuth account handling.
 */

jest.mock('@/lib/mobile-auth', () => ({ verifyMobileToken: jest.fn() }))

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
  hash: jest.fn().mockResolvedValue('$2b$12$newhash'),
}))

jest.mock('@/db', () => ({
  db: {
    query: {
      userPasswords: { findFirst: jest.fn() },
    },
    update: jest.fn(),
  },
}))

import { PATCH } from '@/app/api/mobile/profile/password/route'
import { verifyMobileToken } from '@/lib/mobile-auth'
import bcrypt from 'bcryptjs'
import { db } from '@/db'

const mockVerify = verifyMobileToken as jest.Mock
const mockCompare = bcrypt.compare as jest.Mock
const mockFindPw = db.query.userPasswords.findFirst as jest.Mock
const mockUpdate = db.update as jest.Mock

const PW_ROW = { userId: 'u-1', hash: '$2b$12$currenthash' }

function makeReq(body: unknown, hasToken = true) {
  return new Request('http://localhost/api/mobile/profile/password', {
    method: 'PATCH',
    headers: {
      'content-type': 'application/json',
      ...(hasToken ? { authorization: 'Bearer mock.jwt.token' } : {}),
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

function setupUpdate() {
  const where = jest.fn().mockResolvedValue([])
  const set = jest.fn().mockReturnValue({ where })
  mockUpdate.mockReturnValue({ set })
}

beforeEach(() => {
  jest.clearAllMocks()
  mockVerify.mockResolvedValue('u-1')
})

// ── Successful password change ─────────────────────────────────────────────────

describe('valid current password and valid new password', () => {
  it('returns 200 with { ok: true }', async () => {
    mockFindPw.mockResolvedValue(PW_ROW)
    mockCompare.mockResolvedValue(true)
    setupUpdate()

    const res = await PATCH(makeReq({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
  })
})

// ── Unauthenticated request ────────────────────────────────────────────────────

describe('missing or invalid auth token', () => {
  it('returns 401 when the token is absent', async () => {
    mockVerify.mockResolvedValue(null)

    const res = await PATCH(makeReq({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    }, false))

    expect(res.status).toBe(401)
  })
})

// ── Wrong current password ─────────────────────────────────────────────────────

describe('incorrect current password', () => {
  it('returns 400 with the correct error message', async () => {
    mockFindPw.mockResolvedValue(PW_ROW)
    mockCompare.mockResolvedValue(false)

    const res = await PATCH(makeReq({
      currentPassword: 'WrongPassword',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json).toHaveProperty('error', 'Грешна текуща парола.')
  })

  it('does not update the password when current password is wrong', async () => {
    mockFindPw.mockResolvedValue(PW_ROW)
    mockCompare.mockResolvedValue(false)

    await PATCH(makeReq({
      currentPassword: 'WrongPassword',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    }))

    expect(mockUpdate).not.toHaveBeenCalled()
  })
})

// ── Passwords do not match ─────────────────────────────────────────────────────

describe('new password and confirm password mismatch', () => {
  it('returns 400 when confirmPassword differs from newPassword', async () => {
    const res = await PATCH(makeReq({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmPassword: 'DifferentPassword',
    }))

    expect(res.status).toBe(400)
  })
})

// ── New password too short ─────────────────────────────────────────────────────

describe('new password shorter than 8 characters', () => {
  it('returns 400 with validation error', async () => {
    const res = await PATCH(makeReq({
      currentPassword: 'OldPassword1',
      newPassword: 'short',
      confirmPassword: 'short',
    }))

    expect(res.status).toBe(400)
  })
})

// ── OAuth account (no local password) ─────────────────────────────────────────

describe('account linked to Google OAuth', () => {
  it('returns 400 when the user has no local password row', async () => {
    mockFindPw.mockResolvedValue(null)

    const res = await PATCH(makeReq({
      currentPassword: 'OldPassword1',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    }))
    const json = await res.json()

    expect(res.status).toBe(400)
    expect(json.error).toContain('Google')
  })
})

// ── Empty fields ───────────────────────────────────────────────────────────────

describe('empty fields', () => {
  it('returns 400 when currentPassword is empty', async () => {
    const res = await PATCH(makeReq({
      currentPassword: '',
      newPassword: 'NewPassword1',
      confirmPassword: 'NewPassword1',
    }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when all fields are empty', async () => {
    const res = await PATCH(makeReq({ currentPassword: '', newPassword: '', confirmPassword: '' }))

    expect(res.status).toBe(400)
  })
})
