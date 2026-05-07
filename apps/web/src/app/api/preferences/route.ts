import { NextResponse } from 'next/server'
import { z } from 'zod'
import { auth } from '@/auth'
import { db } from '@/db'
import { userPreferences } from '@/db/schema'
import { eq } from 'drizzle-orm'

const TELK_SITUATIONS = ['preparing', 'hasDecision', 'appealing', 'helpingRelative'] as const
const DIAGNOSIS_CATEGORIES = [
  'respiratory', 'cardiovascular', 'neurological', 'musculoskeletal',
  'endocrine', 'psychiatric', 'oncological', 'renal', 'other',
] as const

const patchSchema = z.object({
  telkSituation: z.enum(TELK_SITUATIONS).nullable().optional(),
  mainDiagnosisCategory: z.enum(DIAGNOSIS_CATEGORIES).nullable().optional(),
  hasEpicrisis: z.boolean().nullable().optional(),
  telkExpiresAt: z.string().datetime().nullable().optional(),
})

export async function GET() {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const prefs = await db.query.userPreferences.findFirst({
    where: eq(userPreferences.userId, userId),
  })

  return NextResponse.json(prefs ?? null)
}

export async function PATCH(req: Request) {
  const session = await auth()
  const userId = session?.user?.id
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const { telkSituation, mainDiagnosisCategory, hasEpicrisis, telkExpiresAt } = parsed.data

  const updatedAt = new Date()

  const updateSet: Record<string, unknown> = { updatedAt }
  if (telkSituation !== undefined) updateSet.telkSituation = telkSituation
  if (mainDiagnosisCategory !== undefined) updateSet.mainDiagnosisCategory = mainDiagnosisCategory
  if (hasEpicrisis !== undefined) updateSet.hasEpicrisis = hasEpicrisis
  if (telkExpiresAt !== undefined) updateSet.telkExpiresAt = telkExpiresAt ? new Date(telkExpiresAt) : null

  await db
    .insert(userPreferences)
    .values({ userId, ...updateSet })
    .onConflictDoUpdate({
      target: userPreferences.userId,
      set: updateSet,
    })

  return NextResponse.json({ ok: true })
}
