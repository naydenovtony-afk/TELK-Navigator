import { POST } from '@/app/api/upload/presign/route'
import { auth } from '@/auth'

jest.mock('@/auth', () => ({ auth: jest.fn() }))
jest.mock('@/lib/r2', () => ({
  createPresignedUploadUrl: jest.fn(),
}))

import { createPresignedUploadUrl } from '@/lib/r2'

const mockAuth = auth as jest.Mock
const mockPresign = createPresignedUploadUrl as jest.Mock

const USER_SESSION = { user: { id: 'user-1' }, expires: '' } as any
const PRESIGN_RESULT = { key: 'uploads/user-1/doc.pdf', uploadUrl: 'https://r2.example.com/presigned' }

function makeReq(body: object) {
  return new Request('http://localhost/api/upload/presign', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  }) as any
}

const VALID_BODY = { fileName: 'test.pdf', mimeType: 'application/pdf', fileSize: 1024 * 1024 }

beforeEach(() => jest.clearAllMocks())

// ── Auth guard ────────────────────────────────────────────────────────────────

describe('auth guard', () => {
  it('returns 401 when session is missing', async () => {
    mockAuth.mockResolvedValue(null)
    expect((await POST(makeReq(VALID_BODY))).status).toBe(401)
  })

  it('does not call createPresignedUploadUrl when unauthenticated', async () => {
    mockAuth.mockResolvedValue(null)
    await POST(makeReq(VALID_BODY))
    expect(mockPresign).not.toHaveBeenCalled()
  })
})

// ── Input validation ──────────────────────────────────────────────────────────

describe('input validation', () => {
  it('returns 400 when fileName is empty', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    expect((await POST(makeReq({ ...VALID_BODY, fileName: '' }))).status).toBe(400)
  })

  it('returns 400 when mimeType is not an accepted type', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    expect((await POST(makeReq({ ...VALID_BODY, mimeType: 'image/gif' }))).status).toBe(400)
  })

  it('returns 400 when fileSize exceeds 20 MB', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    expect((await POST(makeReq({ ...VALID_BODY, fileSize: 20 * 1024 * 1024 + 1 }))).status).toBe(400)
  })

  it('returns 400 when fileSize is zero', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    expect((await POST(makeReq({ ...VALID_BODY, fileSize: 0 }))).status).toBe(400)
  })

  it('returns 400 when body is not valid JSON', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    const req = new Request('http://localhost/api/upload/presign', { method: 'POST', body: 'bad' }) as any
    expect((await POST(req)).status).toBe(400)
  })
})

// ── Accepted mime types ───────────────────────────────────────────────────────

describe('accepted mime types', () => {
  beforeEach(() => mockPresign.mockResolvedValue(PRESIGN_RESULT))

  it.each([
    ['application/pdf'],
    ['image/jpeg'],
    ['image/png'],
    ['image/webp'],
  ])('accepts %s', async (mimeType) => {
    mockAuth.mockResolvedValue(USER_SESSION)
    const res = await POST(makeReq({ ...VALID_BODY, mimeType }))
    expect(res.status).toBe(200)
  })
})

// ── Successful presign ────────────────────────────────────────────────────────

describe('successful presign', () => {
  it('returns key and uploadUrl', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockPresign.mockResolvedValue(PRESIGN_RESULT)

    const res = await POST(makeReq(VALID_BODY))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toHaveProperty('key', PRESIGN_RESULT.key)
    expect(json).toHaveProperty('uploadUrl', PRESIGN_RESULT.uploadUrl)
  })

  it('calls createPresignedUploadUrl with user id and file info', async () => {
    mockAuth.mockResolvedValue(USER_SESSION)
    mockPresign.mockResolvedValue(PRESIGN_RESULT)

    await POST(makeReq(VALID_BODY))

    expect(mockPresign).toHaveBeenCalledWith('user-1', 'test.pdf', 'application/pdf')
  })
})
