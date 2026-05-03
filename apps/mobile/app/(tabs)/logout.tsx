import React, { useEffect } from 'react'
import { View, ActivityIndicator } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'

export default function LogoutScreen(): React.JSX.Element {
  const { setToken } = useAuth()
  const router = useRouter()

  useEffect(() => {
    setToken(null).then(() => router.replace('/sign-in'))
  }, [])

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' }}>
      <ActivityIndicator color="#1A4A6B" />
    </View>
  )
}
