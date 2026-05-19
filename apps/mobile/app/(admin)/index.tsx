import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, LayoutAnimation, Platform, UIManager, Alert,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import { getAdminUsers, deleteAdminUser, type AdminUser } from '../../lib/api'

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true)
}

export default function AdminUsersScreen(): React.JSX.Element {
  const { token, setToken } = useAuth()
  const insets = useSafeAreaInsets()
  const [users, setUsers] = useState<AdminUser[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'patient' | 'admin'>('all')
  const [deletingId, setDeletingId] = useState<string | null>(null)

  function handleSignOut(): void {
    Alert.alert(
      'Изход',
      'Сигурни ли сте, че искате да излезете от профила?',
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изход',
          style: 'destructive',
          onPress: async () => {
            await setToken(null)
          },
        },
      ],
    )
  }

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

  function toggleExpand(id: string): void {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    setExpandedId((prev) => (prev === id ? null : id))
  }

  function confirmDelete(user: AdminUser): void {
    Alert.alert(
      'Изтриване на акаунт',
      `Сигурни ли сте, че искате да изтриете акаунта на ${user.name ?? user.email}? Всички данни ще бъдат изтрити безвъзвратно.`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий',
          style: 'destructive',
          onPress: async () => {
            if (!token) return
            setDeletingId(user.id)
            try {
              await deleteAdminUser(token, user.id)
              LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
              setUsers((prev) => prev.filter((u) => u.id !== user.id))
              setExpandedId(null)
            } catch (e) {
              Alert.alert('Грешка', e instanceof Error ? e.message : 'Неуспешно изтриване.')
            } finally {
              setDeletingId(null)
            }
          },
        },
      ],
    )
  }

  if (loading) {
    return <View style={styles.center}><ActivityIndicator color="#1A4A6B" size="large" /></View>
  }

  const patients = users.filter((u) => u.role === 'patient')
  const admins = users.filter((u) => u.role === 'admin')
  const filtered = filter === 'all' ? users : users.filter((u) => u.role === filter)

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Администрация</Text>
          <TouchableOpacity onPress={handleSignOut} hitSlop={12}>
            <Text style={styles.signOutBtn}>Изход</Text>
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

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {(['all', 'patient', 'admin'] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
              {f === 'all' ? 'Всички' : f === 'patient' ? 'Пациенти' : 'Админи'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true) }}
              tintColor="#1A4A6B"
            />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const expanded = expandedId === item.id
            return (
              <View style={styles.card}>
                {/* Card header row */}
                <TouchableOpacity style={styles.cardHeader} onPress={() => toggleExpand(item.id)} activeOpacity={0.8}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>
                      {(item.name ?? item.email).charAt(0).toUpperCase()}
                    </Text>
                  </View>
                  <View style={styles.info}>
                    <Text style={styles.name}>{item.name ?? '—'}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                  </View>
                  <View style={styles.rightCol}>
                    <View style={[styles.roleBadge, item.role === 'admin' && styles.roleBadgeAdmin]}>
                      <Text style={[styles.roleText, item.role === 'admin' && styles.roleTextAdmin]}>
                        {item.role === 'admin' ? 'Админ' : 'Пациент'}
                      </Text>
                    </View>
                    <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
                  </View>
                </TouchableOpacity>

                {/* Meta row */}
                <View style={styles.metaRow}>
                  <Text style={styles.meta}>📁 {item.caseCount} случая</Text>
                  <Text style={styles.meta}>
                    Регистрация: {new Date(item.createdAt).toLocaleDateString('bg-BG')}
                  </Text>
                </View>

                {/* Expanded action buttons */}
                {expanded && (
                  <View style={styles.actions}>
                    <View style={styles.actionDivider} />
                    <View style={styles.actionGrid}>
                      <View style={[styles.actionChip, styles.chipInfo]}>
                        <Text style={styles.chipIcon}>📁</Text>
                        <Text style={styles.chipText}>{item.caseCount} случая</Text>
                      </View>
                      <View style={[styles.actionChip, item.role === 'admin' ? styles.chipAdmin : styles.chipPatient]}>
                        <Text style={styles.chipIcon}>{item.role === 'admin' ? '🛡️' : '🧑'}</Text>
                        <Text style={styles.chipText}>{item.role === 'admin' ? 'Администратор' : 'Пациент'}</Text>
                      </View>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Имейл</Text>
                      <Text style={styles.detailValue}>{item.email}</Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>Регистриран</Text>
                      <Text style={styles.detailValue}>
                        {new Date(item.createdAt).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </Text>
                    </View>
                    <View style={styles.detailRow}>
                      <Text style={styles.detailLabel}>ID</Text>
                      <Text style={[styles.detailValue, styles.detailMono]} numberOfLines={1}>{item.id}</Text>
                    </View>
                    <TouchableOpacity
                      style={styles.deleteBtn}
                      onPress={() => confirmDelete(item)}
                      disabled={deletingId === item.id}
                      activeOpacity={0.7}
                    >
                      {deletingId === item.id
                        ? <ActivityIndicator color="#8B1A1A" size="small" />
                        : <Text style={styles.deleteBtnText}>Изтрий акаунт</Text>}
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )
          }}
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
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  signOutBtn: { color: '#B8D8E8', fontSize: 14, fontWeight: '500' },
  stats: { flexDirection: 'row', backgroundColor: '#ffffff15', borderRadius: 10, padding: 12 },
  stat: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { color: '#fff', fontSize: 22, fontWeight: '700' },
  statLabel: { color: '#B8CDD8', fontSize: 11 },
  statDivider: { width: 0.5, backgroundColor: '#ffffff30', marginHorizontal: 8 },

  filterRow: {
    flexDirection: 'row', backgroundColor: '#fff',
    paddingHorizontal: 16, paddingVertical: 10, gap: 8,
    borderBottomWidth: 0.5, borderBottomColor: '#B8CDD8',
  },
  filterBtn: {
    flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center',
    backgroundColor: '#F0F6F9',
  },
  filterBtnActive: { backgroundColor: '#1A4A6B' },
  filterText: { fontSize: 13, fontWeight: '600', color: '#3D5A73' },
  filterTextActive: { color: '#fff' },

  list: { padding: 16, gap: 10 },
  card: {
    backgroundColor: '#fff', borderRadius: 12, overflow: 'hidden',
    borderWidth: 0.5, borderColor: '#B8CDD8',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
  },
  avatar: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: '#1A4A6B', justifyContent: 'center', alignItems: 'center',
  },
  avatarText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  info: { flex: 1, gap: 2 },
  name: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  email: { fontSize: 12, color: '#3D5A73' },
  rightCol: { alignItems: 'flex-end', gap: 4 },
  roleBadge: {
    backgroundColor: '#E8F4F8', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12,
  },
  roleBadgeAdmin: { backgroundColor: '#1A4A6B20' },
  roleText: { fontSize: 11, fontWeight: '600', color: '#3D5A73' },
  roleTextAdmin: { color: '#1A4A6B' },
  chevron: { fontSize: 11, color: '#B8CDD8' },

  metaRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    paddingHorizontal: 14, paddingBottom: 12,
  },
  meta: { fontSize: 12, color: '#7A95A8' },

  actions: { paddingHorizontal: 14, paddingBottom: 14, gap: 10 },
  actionDivider: { height: 0.5, backgroundColor: '#B8CDD8', marginBottom: 4 },
  actionGrid: { flexDirection: 'row', gap: 8 },
  actionChip: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingVertical: 10, paddingHorizontal: 12, borderRadius: 10,
  },
  chipInfo: { backgroundColor: '#E8F4F8' },
  chipAdmin: { backgroundColor: '#1A4A6B15' },
  chipPatient: { backgroundColor: '#1A6B3C15' },
  chipIcon: { fontSize: 16 },
  chipText: { fontSize: 13, fontWeight: '600', color: '#1C2B3A' },

  detailRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontSize: 12, color: '#7A95A8', fontWeight: '600' },
  detailValue: { fontSize: 12, color: '#1C2B3A', maxWidth: '65%', textAlign: 'right' },
  detailMono: { fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace', fontSize: 11 },

  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },

  deleteBtn: {
    marginTop: 4, borderWidth: 1, borderColor: '#8B1A1A', borderRadius: 8,
    paddingVertical: 9, alignItems: 'center',
  },
  deleteBtnText: { color: '#8B1A1A', fontSize: 13, fontWeight: '600' },
})
