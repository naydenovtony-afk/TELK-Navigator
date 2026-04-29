import React, { createContext, useContext, useEffect, useState } from 'react'
import * as SecureStore from 'expo-secure-store'

const TOKEN_KEY = 'telk_jwt'

type AuthState = {
  token: string | null
  loading: boolean
  setToken: (token: string | null) => Promise<void>
}

const AuthContext = createContext<AuthState>({ token: null, loading: true, setToken: async () => {} })

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [token, setTokenState] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    SecureStore.getItemAsync(TOKEN_KEY)
      .then((t) => setTokenState(t))
      .finally(() => setLoading(false))
  }, [])

  async function setToken(t: string | null): Promise<void> {
    if (t) {
      await SecureStore.setItemAsync(TOKEN_KEY, t)
    } else {
      await SecureStore.deleteItemAsync(TOKEN_KEY)
    }
    setTokenState(t)
  }

  return <AuthContext.Provider value={{ token, loading, setToken }}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthState {
  return useContext(AuthContext)
}
