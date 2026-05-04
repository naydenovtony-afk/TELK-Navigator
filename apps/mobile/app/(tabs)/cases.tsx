import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl, TouchableOpacity,
} from 'react-native'
import { useRouter } from 'expo-router'
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
      <View style={s.header}>
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
          ListEmptyComponent={<Text style={s.emptyText}>Нямате добавени случаи.{'\n'}Използвайте уеб приложението, за да създадете случай.</Text>}
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
  header: { backgroundColor: '#1A4A6B', padding: 16, paddingTop: 52, gap: 4 },
  back: { color: '#B8D8E8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 20, fontWeight: '700' },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, justifyContent: 'center', padding: 32 },
  emptyText: { color: '#3D5A73', textAlign: 'center', fontSize: 16, lineHeight: 24 },
  card: { backgroundColor: '#fff', borderRadius: 12, padding: 16, borderWidth: 0.5, borderColor: '#B8CDD8', gap: 6 },
  caseTitle: { fontSize: 16, fontWeight: '600', color: '#1C2B3A' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 9, height: 9, borderRadius: 5 },
  status: { fontSize: 14 },
  date: { fontSize: 13, color: '#3D5A73' },
  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },
})
