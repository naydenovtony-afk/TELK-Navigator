import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Modal, TextInput, Alert, KeyboardAvoidingView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import { getDeadlines, createDeadline, toggleDeadline, deleteDeadline, type Deadline } from '../../lib/api'

function daysUntil(dateStr: string): number {
  const diff = new Date(dateStr).getTime() - Date.now()
  return Math.ceil(diff / (1000 * 60 * 60 * 24))
}

function urgencyColor(days: number): string {
  if (days < 0) return '#8B1A1A'
  if (days <= 7) return '#7A5200'
  return '#1A6B3C'
}

function parseDate(day: string, month: string, year: string): Date | null {
  const d = parseInt(day, 10)
  const m = parseInt(month, 10)
  const y = parseInt(year, 10)
  if (isNaN(d) || isNaN(m) || isNaN(y)) return null
  if (d < 1 || d > 31 || m < 1 || m > 12 || y < 2024) return null
  const date = new Date(y, m - 1, d, 12, 0, 0)
  if (date.getMonth() !== m - 1) return null // catches e.g. Feb 30
  return date
}

export default function DeadlinesScreen(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [deadlines, setDeadlines] = useState<Deadline[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  // Add modal state
  const [showAdd, setShowAdd] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const [newDay, setNewDay] = useState('')
  const [newMonth, setNewMonth] = useState('')
  const [newYear, setNewYear] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')

  async function load(silent = false): Promise<void> {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      setDeadlines(await getDeadlines(token))
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [token])

  async function handleToggle(id: string): Promise<void> {
    if (!token) return
    try {
      const updated = await toggleDeadline(token, id)
      setDeadlines((prev) => prev.map((d) => d.id === id ? updated : d))
    } catch {
      Alert.alert('Грешка', 'Неуспешно обновяване.')
    }
  }

  async function handleDelete(id: string, label: string): Promise<void> {
    if (!token) return
    Alert.alert('Изтриване', `Изтриване на "${label}"?`, [
      { text: 'Отказ', style: 'cancel' },
      {
        text: 'Изтрий', style: 'destructive',
        onPress: async () => {
          try {
            await deleteDeadline(token, id)
            setDeadlines((prev) => prev.filter((d) => d.id !== id))
          } catch {
            Alert.alert('Грешка', 'Неуспешно изтриване.')
          }
        },
      },
    ])
  }

  function openAdd(): void {
    setNewLabel(''); setNewDay(''); setNewMonth(''); setNewYear(''); setFormError('')
    setShowAdd(true)
  }

  async function handleCreate(): Promise<void> {
    if (!token) return
    const trimmed = newLabel.trim()
    if (!trimmed) { setFormError('Въведете описание на срока.'); return }
    const date = parseDate(newDay, newMonth, newYear)
    if (!date) { setFormError('Въведете валидна дата (ден, месец, година).'); return }
    setSaving(true)
    try {
      const created = await createDeadline(token, trimmed, date.toISOString())
      setDeadlines((prev) => [...prev, created].sort(
        (a, b) => new Date(a.dueAt).getTime() - new Date(b.dueAt).getTime()
      ))
      setShowAdd(false)
    } catch (e) {
      setFormError(e instanceof Error ? e.message : 'Грешка при запазване.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#1A4A6B" /></View>

  const pending = deadlines.filter((d) => !d.isCompleted)
  const completed = deadlines.filter((d) => d.isCompleted)

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>← Табло</Text>
        </TouchableOpacity>
        <View style={s.headerRow}>
          <Text style={s.headerTitle}>Срокове</Text>
          <TouchableOpacity style={s.addBtn} onPress={openAdd} hitSlop={10}>
            <Text style={s.addBtnText}>+ Нов</Text>
          </TouchableOpacity>
        </View>
      </View>

      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : (
        <FlatList
          data={[...pending, ...completed]}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(true) }} tintColor="#1A4A6B" />
          }
          contentContainerStyle={deadlines.length === 0 ? s.empty : s.list}
          ListEmptyComponent={
            <View style={s.emptyCard}>
              <Text style={s.emptyIcon}>📅</Text>
              <Text style={s.emptyTitle}>Все още няма срокове</Text>
              <Text style={s.emptyBody}>
                Добавете важни дати — подаване на документи, насрочени прегледи и крайни срокове за обжалване.
              </Text>
              <TouchableOpacity style={s.emptyBtn} onPress={openAdd} activeOpacity={0.75}>
                <Text style={s.emptyBtnText}>+ Добави първи срок</Text>
              </TouchableOpacity>
            </View>
          }
          renderItem={({ item }) => {
            const days = daysUntil(item.dueAt)
            const color = item.isCompleted ? '#3D5A73' : urgencyColor(days)
            const daysLabel = item.isCompleted
              ? 'Изпълнен ✓'
              : days < 0 ? `Просрочен с ${Math.abs(days)} дни`
              : days === 0 ? 'Днес!'
              : `${days} дни`

            return (
              <View style={[s.card, item.isCompleted && s.cardDone]}>
                <View style={s.cardMain}>
                  {/* Checkbox */}
                  <TouchableOpacity
                    style={[s.check, item.isCompleted && s.checkDone]}
                    onPress={() => handleToggle(item.id)}
                    hitSlop={8}
                  >
                    {item.isCompleted && <Text style={s.checkMark}>✓</Text>}
                  </TouchableOpacity>

                  <View style={s.cardBody}>
                    <Text style={[s.label, item.isCompleted && s.labelDone]} numberOfLines={2}>
                      {item.label}
                    </Text>
                    <View style={s.metaRow}>
                      <Text style={[s.days, { color }]}>{daysLabel}</Text>
                      <Text style={s.date}>{new Date(item.dueAt).toLocaleDateString('bg-BG')}</Text>
                    </View>
                  </View>

                  {/* Delete */}
                  <TouchableOpacity
                    style={s.deleteBtn}
                    onPress={() => handleDelete(item.id, item.label)}
                    hitSlop={8}
                  >
                    <Text style={s.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }}
        />
      )}

      {/* ── Add deadline modal ─────────────────────────── */}
      <Modal visible={showAdd} transparent animationType="slide" onRequestClose={() => setShowAdd(false)}>
        <KeyboardAvoidingView
          style={s.modalBackdrop}
          behavior="padding"
        >
          <TouchableOpacity style={s.modalDismiss} activeOpacity={1} onPress={() => setShowAdd(false)} />
          <View style={[s.sheet, { paddingBottom: insets.bottom + 16 }]}>
            <Text style={s.sheetTitle}>Нов срок</Text>

            <Text style={s.fieldLabel}>Описание</Text>
            <TextInput
              style={s.input}
              placeholder="напр. Подаване на документи за ТЕЛК"
              placeholderTextColor="#7A95A8"
              value={newLabel}
              onChangeText={setNewLabel}
              multiline={false}
              returnKeyType="next"
            />

            <Text style={s.fieldLabel}>Дата</Text>
            <View style={s.dateRow}>
              <View style={s.dateField}>
                <TextInput
                  style={s.dateInput}
                  placeholder="ДД"
                  placeholderTextColor="#7A95A8"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={newDay}
                  onChangeText={setNewDay}
                />
                <Text style={s.dateHint}>ден</Text>
              </View>
              <Text style={s.dateSep}>/</Text>
              <View style={s.dateField}>
                <TextInput
                  style={s.dateInput}
                  placeholder="ММ"
                  placeholderTextColor="#7A95A8"
                  keyboardType="number-pad"
                  maxLength={2}
                  value={newMonth}
                  onChangeText={setNewMonth}
                />
                <Text style={s.dateHint}>месец</Text>
              </View>
              <Text style={s.dateSep}>/</Text>
              <View style={s.dateField}>
                <TextInput
                  style={[s.dateInput, s.dateInputYear]}
                  placeholder="ГГГГ"
                  placeholderTextColor="#7A95A8"
                  keyboardType="number-pad"
                  maxLength={4}
                  value={newYear}
                  onChangeText={setNewYear}
                />
                <Text style={s.dateHint}>година</Text>
              </View>
            </View>

            {formError ? <Text style={s.formError}>{formError}</Text> : null}

            <TouchableOpacity style={s.saveBtn} onPress={handleCreate} disabled={saving} activeOpacity={0.8}>
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.saveBtnText}>Запази срок</Text>}
            </TouchableOpacity>
            <TouchableOpacity style={s.cancelBtn} onPress={() => setShowAdd(false)} disabled={saving}>
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

  header: { backgroundColor: '#1A4A6B', paddingHorizontal: 16, paddingBottom: 14, gap: 4 },
  back: { color: '#B8D8E8', fontSize: 16, fontWeight: '600' },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: '500' },
  addBtn: {
    backgroundColor: '#ffffff22', borderRadius: 8,
    paddingVertical: 6, paddingHorizontal: 12,
  },
  addBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  list: { padding: 16, gap: 10, paddingBottom: 32 },
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

  card: {
    backgroundColor: '#fff', borderRadius: 12, padding: 14,
    borderWidth: 0.5, borderColor: '#B8CDD8',
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardDone: { opacity: 0.55 },
  cardMain: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardBody: { flex: 1, gap: 4 },

  check: {
    width: 26, height: 26, borderRadius: 13,
    borderWidth: 2, borderColor: '#1A4A6B',
    justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  checkDone: { backgroundColor: '#1A4A6B', borderColor: '#1A4A6B' },
  checkMark: { color: '#fff', fontSize: 14, fontWeight: '800', lineHeight: 16 },

  label: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  labelDone: { textDecorationLine: 'line-through', color: '#3D5A73' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  days: { fontSize: 13, fontWeight: '600' },
  date: { fontSize: 12, color: '#7A95A8' },

  deleteBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: '#F5EAEA', justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  deleteBtnText: { color: '#CC2A2A', fontSize: 13, fontWeight: '700' },

  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },

  // Modal sheet
  modalBackdrop: { flex: 1, justifyContent: 'flex-end' },
  modalDismiss: { flex: 1 },
  sheet: {
    backgroundColor: '#fff', borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, gap: 12,
    elevation: 20, shadowColor: '#000', shadowOpacity: 0.15, shadowRadius: 20, shadowOffset: { width: 0, height: -4 },
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1C2B3A', marginBottom: 4 },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#3D5A73' },
  input: {
    backgroundColor: '#F5F9FB', borderRadius: 10, padding: 14,
    fontSize: 16, color: '#1C2B3A',
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  dateRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dateSep: { fontSize: 22, color: '#B8CDD8', paddingTop: 10 },
  dateField: { flex: 1, alignItems: 'center', gap: 4 },
  dateInput: {
    backgroundColor: '#F5F9FB', borderRadius: 10, padding: 14,
    fontSize: 18, fontWeight: '700', color: '#1C2B3A',
    borderWidth: 0.5, borderColor: '#B8CDD8', textAlign: 'center', width: '100%',
  },
  dateInputYear: { fontSize: 16 },
  dateHint: { fontSize: 11, color: '#7A95A8' },
  formError: { fontSize: 13, color: '#CC2A2A', textAlign: 'center' },
  saveBtn: {
    backgroundColor: '#1A4A6B', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center', marginTop: 4,
  },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  cancelBtn: {
    backgroundColor: '#EDF3F7', borderRadius: 12,
    paddingVertical: 14, alignItems: 'center',
  },
  cancelBtnText: { color: '#3D5A73', fontSize: 15, fontWeight: '600' },
})
