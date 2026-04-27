import NextAuth from 'next-auth'
import Google from 'next-auth/providers/google'
import { DrizzleAdapter } from '@auth/drizzle-adapter'
import { db } from '@/db'
import { users, accounts } from '@/db/schema'
import { eq } from 'drizzle-orm'

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
  }),
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token }) {
      if (token.sub && !token.role) {
        const dbUser = await db.query.users.findFirst({
          where: eq(users.id, token.sub),
        })
        if (dbUser) {
          token.role = dbUser.role
          token.locale = dbUser.locale
        }
      }
      return token
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.sub ?? '',
          role: (token.role as string) ?? 'patient',
          locale: (token.locale as string) ?? 'bg',
        },
      }
    },
  },
  pages: {
    signIn: '/sign-in',
    error: '/sign-in',
  },
})
