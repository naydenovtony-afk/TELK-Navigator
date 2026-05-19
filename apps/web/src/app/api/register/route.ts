import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, userPasswords } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({
  email: z.string().email('Невалиден имейл адрес.'),
  password: z.string().min(8, 'Паролата трябва да е поне 8 символа.'),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Невалидни данни.' }, { status: 400 })
  }

  const { email, password } = parsed.data

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return NextResponse.json({ error: 'Вече съществува акаунт с този имейл.' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)

  const [user] = await db
    .insert(users)
    .values({ email, role: 'patient', locale: 'bg' })
    .returning()

  await db.insert(userPasswords).values({ userId: user.id, hash })

  return NextResponse.json({ ok: true })
}
