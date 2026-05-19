import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignJWT } from 'jose'
import { z } from 'zod'

export const runtime = 'nodejs'

const schema = z.object({
  accessToken: z.string().min(1),
})

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid input' }, { status: 400 })
  }

  const { accessToken } = parsed.data

  const googleRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${accessToken}`,
  )
  if (!googleRes.ok) {
    return NextResponse.json({ error: 'Invalid Google token' }, { status: 401 })
  }

  const googleUser = await googleRes.json() as { email?: string; name?: string; picture?: string }
  if (!googleUser.email) {
    return NextResponse.json({ error: 'Google account has no email' }, { status: 401 })
  }

  let user = await db.query.users.findFirst({ where: eq(users.email, googleUser.email) })

  if (!user) {
    const [created] = await db
      .insert(users)
      .values({ email: googleUser.email, name: googleUser.name ?? null, role: 'patient', locale: 'bg' })
      .returning()
    user = created
  }

  const token = await new SignJWT({ sub: user.id, role: user.role })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('30d')
    .sign(new TextEncoder().encode(process.env.NEXTAUTH_SECRET!))

  return NextResponse.json({ token, userId: user.id, role: user.role })
}
