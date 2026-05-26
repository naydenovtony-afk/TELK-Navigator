import React, { useEffect, useState } from 'react'
import {
  View, Text, FlatList, StyleSheet, ActivityIndicator, RefreshControl,
  TouchableOpacity, Modal, KeyboardAvoidingView, Platform, TextInput,
  Alert, ScrollView,
} from 'react-native'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import {
  getCases, createCase, updateCase, deleteCase,
  type Case, type CasePatch,
} from '../../lib/api'
import { CaseCard } from '../../components/CaseCard'
import { EmptyState } from '../../components/EmptyState'

type CaseType = 'initial' | 'reexamination' | 'appeal'

const CASE_TYPE_OPTIONS: { value: CaseType; label: string; icon: string }[] = [
  { value: 'initial',       label: 'Първично',          icon: '🆕' },
  { value: 'reexamination', label: 'Преосвидетелстване', icon: '🔄' },
  { value: 'appeal',        label: 'Обжалване',          icon: '⚖️' },
]

interface CaseFormState {
  title: string
  caseType: CaseType
  diagnoses: string
  previousPercent: string
  appealReason: string
  commissionDecision: string
}

const EMPTY_FORM: CaseFormState = {
  title: '',
  caseType: 'initial',
  diagnoses: '',
  previousPercent: '',
  appealReason: '',
  commissionDecision: '',
}

