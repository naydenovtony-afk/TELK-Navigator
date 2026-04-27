import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users, userPasswords } from '@/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { SignJWT } from 'jose'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { email, password } = parsed.data

  const existing = await db.query.users.findFirst({ where: eq(users.email, email) })
  if (existing) {
    return NextResponse.json({ error: 'Email already registered' }, { status: 409 })
  }

  const hash = await bcrypt.hash(password, 12)

  const [user] = await db
    .insert(users)
    .values({ email, role: 'patient', locale: 'bg' })
    .returning()

  await db.insert(userPasswords).values({ userId: user.id, hash })

  const token = await new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET!))

  return NextResponse.json({ token, userId: user.id }, { status: 201 })
}
