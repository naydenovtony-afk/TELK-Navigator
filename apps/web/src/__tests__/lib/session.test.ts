import { isAdmin } from '@/lib/session'
import type { Session } from 'next-auth'

function makeSession(role?: string): Session {
  return {
    user: { id: 'user-1', name: 'Test', email: 'test@test.com', role } as Session['user'] & { role?: string },
    expires: new Date(Date.now() + 3600_000).toISOString(),
  }
}

describe('isAdmin', () => {
  it('returns false for null session', () => {
    expect(isAdmin(null)).toBe(false)
  })

  it('returns false for patient role', () => {
    expect(isAdmin(makeSession('patient'))).toBe(false)
  })

  it('returns false for undefined role', () => {
    expect(isAdmin(makeSession(undefined))).toBe(false)
  })

  it('returns false for unknown role', () => {
    expect(isAdmin(makeSession('moderator'))).toBe(false)
  })

  it('returns true for admin role', () => {
    expect(isAdmin(makeSession('admin'))).toBe(true)
  })
})
