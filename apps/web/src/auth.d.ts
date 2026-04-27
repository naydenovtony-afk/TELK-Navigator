import type { DefaultSession } from 'next-auth'
import type { JWT } from 'next-auth/jwt'

declare module 'next-auth' {
  interface User {
    role?: string
    locale?: string
  }
  interface Session {
    user: {
      id: string
      role: string
      locale: string
    } & DefaultSession['user']
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    role?: string
    locale?: string
  }
}
