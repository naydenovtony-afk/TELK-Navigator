import { GET, POST } from '@/app/api/deadlines/route'
import { PATCH, DELETE } from '@/app/api/deadlines/[id]/route'
import { auth } from '@/auth'
import { db } from '@/db'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/db', () => ({
  db: {
    query: {
      deadlines: { findMany: jest.fn(), findFirst: jest.fn() },
    },
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

const mockAuth = auth as jest.Mock
const mockFindMany = db.query.deadlines.findMany as jest.Mock
const mockFindFirst = db.query.deadlines.findFirst as jest.Mock
const mockInsert = db.insert as jest.Mock
const mockUpdate = db.update as jest.Mock
const mockDelete = db.delete as jest.Mock

const USER_SESSION = { user: { id: 'user-1' }, expires: '' } as any
const DEADLINE_ID = '123e4567-e89b-12d3-a456-426614174001'
const DEADLINE_ROW = { id: DEADLINE_ID, userId: 'user-1', label: 'Краен срок', dueAt: new Date('2026-12-01'), isCompleted: false }
const VALID_DUE_AT = new Date(Date.now() + 86400_000).toISOString()

function makePostReq(body: object) {
  return new Request('http://localhost/api/deadlines', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

function makePatchReq(body: object) {
  return new Request(`http://localhost/api/deadlines/${DEADLINE_ID}`, {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

function makeDeleteReq() {
  return new Request(`http://localhost/api/deadlines/${DEADLINE_ID}`, {
    method: 'DELETE',
  }) as any
}

const idParams = { params: Promise.resolve({ id: DEADLINE_ID }) }

beforeEach(() => jest.clearAllMocks())

// ── GET /api/deadlines ────────────────────────────────────────────────────────

describe('GET /api/deadlines', () => {
  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)
    expect((await GET()).status).toBe(401)
  })

  it('returns the deadlines array for authenticated user', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindMany.mockResolvedValue([DEADLINE_ROW])

    const res = await GET()
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0]).toMatchObject({ id: DEADLINE_ID, label: 'Краен срок', userId: 'user-1' })
  })

  it('queries only the authenticated user deadlines', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindMany.mockResolvedValue([])

    await GET()
    expect(mockFindMany).toHaveBeenCalledTimes(1)
  })
})

// ── POST /api/deadlines ───────────────────────────────────────────────────────

describe('POST /api/deadlines', () => {
  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)
    expect((await POST(makePostReq({ label: 'Test', dueAt: VALID_DUE_AT }))).status).toBe(401)
  })

  it('returns 400 when label is empty', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    expect((await POST(makePostReq({ label: '', dueAt: VALID_DUE_AT }))).status).toBe(400)
  })

  it('returns 400 when label exceeds 300 characters', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    expect((await POST(makePostReq({ label: 'A'.repeat(301), dueAt: VALID_DUE_AT }))).status).toBe(400)
  })

  it('returns 400 when dueAt is not a valid ISO datetime', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    expect((await POST(makePostReq({ label: 'Test', dueAt: '01-01-2027' }))).status).toBe(400)
  })

  it('returns 400 when body is not valid JSON', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    const req = new Request('http://localhost/api/deadlines', { method: 'POST', body: 'bad' }) as any
    expect((await POST(req)).status).toBe(400)
  })

  it('inserts a deadline and returns 201', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    const returning = jest.fn().mockResolvedValue([DEADLINE_ROW])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    const res = await POST(makePostReq({ label: 'Краен срок', dueAt: VALID_DUE_AT }))
    expect(res.status).toBe(201)
    expect(await res.json()).toMatchObject({ id: DEADLINE_ID, label: 'Краен срок' })
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ label: 'Краен срок', userId: 'user-1' }))
  })
})

// ── PATCH /api/deadlines/[id] ─────────────────────────────────────────────────

describe('PATCH /api/deadlines/[id]', () => {
  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)
    expect((await PATCH(makePatchReq({ isCompleted: true }), idParams)).status).toBe(401)
  })

  it('returns 404 when deadline does not belong to user', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindFirst.mockResolvedValue(null)
    expect((await PATCH(makePatchReq({ isCompleted: true }), idParams)).status).toBe(404)
  })

  it('returns 400 for invalid patch body', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindFirst.mockResolvedValue(DEADLINE_ROW)
    expect((await PATCH(makePatchReq({ isCompleted: 'yes' }), idParams)).status).toBe(400)
  })

  it('updates and returns the deadline', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindFirst.mockResolvedValue(DEADLINE_ROW)
    const updated = { ...DEADLINE_ROW, isCompleted: true }
    const returning = jest.fn().mockResolvedValue([updated])
    const where = jest.fn().mockReturnValue({ returning })
    const set = jest.fn().mockReturnValue({ where })
    mockUpdate.mockReturnValue({ set })

    const res = await PATCH(makePatchReq({ isCompleted: true }), idParams)
    expect(res.status).toBe(200)
    expect((await res.json()).isCompleted).toBe(true)
  })

  it('accepts partial update with only label', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindFirst.mockResolvedValue(DEADLINE_ROW)
    const returning = jest.fn().mockResolvedValue([DEADLINE_ROW])
    const where = jest.fn().mockReturnValue({ returning })
    const set = jest.fn().mockReturnValue({ where })
    mockUpdate.mockReturnValue({ set })

    const res = await PATCH(makePatchReq({ label: 'Нов срок' }), idParams)
    expect(res.status).toBe(200)
  })
})

// ── DELETE /api/deadlines/[id] ────────────────────────────────────────────────

describe('DELETE /api/deadlines/[id]', () => {
  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)
    expect((await DELETE(makeDeleteReq(), idParams)).status).toBe(401)
  })

  it('returns 404 when deadline does not belong to user', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindFirst.mockResolvedValue(null)
    expect((await DELETE(makeDeleteReq(), idParams)).status).toBe(404)
  })

  it('deletes and returns 204', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockFindFirst.mockResolvedValue(DEADLINE_ROW)
    const where = jest.fn().mockResolvedValue(undefined)
    mockDelete.mockReturnValue({ where })

    const res = await DELETE(makeDeleteReq(), idParams)
    expect(res.status).toBe(204)
    expect(mockDelete).toHaveBeenCalledTimes(1)
  })
})
