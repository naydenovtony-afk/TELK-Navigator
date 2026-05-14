import { GET } from '@/app/api/admin/users/route'
import { auth } from '@/auth'
import { db } from '@/db'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/db', () => ({
  db: {
    query: {
      users: { findMany: jest.fn() },
    },
  },
}))

const mockAuth = auth as jest.Mock
const mockUsersFindMany = db.query.users.findMany as jest.Mock

// ── GET /api/admin/users ───────────────────────────────────────────────────────

describe('/api/admin/users GET', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 403 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(403)
  })

  it('returns 403 for a patient role user', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'patient' }, expires: '' } as any)

    const res = await GET()

    expect(res.status).toBe(403)
  })

  it('returns 403 for an unrecognised role', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'moderator' }, expires: '' } as any)

    const res = await GET()

    expect(res.status).toBe(403)
  })

  it('returns the full users list for an admin', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-admin', role: 'admin' }, expires: '' } as any)
    const fakeUsers = [
      { id: 'u-1', name: 'Alice', email: 'alice@example.com', role: 'patient', createdAt: new Date().toISOString() },
      { id: 'u-admin', name: 'Bob', email: 'bob@example.com', role: 'admin', createdAt: new Date().toISOString() },
    ]
    mockUsersFindMany.mockResolvedValue(fakeUsers)

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(fakeUsers)
    expect(mockUsersFindMany).toHaveBeenCalledTimes(1)
  })

  it('does not query the database for non-admin users', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1', role: 'patient' }, expires: '' } as any)

    await GET()

    expect(mockUsersFindMany).not.toHaveBeenCalled()
  })
})