function formFromCase(c: Case): CaseFormState {
  return {
    title: c.title,
    caseType: c.caseType ?? 'initial',
    diagnoses: c.diagnoses ?? '',
    previousPercent: c.previousPercent !== null && c.previousPercent !== undefined
      ? String(c.previousPercent)
      : '',
    appealReason: c.appealReason ?? '',
    commissionDecision: c.commissionDecision ?? '',
  }
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
  const [editingCase, setEditingCase] = useState<Case | null>(null)
  const [form, setForm] = useState<CaseFormState>(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')

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

  function openCreate(): void {
    setEditingCase(null)
    setForm(EMPTY_FORM)
    setSaveError('')
    setShowModal(true)
  }

  function openEdit(c: Case): void {
    setEditingCase(c)
    setForm(formFromCase(c))
    setSaveError('')
    setShowModal(true)
  }

  function closeModal(): void {
    if (saving) return
    setShowModal(false)
  }

  async function handleSave(): Promise<void> {
    if (!token || !form.title.trim()) return
    setSaving(true)
    setSaveError('')

    const patch: CasePatch = {
      title: form.title.trim(),
      caseType: form.caseType,
      diagnoses: form.diagnoses.trim() || null,
      previousPercent: form.previousPercent ? parseInt(form.previousPercent, 10) : null,
      appealReason: form.caseType === 'appeal' ? (form.appealReason.trim() || null) : null,
      commissionDecision: form.caseType === 'appeal' ? (form.commissionDecision.trim() || null) : null,
    }

    try {
      if (editingCase) {
        const updated = await updateCase(token, editingCase.id, patch)
        setCases((prev) => prev.map((x) => x.id === editingCase.id ? updated : x))
      } else {
        const created = await createCase(token, { ...patch, title: patch.title! })
        setCases((prev) => [created, ...prev])
      }
      setShowModal(false)
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setSaving(false)
    }
  }

  async function handleStatusChange(c: Case, newStatus: Case['status']): Promise<void> {
    if (!token) return
    setCases((prev) => prev.map((x) => x.id === c.id ? { ...x, status: newStatus } : x))
    try {
      await updateCase(token, c.id, { status: newStatus })
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
            try { await deleteCase(token, c.id) } catch { load(true) }
          },
        },
      ]
    )
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#1A4A6B" size="large" /></View>

  const isAppeal = form.caseType === 'appeal'
  const isEditing = !!editingCase

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Моите случаи</Text>
        <TouchableOpacity style={s.addBtn} onPress={openCreate} hitSlop={8}>
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
              onPress={openCreate}
            />
          }
          renderItem={({ item }) => (
            <CaseCard
              item={item}
              onDelete={handleDelete}
              onStatusChange={handleStatusChange}
              onEdit={openEdit}
              onViewDocuments={(c) => router.push(`/case-detail?id=${c.id}&title=${encodeURIComponent(c.title)}` as never)}
            />
          )}
        />
      )}

      {/* Create / Edit modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={s.overlay}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={closeModal} />
          <View style={s.sheet}>
            <View style={s.sheetHandle} />
            <Text style={s.sheetTitle}>{isEditing ? 'Редактиране на случай' : 'Нов случай'}</Text>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={s.formScroll}>
              {/* Title */}
              <Text style={s.fieldLabel}>Заглавие *</Text>
              <TextInput
                style={s.input}
                placeholder="напр. ТЕЛК преосвидетелстване 2026…"
                placeholderTextColor="#9AB0BF"
                value={form.title}
                onChangeText={(v) => setForm((f) => ({ ...f, title: v }))}
                autoFocus={!isEditing}
                returnKeyType="next"
                maxLength={200}
              />

              {/* Case type */}
              <Text style={s.fieldLabel}>Вид случай</Text>
              <View style={s.typeRow}>
                {CASE_TYPE_OPTIONS.map((opt) => (
                  <TouchableOpacity
                    key={opt.value}
                    style={[s.typeBtn, form.caseType === opt.value && s.typeBtnActive]}
                    onPress={() => setForm((f) => ({ ...f, caseType: opt.value }))}
                    activeOpacity={0.75}
                  >
                    <Text style={s.typeIcon}>{opt.icon}</Text>
                    <Text style={[s.typeLabel, form.caseType === opt.value && s.typeLabelActive]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Diagnoses */}
              <Text style={s.fieldLabel}>Диагнози / заболявания</Text>
              <TextInput
                style={[s.input, s.inputMulti]}
                placeholder="напр. Сърдечна недостатъчност, Диабет тип 2…"
                placeholderTextColor="#9AB0BF"
                value={form.diagnoses}
                onChangeText={(v) => setForm((f) => ({ ...f, diagnoses: v }))}
                multiline
                numberOfLines={3}
                maxLength={1000}
              />

              {/* Previous percent (for reexamination/appeal) */}
              {(form.caseType === 'reexamination' || form.caseType === 'appeal') && (
                <>
                  <Text style={s.fieldLabel}>Предишен процент от ТЕЛК</Text>
                  <View style={s.percentRow}>
                    <TextInput
                      style={[s.input, s.inputPercent]}
                      placeholder="напр. 75"
                      placeholderTextColor="#9AB0BF"
                      value={form.previousPercent}
                      onChangeText={(v) => setForm((f) => ({ ...f, previousPercent: v.replace(/[^0-9]/g, '') }))}
                      keyboardType="number-pad"
                      maxLength={3}
                    />
                    <Text style={s.percentSign}>%</Text>
                  </View>
                </>
              )}

              {/* Appeal fields */}
              {isAppeal && (
                <>
                  <Text style={s.fieldLabel}>Основание за обжалване</Text>
                  <TextInput
                    style={[s.input, s.inputMulti]}
                    placeholder="Опишете причините за несъгласие с решението…"
                    placeholderTextColor="#9AB0BF"
                    value={form.appealReason}
                    onChangeText={(v) => setForm((f) => ({ ...f, appealReason: v }))}
                    multiline
                    numberOfLines={3}
                    maxLength={1000}
                  />

                  <Text style={s.fieldLabel}>Решение на комисията (отказ)</Text>
                  <TextInput
                    style={[s.input, s.inputMulti]}
                    placeholder="Кратко описание на решението / мотивите за отказ…"
                    placeholderTextColor="#9AB0BF"
                    value={form.commissionDecision}
                    onChangeText={(v) => setForm((f) => ({ ...f, commissionDecision: v }))}
                    multiline
                    numberOfLines={3}
                    maxLength={1000}
                  />
                </>
              )}

              {saveError ? <Text style={s.saveError}>{saveError}</Text> : null}
            </ScrollView>

            <TouchableOpacity
              style={[s.saveBtn, (!form.title.trim() || saving) && s.saveBtnDisabled]}
              onPress={handleSave}
              disabled={!form.title.trim() || saving}
              activeOpacity={0.8}
            >
              {saving
                ? <ActivityIndicator color="#fff" />
                : <Text style={s.saveBtnText}>{isEditing ? 'Запази промените' : 'Създай случай'}</Text>
              }
            </TouchableOpacity>

            <TouchableOpacity style={s.cancelBtn} onPress={closeModal} disabled={saving} activeOpacity={0.75}>
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
    backgroundColor: '#1A4A6B', paddingHorizontal: 16, paddingBottom: 16,
    flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between',
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
    padding: 24, paddingBottom: 32, gap: 10, maxHeight: '90%',
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#C8D8E4',
    borderRadius: 2, alignSelf: 'center', marginBottom: 4,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1C2B3A' },
  formScroll: { flexGrow: 0 },

  fieldLabel: { fontSize: 13, fontWeight: '600', color: '#3D5A73', marginBottom: 6, marginTop: 4 },
  input: {
    borderWidth: 1.5, borderColor: '#B8CDD8', borderRadius: 12,
    padding: 13, fontSize: 15, color: '#1C2B3A', backgroundColor: '#FAFCFD',
  },
  inputMulti: { minHeight: 80, textAlignVertical: 'top' },
  inputPercent: { width: 90, textAlign: 'center', fontSize: 18, fontWeight: '700' },
  percentRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  percentSign: { fontSize: 18, color: '#1C2B3A', fontWeight: '600' },

  typeRow: { flexDirection: 'row', gap: 8 },
  typeBtn: {
    flex: 1, alignItems: 'center', paddingVertical: 10, borderRadius: 10,
    borderWidth: 1.5, borderColor: '#B8CDD8', backgroundColor: '#F8FBFC', gap: 4,
  },
  typeBtnActive: { borderColor: '#1A4A6B', backgroundColor: '#E8F4F8' },
  typeIcon: { fontSize: 20 },
  typeLabel: { fontSize: 11, fontWeight: '600', color: '#7A95A8', textAlign: 'center' },
  typeLabelActive: { color: '#1A4A6B' },

  saveError: { fontSize: 13, color: '#8B1A1A', textAlign: 'center' },
  saveBtn: {
    backgroundColor: '#1A4A6B', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  saveBtnDisabled: { opacity: 0.45 },
  saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: '#3D5A73', fontSize: 15 },
})
