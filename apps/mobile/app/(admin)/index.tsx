import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import { getAdminUsers, type AdminUser } from '../../lib/api'

export default function AdminUsersScreen(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function load(silent = false): Promise<void> {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const data = await getAdminUsers(token)
      setUsers(data)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [token])

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#1A4A6B" /></View>
  }

  const patients = users.filter((u) => u.role === 'patient')
  const admins = users.filter((u) => u.role === 'admin')

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Администрация</Text>
          <TouchableOpacity onPress={() => router.push('/(admin)/profile')} hitSlop={12}>
            <Text style={styles.profileBtn}>👤</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={styles.statNum}>{patients.length}</Text>
            <Text style={styles.statLabel}>пациенти</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{users.reduce((s, u) => s + u.caseCount, 0)}</Text>
            <Text style={styles.statLabel}>случая</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{admins.length}</Text>
            <Text style={styles.statLabel}>админи</Text>
          </View>
        </View>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={users}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true) }}
              tintColor="#1A4A6B"
            />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.row}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(item.name ?? item.email).charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.info}>
                  <Text style={styles.name}>{item.name ?? '—'}</Text>
                  <Text style={styles.email}>{item.email}</Text>
                </View>
                <View style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}>
                  <Text style={[styles.roleText, item.role === 'admin' && styles.roleTextAdmin]}>
                    {item.role === 'admin' ? 'Админ' : 'Пациент'}
                  </Text>
                </View>
              </View>
              <View style={styles.footer}>
                <Text style={styles.meta}>📁 {item.caseCount} случая</Text>
                <Text style={styles.meta}>
                  От {new Date(item.createdAt).toLocaleDateString('bg-BG')}
                </Text>
              </View>
            </View>
          )}
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' },
  header: { backgroundColor: '#1A4A6B', padding: 16, gap: 16 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  profileBtn: { fontSize: 22 },
  stats: { flexDirection: 'row', backgroundColor: '#ffffff15', borderRadius: 10, padding: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { color: '#fff', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#B8CDD8', fontSize: 11 },
  statDivider: { width: 0.5, backgroundColor: '#ffffff30', marginHorizontal: 8 },
  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 10, padding: 14,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 10,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#1A4A6B', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  email: { fontSize: 12, color: '#3D5A73' },
  roleBadge: {
    backgroundColor: '#E8F4F8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  roleBadgeAdmin: { backgroundColor: '#1A4A6B20' },
  roleText: { fontSize: 11, fontWeight: '600', color: '#3D5A73' },
  roleTextAdmin: { color: '#1A4A6B' },
  footer: { flexDirection: 'row', justifyContent: 'space-between' },
  meta: { fontSize: 12, color: '#7A95A8' },
  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },
})
