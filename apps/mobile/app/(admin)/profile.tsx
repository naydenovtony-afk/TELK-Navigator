import React from 'react'
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native'
import { useRouter } from 'expo-router'
import { useAuth } from '../../lib/auth'

export default function AdminProfileScreen(): React.JSX.Element {
  const { setToken } = useAuth()
  const router = useRouter()

  async function handleSignOut(): Promise<void> {
    await setToken(null)
    router.replace('/sign-in')
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Профил</Text>
      </View>

      <View style={styles.content}>
        <View style={styles.adminBadge}>
          <Text style={styles.adminIcon}>🛡️</Text>
          <Text style={styles.adminLabel}>Администраторски акаунт</Text>
          <Text style={styles.adminSub}>Имате достъп до всички потребителски профили и случаи</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Бързи действия</Text>
          <TouchableOpacity style={styles.actionRow} onPress={() => router.replace('/(admin)')}>
            <Text style={styles.actionIcon}>👥</Text>
            <Text style={styles.actionLabel}>Потребители</Text>
            <Text style={styles.actionArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <Text style={styles.signOutText}>🚪  Изход от профила</Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  header: { backgroundColor: '#1A4A6B', padding: 16, paddingTop: 52 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  content: { padding: 16, gap: 16 },
  adminBadge: {
    backgroundColor: '#1A4A6B', borderRadius: 12, padding: 20, alignItems: 'center', gap: 8,
  },
  adminIcon: { fontSize: 40 },
  adminLabel: { color: '#fff', fontSize: 16, fontWeight: '700' },
  adminSub: { color: '#B8CDD8', fontSize: 13, textAlign: 'center', lineHeight: 18 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 4,
  },
  sectionTitle: { fontSize: 12, fontWeight: '600', color: '#3D5A73', textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 },
  actionRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, gap: 12 },
  actionIcon: { fontSize: 20 },
  actionLabel: { flex: 1, fontSize: 15, color: '#1C2B3A', fontWeight: '500' },
  actionArrow: { fontSize: 20, color: '#B8CDD8' },
  signOutButton: {
    borderWidth: 1, borderColor: '#8B1A1A33', borderRadius: 10,
    padding: 14, alignItems: 'center', backgroundColor: '#fff',
  },
  signOutText: { fontSize: 15, color: '#8B1A1A', fontWeight: '600' },
})
