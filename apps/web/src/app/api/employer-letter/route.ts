import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { generateEmployerLetter } from '@/lib/ai'
import { z } from 'zod'

export const runtime = 'nodejs'
export const maxDuration = 60

const schema = z.object({
  percent: z.number().int().min(50).max(100),
  employeeName: z.string().min(1).max(100),
  employerName: z.string().min(1).max(200),
  accommodations: z.array(z.enum(['leave', 'hours', 'dismissal', 'adaptation', 'parking'])).min(1),
  notes: z.string().max(500).optional(),
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
    const letter = await generateEmployerLetter(parsed.data)
    return NextResponse.json({ letter })
  } catch {
    return NextResponse.json({ error: 'Грешка при генериране. Опитайте отново.' }, { status: 500 })
  }
}
