jest.mock('@/auth', () => ({ auth: jest.fn() }))

jest.mock('@/db', () => ({
  db: {
    query: {
      userPreferences: { findFirst: jest.fn() },
    },
    insert: jest.fn(),
  },
}))

import { GET, PATCH } from '@/app/api/preferences/ai-results/route'
import { auth } from '@/auth'
import { db } from '@/db'
import { NextRequest } from 'next/server'

const mockAuth = auth as jest.Mock
const mockFindFirst = db.query.userPreferences.findFirst as jest.Mock
const mockInsert = db.insert as jest.Mock

function makeInsertChain() {
  const onConflictDoUpdate = jest.fn().mockResolvedValue([])
  const values = jest.fn().mockReturnValue({ onConflictDoUpdate })
  mockInsert.mockReturnValue({ values })
  return { values, onConflictDoUpdate }
}

function makePatchReq(body: unknown) {
  return new NextRequest('http://localhost/api/preferences/ai-results', {
    method: 'PATCH',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  })
}

beforeEach(() => jest.clearAllMocks())

// ── GET ───────────────────────────────────────────────────────────────────────

describe('GET /api/preferences/ai-results', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await GET()

    expect(res.status).toBe(401)
  })

  it('returns empty object when no preferences row exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    mockFindFirst.mockResolvedValue(null)

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({})
  })

  it('returns aiResults when a row exists', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    mockFindFirst.mockResolvedValue({ aiResults: { scorePredictor: 'result-data' } })

    const res = await GET()
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ scorePredictor: 'result-data' })
  })

  it('returns empty object when aiResults column is null', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    mockFindFirst.mockResolvedValue({ aiResults: null })

    const res = await GET()
    const json = await res.json()

    expect(json).toEqual({})
  })
})

// ── PATCH ─────────────────────────────────────────────────────────────────────

describe('PATCH /api/preferences/ai-results', () => {
  it('returns 401 when not authenticated', async () => {
    mockAuth.mockResolvedValue(null)

    const res = await PATCH(makePatchReq({ appeal: 'text' }))

    expect(res.status).toBe(401)
  })

  it('returns 400 when body is not valid JSON', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })

    const req = new NextRequest('http://localhost/api/preferences/ai-results', {
      method: 'PATCH',
      body: 'not-json',
    })

    const res = await PATCH(req)

    expect(res.status).toBe(400)
  })

  it('returns 200 with ok: true on a valid upsert', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    mockFindFirst.mockResolvedValue(null)
    makeInsertChain()

    const res = await PATCH(makePatchReq({ scorePredictor: 'data' }))
    const json = await res.json()

    expect(res.status).toBe(200)
    expect(json).toEqual({ ok: true })
  })

  it('merges new keys with existing aiResults', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    mockFindFirst.mockResolvedValue({ aiResults: { appeal: 'old-appeal' } })
    const { values } = makeInsertChain()

    await PATCH(makePatchReq({ scorePredictor: 'new-score' }))

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({
        aiResults: { appeal: 'old-appeal', scorePredictor: 'new-score' },
      })
    )
  })

  it('overwrites an existing key when the same key is patched', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    mockFindFirst.mockResolvedValue({ aiResults: { appeal: 'old' } })
    const { values } = makeInsertChain()

    await PATCH(makePatchReq({ appeal: 'updated' }))

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ aiResults: { appeal: 'updated' } })
    )
  })

  it('sets a key to null when null is patched (clear behaviour)', async () => {
    mockAuth.mockResolvedValue({ user: { id: 'u-1' } })
    mockFindFirst.mockResolvedValue({ aiResults: { appeal: 'text', scorePredictor: 'score' } })
    const { values } = makeInsertChain()

    await PATCH(makePatchReq({ appeal: null }))

    expect(values).toHaveBeenCalledWith(
      expect.objectContaining({ aiResults: { appeal: null, scorePredictor: 'score' } })
    )
  })
})
