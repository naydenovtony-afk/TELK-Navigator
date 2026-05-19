import React, { useState, useEffect } from 'react'
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import * as WebBrowser from 'expo-web-browser'
import * as Google from 'expo-auth-session/providers/google'
import { useAuth } from '../lib/auth'
import { login, register, googleAuth, type AuthResponse } from '../lib/api'

WebBrowser.maybeCompleteAuthSession()

type Mode = 'login' | 'register'

export default function SignIn(): React.JSX.Element {
  const [mode, setMode] = useState<Mode>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const { setToken } = useAuth()
  const router = useRouter()

  const [, googleResponse, googlePrompt] = Google.useAuthRequest({
    webClientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
  })

  useEffect(() => {
    if (googleResponse?.type === 'success') {
      const accessToken = googleResponse.authentication?.accessToken
      if (accessToken) {
        setGoogleLoading(true)
        googleAuth(accessToken)
          .then(async ({ token, role }: AuthResponse) => {
            await setToken(token)
            router.replace(role === 'admin' ? '/(admin)' : '/(tabs)')
          })
          .catch((e: Error) => setError(e.message ?? 'Грешка при Google вход.'))
          .finally(() => setGoogleLoading(false))
      }
    } else if (googleResponse?.type === 'error') {
      setError('Google входът беше отказан.')
    }
  }, [googleResponse])

  function switchMode(next: Mode) {
    setMode(next)
    setError('')
    setPassword('')
    setConfirmPassword('')
  }

  async function handleSubmit(): Promise<void> {
    setError('')

    if (mode === 'register') {
      if (password.length < 8) {
        setError('Паролата трябва да е поне 8 символа.')
        return
      }
      if (password !== confirmPassword) {
        setError('Паролите не съвпадат.')
        return
      }
      setLoading(true)
      try {
        const { token } = await register(email.trim(), password)
        await setToken(token)
        router.replace('/(tabs)')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Грешка при регистрация.')
      } finally {
        setLoading(false)
      }
      return
    }

    setLoading(true)
    try {
      const { token, role } = await login(email.trim(), password)
      await setToken(token)
      router.replace(role === 'admin' ? '/(admin)' : '/(tabs)')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Невалиден имейл или парола.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.appName}>ТЕЛК Навигатор</Text>
          <Text style={styles.tagline}>Навигирайте процеса на ТЕЛК с увереност</Text>
        </View>

        {/* Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>
            {mode === 'login' ? 'Добре дошли' : 'Нов акаунт'}
          </Text>
          <Text style={styles.cardSubtitle}>
            {mode === 'login'
              ? 'Влезте с вашия имейл и парола'
              : 'Създайте акаунт с имейл и парола'}
          </Text>

          {/* Google */}
          <TouchableOpacity
            style={styles.googleBtn}
            onPress={() => { setError(''); void googlePrompt() }}
            disabled={googleLoading}
            activeOpacity={0.8}
          >
            {googleLoading
              ? <ActivityIndicator color="#1C2B3A" />
              : <Text style={styles.googleText}>🔑  Вход с Google</Text>}
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerLabel}>или с имейл</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Tab toggle */}
          <View style={styles.tabs}>
            <TouchableOpacity
              style={[styles.tab, mode === 'login' && styles.tabActive]}
              onPress={() => switchMode('login')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'login' && styles.tabTextActive]}>
                Вход
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.tab, mode === 'register' && styles.tabActive]}
              onPress={() => switchMode('register')}
              activeOpacity={0.8}
            >
              <Text style={[styles.tabText, mode === 'register' && styles.tabTextActive]}>
                Регистрация
              </Text>
            </TouchableOpacity>
          </View>

          {/* Fields */}
          <View style={styles.fields}>
            <Text style={styles.label}>Имейл</Text>
            <TextInput
              style={styles.input}
              placeholder="вашият@имейл.bg"
              placeholderTextColor="#8BA3B4"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              value={email}
              onChangeText={setEmail}
            />

            <Text style={styles.label}>Парола</Text>
            <TextInput
              style={styles.input}
              placeholder={mode === 'register' ? 'Минимум 8 символа' : ''}
              placeholderTextColor="#8BA3B4"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
            />

            {mode === 'register' && (
              <>
                <Text style={styles.label}>Потвърди паролата</Text>
                <TextInput
                  style={styles.input}
                  placeholder=""
                  placeholderTextColor="#8BA3B4"
                  secureTextEntry
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                />
              </>
            )}
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
            onPress={handleSubmit}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.submitText}>
                {mode === 'register' ? 'Създай акаунт' : 'Вход с имейл'}
              </Text>
            )}
          </TouchableOpacity>

          <Text style={styles.gdpr}>
            С влизането си приемате условията за обработка на лични данни съгласно GDPR.
          </Text>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#E8F4F8' },
  scroll: { flexGrow: 1, justifyContent: 'center', padding: 24 },

  header: { alignItems: 'center', marginBottom: 24 },
  appName: { fontSize: 32, fontWeight: '700', color: '#1A4A6B', letterSpacing: -0.5 },
  tagline: { fontSize: 13, color: '#3D5A73', marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 24,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardTitle: { fontSize: 22, fontWeight: '700', color: '#1A4A6B', marginBottom: 4 },
  cardSubtitle: { fontSize: 13, color: '#3D5A73', marginBottom: 20 },

  googleBtn: {
    borderWidth: 1,
    borderColor: '#B8CDD8',
    borderRadius: 12,
    paddingVertical: 13,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  googleText: { fontSize: 15, color: '#1C2B3A', fontWeight: '500' },

  divider: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, gap: 8 },
  dividerLine: { flex: 1, height: 0.5, backgroundColor: '#B8CDD8' },
  dividerLabel: { fontSize: 12, color: '#3D5A73' },

  tabs: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#B8CDD8',
    overflow: 'hidden',
    marginBottom: 20,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  tabActive: { backgroundColor: '#1A4A6B' },
  tabText: { fontSize: 14, fontWeight: '600', color: '#3D5A73' },
  tabTextActive: { color: '#fff' },

  fields: { gap: 4, marginBottom: 4 },
  label: { fontSize: 13, color: '#3D5A73', marginBottom: 6, marginTop: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#B8CDD8',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1C2B3A',
    backgroundColor: '#fff',
  },

  errorBox: {
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FECACA',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginTop: 12,
    marginBottom: 4,
  },
  errorText: { fontSize: 13, color: '#8B1A1A' },

  submitBtn: {
    backgroundColor: '#1A4A6B',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 16,
  },
  submitBtnDisabled: { opacity: 0.5 },
  submitText: { color: '#fff', fontSize: 15, fontWeight: '600' },

  gdpr: { fontSize: 11, color: '#8BA3B4', textAlign: 'center', marginTop: 16, lineHeight: 16 },
})
