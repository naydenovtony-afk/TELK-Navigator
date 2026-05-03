import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'

const TOOLS = [
  { icon: '✉️', label: 'Писмо до\nработодател', route: '/employer-letter' },
  { icon: '🏥', label: 'Пожизнена\nпомощ', route: '/lifelong' },
  { icon: '📊', label: 'Прогноза\nза оценка', route: '/score' },
  { icon: '⚖️', label: 'Обжалване', route: '/appeal' },
] as const

export default function MoreScreen(): React.JSX.Element {
  const router = useRouter()
  const { setToken } = useAuth()

  function handleSignOut(): void {
    setToken(null)
    router.replace('/sign-in')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Инструменти</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.route}
              style={styles.toolCard}
              onPress={() => router.push(tool.route)}
            >
              <Text style={styles.toolIcon}>{tool.icon}</Text>
              <Text style={styles.toolLabel}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.divider} />

        <View style={styles.profileCard}>
          <Text style={styles.profileLabel}>Акаунт</Text>
          <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
            <Text style={styles.signOutText}>🚪  Изход от профила</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  header: { backgroundColor: '#1A4A6B', padding: 16, paddingTop: 52 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { padding: 16, gap: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    gap: 10,
  },
  toolIcon: { fontSize: 32 },
  toolLabel: { fontSize: 13, fontWeight: '500', color: '#1C2B3A', textAlign: 'center', lineHeight: 18 },
  divider: { height: 0.5, backgroundColor: '#B8CDD8' },
  profileCard: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 12,
  },
  profileLabel: { fontSize: 12, fontWeight: '600', color: '#3D5A73', textTransform: 'uppercase', letterSpacing: 0.5 },
  signOutButton: {
    borderWidth: 1, borderColor: '#8B1A1A33', borderRadius: 8,
    padding: 13, alignItems: 'center',
  },
  signOutText: { fontSize: 15, color: '#8B1A1A', fontWeight: '500' },
})
