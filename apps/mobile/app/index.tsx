import { Redirect } from 'expo-router'
import { View, ActivityIndicator } from 'react-native'
import { useAuth } from '../lib/auth'

export default function Index(): React.JSX.Element {
  const { token, loading } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' }}>
        <ActivityIndicator color="#1A4A6B" />
      </View>
    )
  }

  return <Redirect href={token ? '/(tabs)' : '/sign-in'} />
}
