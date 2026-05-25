import { GET, POST } from '@/app/api/mobile/cases/route'
import { PATCH, DELETE } from '@/app/api/mobile/cases/[id]/route'
import { db } from '@/db'

jest.mock('@/lib/mobile-auth', () => ({ verifyMobileToken: jest.fn() }))
jest.mock('@/db', () => ({
  db: {
    query: {
      cases: { findMany: jest.fn(), findFirst: jest.fn() },
    },
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
}))

import { verifyMobileToken } from '@/lib/mobile-auth'

const mockVerify = verifyMobileToken as jest.Mock
const mockFindMany = db.query.cases.findMany as jest.Mock
const mockFindFirst = db.query.cases.findFirst as jest.Mock
const mockInsert = db.insert as jest.Mock
const mockUpdate = db.update as jest.Mock
const mockDelete = db.delete as jest.Mock

const USER_ID = 'user-1'
const CASE_ID = '123e4567-e89b-12d3-a456-426614174000'

const CASE_ROW = {
  id: CASE_ID,
  userId: USER_ID,
  title: 'Моят случай',
  status: 'active',
  caseType: 'initial',
  diagnoses: null,
  previousPercent: null,
  appealReason: null,
  commissionDecision: null,
  createdAt: new Date(),
}

function makeReq(method: string, body?: object) {
  return new Request(`http://localhost/api/mobile/cases`, {
    method,
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as import('next/server').NextRequest
}

function makeIdReq(method: string, body?: object) {
  return new Request(`http://localhost/api/mobile/cases/${CASE_ID}`, {
    method,
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as import('next/server').NextRequest
}

const idParams = { params: Promise.resolve({ id: CASE_ID }) }

beforeEach(() => jest.clearAllMocks())

// ── GET /api/mobile/cases ─────────────────────────────────────────────────────

describe('GET /api/mobile/cases', () => {
  it('returns 401 when token is missing', async () => {
    mockVerify.mockResolvedValue(null)
    expect((await GET(makeReq('GET'))).status).toBe(401)
  })

  it('returns the cases array for authenticated user', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindMany.mockResolvedValue([CASE_ROW])

    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0]).toHaveProperty('id', CASE_ID)
  })

  it('returns an empty array when user has no cases', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindMany.mockResolvedValue([])

    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
  })
})

// ── POST /api/mobile/cases ────────────────────────────────────────────────────

describe('POST /api/mobile/cases', () => {
  it('returns 401 when token is missing', async () => {
    mockVerify.mockResolvedValue(null)
    expect((await POST(makeReq('POST', { title: 'Test' }))).status).toBe(401)
  })

  it('returns 400 when title is empty', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { title: '' }))).status).toBe(400)
  })

  it('returns 400 when title exceeds 200 characters', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { title: 'A'.repeat(201) }))).status).toBe(400)
  })

  it('returns 400 when caseType is invalid', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { title: 'Test', caseType: 'unknown' }))).status).toBe(400)
  })

  it('returns 400 when previousPercent is out of range', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { title: 'Test', previousPercent: 150 }))).status).toBe(400)
  })

  it('creates a case and returns 201', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    const returning = jest.fn().mockResolvedValue([CASE_ROW])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    const res = await POST(makeReq('POST', { title: 'Моят случай', caseType: 'initial' }))
    expect(res.status).toBe(201)
    expect((await res.json())).toHaveProperty('title', 'Моят случай')
  })

  it('accepts valid optional fields', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    const returning = jest.fn().mockResolvedValue([CASE_ROW])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    const res = await POST(makeReq('POST', {
      title: 'Case',
      caseType: 'reexamination',
      previousPercent: 50,
      diagnoses: 'Диагноза',
    }))
    expect(res.status).toBe(201)
  })
})

// ── PATCH /api/mobile/cases/[id] ──────────────────────────────────────────────

describe('PATCH /api/mobile/cases/[id]', () => {
  it('returns 401 when token is missing', async () => {
    mockVerify.mockResolvedValue(null)
    expect((await PATCH(makeIdReq('PATCH', { status: 'closed' }), idParams)).status).toBe(401)
  })

  it('returns 404 when case does not belong to user', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindFirst.mockResolvedValue(null)
    expect((await PATCH(makeIdReq('PATCH', { status: 'closed' }), idParams)).status).toBe(404)
  })

  it('returns 400 when status is invalid', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindFirst.mockResolvedValue(CASE_ROW)
    expect((await PATCH(makeIdReq('PATCH', { status: 'invalid' }), idParams)).status).toBe(400)
  })

  it('updates and returns the case', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindFirst.mockResolvedValue(CASE_ROW)
    const updated = { ...CASE_ROW, status: 'closed' }
    const returning = jest.fn().mockResolvedValue([updated])
    const where = jest.fn().mockReturnValue({ returning })
    const set = jest.fn().mockReturnValue({ where })
    mockUpdate.mockReturnValue({ set })

    const res = await PATCH(makeIdReq('PATCH', { status: 'closed' }), idParams)
    expect(res.status).toBe(200)
    expect((await res.json()).status).toBe('closed')
  })
})

// ── DELETE /api/mobile/cases/[id] ─────────────────────────────────────────────

describe('DELETE /api/mobile/cases/[id]', () => {
  it('returns 401 when token is missing', async () => {
    mockVerify.mockResolvedValue(null)
    expect((await DELETE(makeIdReq('DELETE'), idParams)).status).toBe(401)
  })

  it('returns 404 when case does not belong to user', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindFirst.mockResolvedValue(null)
    expect((await DELETE(makeIdReq('DELETE'), idParams)).status).toBe(404)
  })

  it('deletes the case and returns 200', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockFindFirst.mockResolvedValue(CASE_ROW)
    const where = jest.fn().mockResolvedValue(undefined)
    mockDelete.mockReturnValue({ where })

    const res = await DELETE(makeIdReq('DELETE'), idParams)
    expect(res.status).toBe(200)
    expect(mockDelete).toHaveBeenCalledTimes(1)
  })
})
