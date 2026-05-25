import { GET, POST } from '@/app/api/mobile/documents/route'
import { db } from '@/db'

jest.mock('@/lib/mobile-auth', () => ({ verifyMobileToken: jest.fn() }))
jest.mock('@/lib/r2', () => ({
  getPublicUrl: jest.fn((key: string) => `https://cdn.example.com/${key}`),
}))
jest.mock('@/db', () => ({
  db: {
    query: {
      cases: { findMany: jest.fn(), findFirst: jest.fn() },
      documents: { findMany: jest.fn() },
    },
    insert: jest.fn(),
  },
}))

import { verifyMobileToken } from '@/lib/mobile-auth'

const mockVerify = verifyMobileToken as jest.Mock
const mockCasesFindMany = db.query.cases.findMany as jest.Mock
const mockCasesFindFirst = db.query.cases.findFirst as jest.Mock
const mockDocsFindMany = db.query.documents.findMany as jest.Mock
const mockInsert = db.insert as jest.Mock

const USER_ID = 'user-1'
const CASE_ID = '123e4567-e89b-12d3-a456-426614174000'

const CASE_ROW = { id: CASE_ID, userId: USER_ID, title: 'Моят случай' }

const DOC_ROW = {
  id: 'doc-1',
  caseId: CASE_ID,
  fileName: 'епикриза.pdf',
  fileKey: 'uploads/user-1/епикриза.pdf',
  mimeType: 'application/pdf',
  documentType: 'epicrisis',
  status: 'ready',
  uploadedAt: new Date(),
}

const VALID_POST_BODY = {
  caseId: CASE_ID,
  fileKey: 'uploads/user-1/doc.pdf',
  fileName: 'doc.pdf',
  mimeType: 'application/pdf',
}

function makeReq(method: string, body?: object) {
  return new Request('http://localhost/api/mobile/documents', {
    method,
    headers: { authorization: 'Bearer token', 'content-type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  }) as unknown as import('next/server').NextRequest
}

beforeEach(() => jest.clearAllMocks())

// ── GET /api/mobile/documents ─────────────────────────────────────────────────

describe('GET /api/mobile/documents', () => {
  it('returns 401 when token is missing', async () => {
    mockVerify.mockResolvedValue(null)
    expect((await GET(makeReq('GET'))).status).toBe(401)
  })

  it('returns empty array when user has no cases', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockCasesFindMany.mockResolvedValue([])

    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual([])
    expect(mockDocsFindMany).not.toHaveBeenCalled()
  })

  it('returns documents with caseTitle and fileUrl', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockCasesFindMany.mockResolvedValue([CASE_ROW])
    mockDocsFindMany.mockResolvedValue([DOC_ROW])

    const res = await GET(makeReq('GET'))
    expect(res.status).toBe(200)
    const json = await res.json()
    expect(json).toHaveLength(1)
    expect(json[0]).toHaveProperty('caseTitle', 'Моят случай')
    expect(json[0]).toHaveProperty('fileUrl')
    expect(json[0].fileUrl).toContain('uploads/user-1/епикриза.pdf')
  })

  it('does not expose fileKey directly in the response', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockCasesFindMany.mockResolvedValue([CASE_ROW])
    mockDocsFindMany.mockResolvedValue([DOC_ROW])

    const res = await GET(makeReq('GET'))
    const json = await res.json()
    expect(json[0]).not.toHaveProperty('fileKey')
  })
})

// ── POST /api/mobile/documents ────────────────────────────────────────────────

describe('POST /api/mobile/documents', () => {
  it('returns 401 when token is missing', async () => {
    mockVerify.mockResolvedValue(null)
    expect((await POST(makeReq('POST', VALID_POST_BODY))).status).toBe(401)
  })

  it('returns 400 when caseId is not a valid UUID', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { ...VALID_POST_BODY, caseId: 'not-a-uuid' }))).status).toBe(400)
  })

  it('returns 400 when fileName is empty', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { ...VALID_POST_BODY, fileName: '' }))).status).toBe(400)
  })

  it('returns 400 when documentType is an unknown value', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    expect((await POST(makeReq('POST', { ...VALID_POST_BODY, documentType: 'xray' }))).status).toBe(400)
  })

  it('returns 403 when case does not belong to user', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockCasesFindFirst.mockResolvedValue(null)

    expect((await POST(makeReq('POST', VALID_POST_BODY))).status).toBe(403)
  })

  it('creates a document record and returns 201', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockCasesFindFirst.mockResolvedValue(CASE_ROW)
    const returning = jest.fn().mockResolvedValue([DOC_ROW])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    const res = await POST(makeReq('POST', VALID_POST_BODY))
    expect(res.status).toBe(201)
    const json = await res.json()
    expect(json).toHaveProperty('id', 'doc-1')
    expect(json).toHaveProperty('caseTitle', 'Моят случай')
  })

  it('accepts valid documentType values', async () => {
    mockVerify.mockResolvedValue(USER_ID)
    mockCasesFindFirst.mockResolvedValue(CASE_ROW)
    const returning = jest.fn().mockResolvedValue([DOC_ROW])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    const res = await POST(makeReq('POST', { ...VALID_POST_BODY, documentType: 'epicrisis' }))
    expect(res.status).toBe(201)
  })
})
