import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
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
      const data = await getCases(token)
      setCases(data)
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
    return (
      <View style={styles.center}>
        <ActivityIndicator color="#1A4A6B" />
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Моите случаи</Text>
      </View>

      {error ? (
        <Text style={styles.error}>{error}</Text>
      ) : (
        <FlatList
          data={cases}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true) }}
              tintColor="#1A4A6B"
            />
          }
          contentContainerStyle={cases.length === 0 ? styles.empty : styles.list}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Нямате добавени случаи. Използвайте уеб приложението, за да създадете случай.</Text>
          }
          renderItem={({ item }) => (
            <View style={styles.card}>
              <Text style={styles.caseTitle}>{item.title}</Text>
              <View style={styles.row}>
                <View style={[styles.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
                <Text style={[styles.statusText, { color: STATUS_COLOR[item.status] }]}>
                  {STATUS_LABEL[item.status]}
                </Text>
              </View>
              <Text style={styles.date}>
                {new Date(item.createdAt).toLocaleDateString('bg-BG')}
              </Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#1A4A6B',
    padding: 16,
    paddingTop: 52,
  },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500' },
  signOut: { color: '#B8CDD8', fontSize: 14 },
  list: { padding: 16, gap: 12 },
  empty: { flex: 1, justifyContent: 'center', padding: 32 },
  emptyText: { color: '#3D5A73', textAlign: 'center', fontSize: 15, lineHeight: 22 },
  card: {
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 16,
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
    gap: 6,
  },
  caseTitle: { fontSize: 16, fontWeight: '500', color: '#1C2B3A' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13 },
  date: { fontSize: 12, color: '#3D5A73' },
  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },
})
