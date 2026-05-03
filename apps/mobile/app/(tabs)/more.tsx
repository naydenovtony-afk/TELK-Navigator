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
        <Text style={styles.headerTitle}>Настройки</Text>
      </View>

      {/* Sign-out always visible at top — no scrolling required */}
      <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut} activeOpacity={0.7}>
        <Text style={styles.signOutIcon}>🚪</Text>
        <Text style={styles.signOutText}>Изход от профила</Text>
      </TouchableOpacity>

      <View style={styles.divider} />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionLabel}>ИНСТРУМЕНТИ</Text>
        <View style={styles.grid}>
          {TOOLS.map((tool) => (
            <TouchableOpacity
              key={tool.route}
              style={styles.toolCard}
              onPress={() => router.push(tool.route)}
              activeOpacity={0.75}
            >
              <Text style={styles.toolIcon}>{tool.icon}</Text>
              <Text style={styles.toolLabel}>{tool.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  header: { backgroundColor: '#1A4A6B', padding: 16, paddingTop: 52 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },

  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 14,
    padding: 18,
    gap: 14,
    borderWidth: 1.5,
    borderColor: '#CC2A2A40',
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  signOutIcon: { fontSize: 26 },
  signOutText: { fontSize: 18, fontWeight: '700', color: '#CC2A2A' },

  divider: { height: 1, backgroundColor: '#B8CDD8', marginHorizontal: 16, marginTop: 16 },

  scrollContent: { padding: 16, gap: 12 },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#7A95A8',
    letterSpacing: 1,
    marginBottom: 4,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  toolCard: {
    width: '47%',
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 22,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    gap: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  toolIcon: { fontSize: 34 },
  toolLabel: { fontSize: 14, fontWeight: '600', color: '#1C2B3A', textAlign: 'center', lineHeight: 20 },
})
