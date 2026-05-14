import { GET, POST } from '@/app/api/documents/route'
import { auth } from '@/auth'
import { db } from '@/db'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/db', () => ({
  db: {
    query: {
      cases: { findFirst: jest.fn() },
      documents: { findMany: jest.fn() },
    },
    insert: jest.fn(),
  },
}))

const mockAuth = auth as jest.Mock
const mockCaseFindFirst = db.query.cases.findFirst as jest.Mock
const mockDocsFindMany = db.query.documents.findMany as jest.Mock
const mockInsert = db.insert as jest.Mock

const USER_SESSION = { user: { id: 'user-1' }, expires: '' } as any
const CASE_ID = '123e4567-e89b-12d3-a456-426614174000'
const CASE_ROW = { id: CASE_ID, userId: 'user-1', title: 'My Case' }

function makeGetReq(caseId?: string) {
  const url = new URL(`http://localhost/api/documents${caseId ? `?caseId=${caseId}` : ''}`)
  return Object.assign(new Request(url), { nextUrl: url }) as any
}

function makePostReq(body: object) {
  return new Request('http://localhost/api/documents', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

const VALID_BODY = {
  caseId: CASE_ID,
  fileKey: 'uploads/user-1/doc.pdf',
  fileName: 'решение.pdf',
  mimeType: 'application/pdf',
}

// ── GET /api/documents ─────────────────────────────────────────────────────────

describe('/api/documents GET', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET(makeGetReq(CASE_ID))

    expect(res.status).toBe(401)
  })

  it('returns 400 when caseId query param is missing', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)

    const res = await GET(makeGetReq())

    expect(res.status).toBe(400)
  })

  it('returns 404 when case does not belong to the authenticated user', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockCaseFindFirst.mockResolvedValue(null)

    const res = await GET(makeGetReq(CASE_ID))

    expect(res.status).toBe(404)
  })

  it('returns the documents array when case belongs to user', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockCaseFindFirst.mockResolvedValue(CASE_ROW)
    const fakeDocs = [{ id: 'd-1', caseId: CASE_ID, fileName: 'doc.pdf', status: 'ready' }]
    mockDocsFindMany.mockResolvedValue(fakeDocs)

    const res = await GET(makeGetReq(CASE_ID))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual(fakeDocs)
  })

  it('verifies case ownership before returning documents', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockCaseFindFirst.mockResolvedValue(CASE_ROW)
    mockDocsFindMany.mockResolvedValue([])

    await GET(makeGetReq(CASE_ID))

    expect(mockCaseFindFirst).toHaveBeenCalledTimes(1)
    expect(mockDocsFindMany).toHaveBeenCalledTimes(1)
  })
})

// ── POST /api/documents ────────────────────────────────────────────────────────

describe('/api/documents POST', () => {
  beforeEach(() => jest.clearAllMocks())

  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await POST(makePostReq(VALID_BODY))

    expect(res.status).toBe(401)
  })

  it('returns 400 when caseId is not a valid UUID', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)

    const res = await POST(makePostReq({ ...VALID_BODY, caseId: 'not-a-uuid' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when fileName is empty', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)

    const res = await POST(makePostReq({ ...VALID_BODY, fileName: '' }))

    expect(res.status).toBe(400)
  })

  it('returns 400 when documentType is not a known value', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)

    const res = await POST(makePostReq({ ...VALID_BODY, documentType: 'xray' }))

    expect(res.status).toBe(400)
  })

  it('returns 403 when case does not belong to the authenticated user', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockCaseFindFirst.mockResolvedValue(null)

    const res = await POST(makePostReq(VALID_BODY))

    expect(res.status).toBe(403)
  })

  it('creates a document record and returns 201', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockCaseFindFirst.mockResolvedValue(CASE_ROW)
    const newDoc = { id: 'd-new', ...VALID_BODY, status: 'ready' }
    const returning = jest.fn().mockResolvedValue([newDoc])
    const values = jest.fn().mockReturnValue({ returning })
    mockInsert.mockReturnValue({ values })

    const res = await POST(makePostReq(VALID_BODY))

    expect(res.status).toBe(201)
    expect(await res.json()).toEqual(newDoc)
    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ caseId: CASE_ID, fileName: 'решение.pdf' }),
    )
  })
})
