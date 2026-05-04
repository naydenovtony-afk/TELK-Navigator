import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity, Linking,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import { getCases, type Case } from '../../lib/api'

const STATUS_LABEL: Record<Case['status'], string> = {
  active: 'Активен',
  submitted: 'Подаден',
  closed: 'Затворен',
}
const STATUS_COLOR: Record<Case['status'], string> = {
  active: '#1A6B3C',
  submitted: '#7A5200',
  closed: '#3D5A73',
}

export default function CasesScreen(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  async function load(silent = false): Promise<void> {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      setCases(await getCases(token))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [token])

  if (loading) return <View style={s.center}><ActivityIndicator color="#1A4A6B" /></View>

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Моите случаи</Text>
      </View>
      {error ? <Text style={s.error}>{error}</Text> : (
        <FlatList
          data={cases}
          keyExtractor={(item) => item.id}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor="#1A4A6B" />}
          contentContainerStyle={cases.length === 0 ? s.empty : s.list}
          ListEmptyComponent={
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>📁</Text>
              <Text style={s.emptyTitle}>Все още нямате случаи</Text>
              <Text style={s.emptyBody}>
                Случаите следят целия ви ТЕЛК процес — документи, срокове и статус на едно място. Създайте първия си случай от уеб приложението.
              </Text>
              <TouchableOpacity
                style={s.emptyBtn}
                onPress={() => Linking.openURL('https://telk-navigator-web.vercel.app')}
                activeOpacity={0.75}
              >
                <Text style={s.emptyBtnText}>Отвори уеб приложението</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <Text style={s.caseTitle}>{item.title}</Text>
              <View style={s.row}>
                <View style={[s.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
                <Text style={[s.status, { color: STATUS_COLOR[item.status] }]}>{STATUS_LABEL[item.status]}</Text>
              </View>
              <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('bg-BG')}</Text>
            </View>
          )}
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' },
  header: { backgroundColor: '#1A4A6B', padding: 16, gap: 4 },
  back: { color: '#B8D8E8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, justifyContent: 'center', padding: 24 },
  emptyCard: {
    backgroundColor: '#fff', borderRadius: 20, padding: 28,
    alignItems: 'center', gap: 12,
    borderWidth: 0.5, borderColor: '#B8CDD8',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 6, shadowOffset: { width: 0, height: 2 },
  },
  emptyIcon: { fontSize: 52 },
  emptyTitle: { fontSize: 18, fontWeight: '800', color: '#1C2B3A', textAlign: 'center' },
  emptyBody: { fontSize: 15, color: '#3D5A73', textAlign: 'center', lineHeight: 22 },
  emptyBtn: {
    marginTop: 4, backgroundColor: '#1A4A6B', borderRadius: 12,
    paddingVertical: 14, paddingHorizontal: 24, alignItems: 'center', width: '100%',
  },
  emptyBtnText: { color: '#fff', fontSize: 15, fontWeight: '700' },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#B8CDD8', gap: 6 },
  caseTitle: { fontSize: 16, fontWeight: '600', color: '#1C2B3A' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  status: { fontSize: 14 },
  date: { fontSize: 13, color: '#3D5A73' },
  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },
})
