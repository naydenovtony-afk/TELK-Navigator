import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { predictScore } from '@/lib/ai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const schema = z.object({
  diagnosisDescription: z.string().min(3).max(500),
  functionalLimitations: z.array(z.string()).default([]),
  age: z.number().int().min(1).max(120),
  previousPercent: z.number().int().min(0).max(100).optional(),
  additionalContext: z.string().max(500).optional(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const result = await predictScore(parsed.data)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Грешка при генериране. Опитайте отново.' }, { status: 500 })
  }
}
