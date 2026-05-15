import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform, TextInput, Alert,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import { getCases, createCase, updateCase, deleteCase, type Case } from '../../lib/api'
import { CaseCard } from '../../components/CaseCard'
import { EmptyState } from '../../components/EmptyState'

const STATUS_CYCLE: Case['status'][] = ['active', 'submitted', 'closed']

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
            <EmptyState
              icon="📁"
              title="Нямате случаи"
              body="Случаите следят целия ви ТЕЛК процес — документи, срокове и статус на едно място."
              buttonLabel="Създайте първи случай"
              onPress={openModal}
            />
          }
          renderItem={({ item }) => (
            <CaseCard
              item={item}
              onDelete={handleDelete}
              onCycleStatus={handleCycleStatus}
            />
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
