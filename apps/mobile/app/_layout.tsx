import { Stack } from 'expo-router'
import { LogBox } from 'react-native'
import { AuthProvider } from '../lib/auth'

LogBox.ignoreLogs(['Unable to activate keep awake'])

export default function RootLayout(): React.JSX.Element {
  return (
    <AuthProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </AuthProvider>
  )
}
