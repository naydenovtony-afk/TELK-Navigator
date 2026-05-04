import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform, TextInput, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import { getCases, createCase, updateCase, deleteCase, type Case } from '../../lib/api'

const STATUS_CYCLE: Case['status'][] = ['active', 'submitted', 'closed']

const STATUS_LABEL: Record<Case['status'], string> = {
  active:    'Активен',
  submitted: 'Подаден',
  closed:    'Затворен',
}
const STATUS_COLOR: Record<Case['status'], string> = {
  active:    '#1A6B3C',
  submitted: '#7A5200',
  closed:    '#3D5A73',
}

export default function CasesScreen(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, setCreating] = useState(false)
  const [createError, setCreateError] = useState('')

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

  function openModal(): void {
    setNewTitle('')
    setCreateError('')
    setShowModal(true)
  }

  async function handleCreate(): Promise<void> {
    if (!token || !newTitle.trim()) return
    setCreating(true)
    setCreateError('')
    try {
      const created = await createCase(token, newTitle.trim())
      setCases((prev) => [created, ...prev])
      setShowModal(false)
    } catch (e) {
      setCreateError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setCreating(false)
    }
  }

  async function handleCycleStatus(c: Case): Promise<void> {
    if (!token) return
    const next = STATUS_CYCLE[(STATUS_CYCLE.indexOf(c.status) + 1) % STATUS_CYCLE.length]
    setCases((prev) => prev.map((x) => x.id === c.id ? { ...x, status: next } : x))
    try {
      await updateCase(token, c.id, { status: next })
    } catch {
      setCases((prev) => prev.map((x) => x.id === c.id ? { ...x, status: c.status } : x))
    }
  }

  function handleDelete(c: Case): void {
    Alert.alert(
      'Изтриване на случай',
      `Сигурни ли сте, че искате да изтриете „${c.title}"? Всички документи ще бъдат изтрити.`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий', style: 'destructive',
          onPress: async () => {
            if (!token) return
            setCases((prev) => prev.filter((x) => x.id !== c.id))
            try {
              await deleteCase(token, c.id)
            } catch {
              load(true)
            }
          },
        },
      ]
    )
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#1A4A6B" size="large" /></View>

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Моите случаи</Text>
        <TouchableOpacity style={s.addBtn} onPress={openModal} hitSlop={8}>
          <Text style={s.addBtnText}>+ Нов</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={s.error}>{error}</Text> : (
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
          contentContainerStyle={cases.length === 0 ? s.emptyContainer : s.list}
          ListEmptyComponent={
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>📁</Text>
              <Text style={s.emptyTitle}>Нямате случаи</Text>
              <Text style={s.emptyBody}>
                Случаите следят целия ви ТЕЛК процес — документи, срокове и статус на едно място.
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={openModal} activeOpacity={0.75}>
                <Text style={s.emptyBtnText}>Създайте първи случай</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => (
            <View style={s.card}>
              <View style={s.cardTop}>
                <Text style={s.caseTitle} numberOfLines={2}>{item.title}</Text>
                <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={10}>
                  <Text style={s.deleteBtn}>✕</Text>
                </TouchableOpacity>
              </View>

              <View style={s.cardBottom}>
                <Text style={s.date}>{new Date(item.createdAt).toLocaleDateString('bg-BG')}</Text>
                <TouchableOpacity
                  style={[s.statusPill, { backgroundColor: STATUS_COLOR[item.status] + '18' }]}
                  onPress={() => handleCycleStatus(item)}
                  activeOpacity={0.7}
                  hitSlop={6}
                >
                  <View style={[s.dot, { backgroundColor: STATUS_COLOR[item.status] }]} />
                  <Text style={[s.statusText, { color: STATUS_COLOR[item.status] }]}>
                    {STATUS_LABEL[item.status]}
                  </Text>
                  <Text style={[s.statusArrow, { color: STATUS_COLOR[item.status] }]}>›</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Create modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={() => setShowModal(false)}>
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={() => setShowModal(false)} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>Нов случай</Text>
            <Text style={s.sheetBody}>Дайте кратко описателно заглавие на вашия ТЕЛК случай.</Text>

            <TextInput
              style={s.input}
              placeholder="напр. ТЕЛК преосвидетелстване 2026…"
              placeholderTextColor="#9AB0BF"
              value={newTitle}
              onChangeText={setNewTitle}
              autoFocus
              returnKeyType="done"
              onSubmitEditing={handleCreate}
              maxLength={200}
            />

            {createError ? <Text style={s.createError}>{createError}</Text> : null}

            <TouchableOpacity
              style={[s.createBtn, (!newTitle.trim() || creating) && s.createBtnDisabled]}
              onPress={handleCreate}
              disabled={!newTitle.trim() || creating}
              activeOpacity={0.8}
            >
              {creating
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.createBtnText}>Създай случай</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowModal(false)} activeOpacity={0.75}>
              <Text style={s.cancelBtnText}>Отказ</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' },

  header: {
    backgroundColor: '#1A4A6B',
    paddingHorizontal: 16,
    paddingBottom: 16,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  back: { color: '#B8D8E8', fontSize: 14 },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '600' },
  addBtn: { backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 8, paddingVertical: 5, paddingHorizontal: 10 },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '600' },

  list: { padding: 16, gap: 12 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 24 },
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

  card: {
    backgroundColor: '#fff', borderRadius: 14, padding: 16,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 12,
    elevation: 2, shadowColor: '#000', shadowOpacity: 0.05, shadowRadius: 5, shadowOffset: { width: 0, height: 2 },
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  caseTitle: { flex: 1, fontSize: 16, fontWeight: '700', color: '#1C2B3A', lineHeight: 22 },
  deleteBtn: { fontSize: 15, color: '#B8CDD8', fontWeight: '600', paddingTop: 2 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  date: { fontSize: 13, color: '#7A95A8' },
  statusPill: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 5, paddingHorizontal: 10, borderRadius: 20,
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  statusText: { fontSize: 13, fontWeight: '600' },
  statusArrow: { fontSize: 13, fontWeight: '700' },

  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },

  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 12,
  },
  sheetHandle: { width: 40, height: 4, backgroundColor: '#C8D8E4', borderRadius: 2, alignSelf: 'center', marginBottom: 4 },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1C2B3A' },
  sheetBody: { fontSize: 14, color: '#3D5A73', lineHeight: 20 },
  input: {
    borderWidth: 1.5, borderColor: '#B8CDD8', borderRadius: 12,
    padding: 14, fontSize: 15, color: '#1C2B3A',
  },
  createError: { fontSize: 13, color: '#8B1A1A', textAlign: 'center' },
  createBtn: {
    backgroundColor: '#1A4A6B', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  createBtnDisabled: { opacity: 0.45 },
  createBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: '#3D5A73', fontSize: 15 },
})
