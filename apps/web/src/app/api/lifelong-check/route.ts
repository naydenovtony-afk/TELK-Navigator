import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { checkLifelongEligibility } from '@/lib/ai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const schema = z.object({
  percent: z.number().int().min(1).max(100),
  age: z.number().int().min(1).max(120),
  diagnosisDescription: z.string().min(3).max(500),
  isIrreversible: z.boolean(),
  isProgressive: z.boolean(),
  previousTelkYears: z.number().int().min(0).max(80).optional(),
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
    const result = await checkLifelongEligibility(parsed.data)
    return NextResponse.json(result)
  } catch {
    return NextResponse.json({ error: 'Грешка при генериране. Опитайте отново.' }, { status: 500 })
  }
}
