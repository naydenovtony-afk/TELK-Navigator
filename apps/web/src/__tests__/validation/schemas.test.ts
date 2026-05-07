import { z } from 'zod'

// ── Schemas mirrored from API routes ──────────────────────────────────────────

const caseCreateSchema = z.object({
  title: z.string().min(1).max(200),
})

const deadlineCreateSchema = z.object({
  label: z.string().min(1).max(300),
  dueAt: z.string().datetime(),
})

const DOCUMENT_TYPES = [
  'telk_decision', 'epicrisis', 'outpatient_sheet',
  'lab_results', 'imaging', 'specialist_opinion', 'other',
] as const

const documentCreateSchema = z.object({
  caseId: z.string().uuid(),
  fileKey: z.string().min(1),
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1),
  documentType: z.enum(DOCUMENT_TYPES).optional(),
})

// ── Case schema ───────────────────────────────────────────────────────────────

describe('caseCreateSchema', () => {
  it('accepts a valid title', () => {
    expect(caseCreateSchema.safeParse({ title: 'Моят случай' }).success).toBe(true)
  })

  it('rejects empty title', () => {
    expect(caseCreateSchema.safeParse({ title: '' }).success).toBe(false)
  })

  it('rejects title longer than 200 characters', () => {
    expect(caseCreateSchema.safeParse({ title: 'A'.repeat(201) }).success).toBe(false)
  })

  it('accepts title of exactly 200 characters', () => {
    expect(caseCreateSchema.safeParse({ title: 'A'.repeat(200) }).success).toBe(true)
  })

  it('rejects missing title field', () => {
    expect(caseCreateSchema.safeParse({}).success).toBe(false)
  })
})

// ── Deadline schema ───────────────────────────────────────────────────────────

describe('deadlineCreateSchema', () => {
  it('accepts valid label and ISO datetime', () => {
    const result = deadlineCreateSchema.safeParse({
      label: 'Подаване на документи',
      dueAt: new Date(Date.now() + 86400_000).toISOString(),
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty label', () => {
    expect(deadlineCreateSchema.safeParse({
      label: '',
      dueAt: new Date().toISOString(),
    }).success).toBe(false)
  })

  it('rejects label longer than 300 characters', () => {
    expect(deadlineCreateSchema.safeParse({
      label: 'A'.repeat(301),
      dueAt: new Date().toISOString(),
    }).success).toBe(false)
  })

  it('rejects non-ISO dueAt string', () => {
    expect(deadlineCreateSchema.safeParse({
      label: 'Краен срок',
      dueAt: '15-06-2026',
    }).success).toBe(false)
  })

  it('rejects missing dueAt', () => {
    expect(deadlineCreateSchema.safeParse({ label: 'Краен срок' }).success).toBe(false)
  })
})

// ── Document schema ───────────────────────────────────────────────────────────

describe('documentCreateSchema', () => {
  const valid = {
    caseId: '123e4567-e89b-12d3-a456-426614174000',
    fileKey: 'uploads/user-1/doc.pdf',
    fileName: 'решение.pdf',
    mimeType: 'application/pdf',
  }

  it('accepts a valid document without documentType', () => {
    expect(documentCreateSchema.safeParse(valid).success).toBe(true)
  })

  it('accepts a valid document with documentType', () => {
    expect(documentCreateSchema.safeParse({
      ...valid, documentType: 'telk_decision',
    }).success).toBe(true)
  })

  it('rejects an invalid documentType', () => {
    expect(documentCreateSchema.safeParse({
      ...valid, documentType: 'unknown_type',
    }).success).toBe(false)
  })

  it('rejects non-UUID caseId', () => {
    expect(documentCreateSchema.safeParse({
      ...valid, caseId: 'not-a-uuid',
    }).success).toBe(false)
  })

  it('rejects empty fileName', () => {
    expect(documentCreateSchema.safeParse({
      ...valid, fileName: '',
    }).success).toBe(false)
  })

  it('rejects fileName longer than 255 characters', () => {
    expect(documentCreateSchema.safeParse({
      ...valid, fileName: 'a'.repeat(256),
    }).success).toBe(false)
  })

  it('rejects missing caseId', () => {
    const { caseId: _, ...withoutCaseId } = valid
    expect(documentCreateSchema.safeParse(withoutCaseId).success).toBe(false)
  })

  it('accepts all valid documentType values', () => {
    DOCUMENT_TYPES.forEach((type) => {
      expect(documentCreateSchema.safeParse({
        ...valid, documentType: type,
      }).success).toBe(true)
    })
  })
})
