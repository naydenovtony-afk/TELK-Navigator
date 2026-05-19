import { NextRequest, NextResponse } from 'next/server'
import { verifyMobileToken } from '@/lib/mobile-auth'
import { generateAppeal } from '@/lib/ai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 30

const schema = z.object({
  receivedPercent:      z.number().int().min(0).max(100),
  expectedPercent:      z.number().int().min(1).max(100),
  diagnosisDescription: z.string().min(3).max(500),
  groundsForAppeal:     z.string().min(10).max(1000),
  missingDocuments:     z.string().max(500).optional(),
  applicantName:        z.string().min(1).max(100),
  telkCity:             z.string().min(1).max(100),
})

export async function POST(req: NextRequest) {
  const userId = await verifyMobileToken(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const appeal = await generateAppeal(parsed.data)
  return NextResponse.json({ appeal })
}
