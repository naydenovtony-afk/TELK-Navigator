import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/db'
import { users } from '@/db/schema'
import { eq } from 'drizzle-orm'
import { SignJWT } from 'jose'

export const runtime = 'nodejs'

const EXPO_REDIRECT = 'exp://u.expo.dev/129b4918-6fc6-41c1-bb41-828b4edbcae8?channel-name=production'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(`${EXPO_REDIRECT}&error=no_code`)
  }

  const redirectUri = 'https://telk-navigator-web.vercel.app/api/mobile/auth/google-callback'

  const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  })

  if (!tokenRes.ok) {
    return NextResponse.redirect(`${EXPO_REDIRECT}&error=token_exchange_failed`)
  }

  const { access_token } = await tokenRes.json() as { access_token: string }

  const userRes = await fetch(
    `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${access_token}`,
  )
  if (!userRes.ok) {
    return NextResponse.redirect(`${EXPO_REDIRECT}&error=userinfo_failed`)
  }

  const googleUser = await userRes.json() as { email?: string; name?: string }
  if (!googleUser.email) {
    return NextResponse.redirect(`${EXPO_REDIRECT}&error=no_email`)
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

  return NextResponse.redirect(`${EXPO_REDIRECT}&token=${token}`)
}
