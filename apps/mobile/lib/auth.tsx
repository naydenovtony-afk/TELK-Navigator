import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'
import { setOnUnauthorized } from './api'

const TOKEN_KEY = 'telk_jwt'

function decodeRole(token: string): string {
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return payload.role ?? 'patient'
  } catch {
    return 'patient'
  }
}

type AuthState = {
  token: string | null
  role: string
  loading: boolean
  setToken: (token: string | null) => Promise<void>
}

const AuthContext = createContext<AuthState>({
  token: null,
  role: 'patient',
  loading: true,
  setToken: async () => {},
})

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [token, setTokenState] = useState<string | null>(null)
  const [role, setRole] = useState('patient')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((t) => {
        setTokenState(t)
        setRole(t ? decodeRole(t) : 'patient')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setOnUnauthorized(() => setToken(null))
  }, [])

  async function setToken(t: string | null): Promise<void> {
    if (t) {
      await SecureStore.setItemAsync(TOKEN_KEY, t)
      setRole(decodeRole(t))
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
      setRole('patient')
    }
    setTokenState(t)
  }

  return (
    <AuthContext.Provider value={{ token, role, loading, setToken }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
