import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateAppeal } from '@/lib/ai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const schema = z.object({
  receivedPercent: z.number().int().min(0).max(100),
  expectedPercent: z.number().int().min(1).max(100),
  diagnosisDescription: z.string().min(3).max(500),
  groundsForAppeal: z.string().min(10).max(1000),
  missingDocuments: z.string().max(500).optional(),
  applicantName: z.string().min(1).max(100),
  telkCity: z.string().min(1).max(100),
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
    const appeal = await generateAppeal(parsed.data)
    return NextResponse.json({ appeal })
  } catch {
    return NextResponse.json({ error: 'Грешка при генериране. Опитайте отново.' }, { status: 500 })
  }
}
