import { useState } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../lib/auth'
import { login } from '../lib/api'

export default function SignIn(): React.JSX.Element {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { setToken } = useAuth()
  const router = useRouter()

  async function handleSignIn(): Promise<void> {
    setError('')
    setLoading(true)
    try {
      const { token } = await login(email.trim(), password)
      await setToken(token)
      router.replace('/(tabs)')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка при вход')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.card}>
        <Text style={styles.title}>ТЕЛК Навигатор</Text>
        <Text style={styles.subtitle}>Вход в системата</Text>

        <TextInput
          style={styles.input}
          placeholder="Имейл"
          placeholderTextColor="#3D5A73"
          keyboardType="email-address"
          autoCapitalize="none"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Парола"
          placeholderTextColor="#3D5A73"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.button} onPress={handleSignIn} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Влез</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => router.push('/register')}>
          <Text style={styles.link}>Нямаш акаунт? Регистрирай се</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F4F8',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 24,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
  },
  title: {
    fontSize: 22,
    fontWeight: '500',
    color: '#1A4A6B',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#3D5A73',
    textAlign: 'center',
    marginBottom: 24,
  },
  input: {
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    borderRadius: 6,
    padding: 14,
    fontSize: 16,
    color: '#1C2B3A',
    marginBottom: 12,
  },
  error: {
    color: '#8B1A1A',
    fontSize: 14,
    marginBottom: 12,
  },
  button: {
    backgroundColor: '#1A4A6B',
    borderRadius: 6,
    padding: 14,
    alignItems: 'center',
    marginBottom: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  link: {
    color: '#0A7C7C',
    fontSize: 14,
    textAlign: 'center',
  },
})
