import { GET, POST } from '@/app/api/cases/route'
import { auth } from '@/auth'
import { db } from '@/db'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/db', () => ({
  db: {
    query: {
      cases: { findMany: jest.fn() },
    },
    insert: jest.fn(),
  },
}))

const mockAuth = auth as jest.Mock
const mockFindMany = db.query.cases.findMany as jest.Mock
const mockInsert = db.insert as jest.Mock

const USER_SESSION = { user: { id: 'user-1', role: 'patient' }, expires: '' } as any

// ── GET /api/cases ─────────────────────────────────────────────────────────────

describe('/api/cases GET', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('queries the database with the authenticated user id', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindMany.mockResolvedValue([])

    await GET()

    expect(mockFindMany).toHaveBeenCalledTimes(1)
  })

  it('returns the cases array from the database', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    const fakeCases = [{ id: 'c-1', title: 'Case 1', userId: 'user-1', status: 'active' }]
    mockFindMany.mockResolvedValue(fakeCases)

    const res = await GET()

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(fakeCases)
  })
})

// ── POST /api/cases ────────────────────────────────────────────────────────────

describe('/api/cases POST', () => {
  beforeEach(() => jest.clearAllMocks())

  function makeReq(body: object | string) {
    return new Request('http://localhost/api/cases', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: typeof body === 'string' ? body : JSON.stringify(body),
    }) as any
  }

  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(makeReq({ title: 'Case' }))

    expect(res.status).toBe(401)
  })

  it('returns 400 when title is empty', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)

    const res = await POST(makeReq({ title: '' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when title exceeds 200 characters', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)

    const res = await POST(makeReq({ title: 'A'.repeat(201) }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when body is not valid JSON', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    const req = new Request('http://localhost/api/cases', {
      method: 'POST',
      body: 'not-json',
    }) as any

    const res = await POST(req)

    expect(res.status).toBe(400)
  })

  it('inserts a case and returns 201 with the created record', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    const newCase = { id: 'c-new', title: 'New Case', userId: 'user-1', status: 'active' }
    const returning = jest.fn().mockResolvedValue([newCase])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    const res = await POST(makeReq({ title: 'New Case' }))

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(newCase)
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'New Case', userId: 'user-1' }),
    )
  })
})
