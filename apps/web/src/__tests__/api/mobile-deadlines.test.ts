import { GET, POST } from '@/app/api/mobile/deadlines/route'
import { db } from '@/db'

jest.mock('@/lib/mobile-auth', () => ({ verifyMobileToken: jest.fn() }))
jest.mock('@/db', () => ({
  db: {
    query: {
      deadlines: { findMany: jest.fn() },
    },
    insert: jest.fn(),
  },
}))

import { verifyMobileToken } from '@/lib/mobile-auth'

const mockVerify = verifyMobileToken as jest.Mock
const mockFindMany = db.query.deadlines.findMany as jest.Mock
const mockInsert = db.insert as jest.Mock

const USER_ID = 'user-1'
const VALID_DUE_AT = new Date(Date.now() + 86400_000).toISOString()

const DEADLINE_ROW = {
  id: 'dl-1',
  userId: USER_ID,
  label: 'Краен срок',
  dueAt: new Date('2026-12-01'),
  isCompleted: false,
}

function makeReq(method: string, body?: object) {
  return new Request('http://localhost/api/mobile/deadlines', {
    method,
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as import('next/server').NextRequest
}

beforeEach(() => jest.clearAllMocks())

// ── GET /api/mobile/deadlines ─────────────────────────────────────────────────

describe('GET /api/mobile/deadlines', () => {
  it('returns 401 when token is missing', async () => {
    mockVerify.mockResolvedValue(null)
    expect((await GET(makeReq('GET'))).status).toBe(401)
  })

  it('returns the deadlines array for authenticated user', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindMany.mockResolvedValue([DEADLINE_ROW])

    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0]).toMatchObject({ id: 'dl-1', label: 'Краен срок', userId: USER_ID })
  })

  it('returns an empty array when user has no deadlines', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindMany.mockResolvedValue([])

    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

// ── POST /api/mobile/deadlines ────────────────────────────────────────────────

describe('POST /api/mobile/deadlines', () => {
  it('returns 401 when token is missing', async () => {
    mockVerify.mockResolvedValue(null)
    expect((await POST(makeReq('POST', { label: 'Test', dueAt: VALID_DUE_AT }))).status).toBe(401)
  })

  it('returns 400 when label is empty', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { label: '', dueAt: VALID_DUE_AT }))).status).toBe(400)
  })

  it('returns 400 when label is missing', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { dueAt: VALID_DUE_AT }))).status).toBe(400)
  })

  it('returns 400 when dueAt is not a valid date string', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { label: 'Test', dueAt: 'not-a-date' }))).status).toBe(400)
  })

  it('returns 400 when dueAt is missing', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { label: 'Test' }))).status).toBe(400)
  })

  it('creates a deadline and returns 201', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    const returning = jest.fn().mockResolvedValue([DEADLINE_ROW])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    const res = await POST(makeReq('POST', { label: 'Краен срок', dueAt: VALID_DUE_AT }))
    expect(res.status).toBe(201)
    expect((await res.json())).toHaveProperty('label', 'Краен срок')
  })

  it('inserts with correct userId', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    const returning = jest.fn().mockResolvedValue([DEADLINE_ROW])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    await POST(makeReq('POST', { label: 'Test', dueAt: VALID_DUE_AT }))
    expect(values).toHaveBeenCalledWith(expect.objectContaining({ userId: USER_ID, label: 'Test' }))
  })
})
