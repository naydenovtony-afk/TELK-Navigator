import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/auth'
import { db } from '@/db'
import { userPasswords } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({
  currentPassword: z.string().min(1),
  newPassword:     z.string().min(8, 'Новата парола трябва да е поне 8 символа'),
  confirmPassword: z.string().min(1),
}).refine((d) => d.newPassword === d.confirmPassword, {
  message: 'Паролите не съвпадат',
  path: ['confirmPassword'],
})

export async function PATCH(req: NextRequest) {
  const session = await auth()
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    const msg = parsed.error.errors[0]?.message ?? 'Невалидни данни'
    return NextResponse.json({ error: msg }, { status: 400 })
  }

  const { currentPassword, newPassword } = parsed.data

  const pw = await db.query.userPasswords.findFirst({
    where: eq(userPasswords.userId, session.user.id),
  })
  if (!pw) {
    return NextResponse.json(
      { error: 'Акаунтът е свързан с Google/OAuth и няма локална парола.' },
      { status: 400 },
    )
  }

  const valid = await bcrypt.compare(currentPassword, pw.hash)
  if (!valid) {
    return NextResponse.json({ error: 'Грешна текуща парола.' }, { status: 400 })
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await db.update(userPasswords).set({ hash: newHash }).where(eq(userPasswords.userId, session.user.id))

  return NextResponse.json({ ok: true })
}
