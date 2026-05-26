import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, RefreshControl, SectionList,
  TouchableOpacity, Modal, KeyboardAvoidingView, ScrollView, Alert, TextInput,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as FileSystem from 'expo-file-system/legacy'
import { useRouter } from 'expo-router'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useAuth } from '../../lib/auth'
import {
  getDocuments, getCases, presignUpload, createDocument, deleteDocument, triggerAnalysis, createCase,
  type Document, type Case,
} from '../../lib/api'
import { DocumentRow } from '../../components/DocumentRow'
import { EmptyState } from '../../components/EmptyState'

type Section = { title: string; data: Document[] }

const DOCUMENT_TYPE_OPTIONS: { value: string; label: string; icon: string }[] = [
  { value: 'epicrisis',          label: 'Епикриза',                 icon: '📋' },
  { value: 'lab_results',        label: 'Лабораторни',              icon: '🔬' },
  { value: 'imaging',            label: 'Образна диагностика',       icon: '🩻' },
  { value: 'outpatient_sheet',   label: 'Амбулаторен лист',         icon: '📄' },
  { value: 'specialist_opinion', label: 'Специалистично становище',  icon: '👨‍⚕️' },
  { value: 'telk_decision',      label: 'ТЕЛК решение',             icon: '⚖️' },
  { value: 'other',              label: 'Друго',                    icon: '📎' },
]

export default function DocumentsScreen(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()

  const [sections, setSections] = useState<Section[]>([])
  const [cases, setCases] = useState<Case[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const [showModal, setShowModal] = useState(false)
  const [pickedAsset, setPickedAsset] = useState<ImagePicker.ImagePickerAsset | null>(null)
  const [selectedCaseId, setSelectedCaseId] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [documentType, setDocumentType] = useState('other')
  const [showNewCase, setShowNewCase] = useState(false)
  const [newCaseTitle, setNewCaseTitle] = useState('')
  const [creatingCase, setCreatingCase] = useState(false)

  async function load(silent = false): Promise<void> {
    if (!token) return
    if (!silent) setLoading(true)
    try {
      const [docs, caseList] = await Promise.all([getDocuments(token), getCases(token)])
      const map = new Map<string, Section>()
      for (const doc of docs) {
        if (!map.has(doc.caseId)) map.set(doc.caseId, { title: doc.caseTitle, data: [] })
        map.get(doc.caseId)!.data.push(doc)
      }
      setSections(Array.from(map.values()))
      setCases(caseList)
      setError('')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => { load() }, [token])

  const hasProcessing = sections.some((sec) => sec.data.some((d) => d.status === 'processing' || d.status === 'uploading'))

  useEffect(() => {
    if (!hasProcessing) return
    const timer = setInterval(() => { load(true) }, 5000)
    return () => clearInterval(timer)
  }, [hasProcessing, token])

  function openModal(): void {
    setPickedAsset(null)
    setSelectedCaseId('')
    setDocumentType('other')
    setUploadError('')
    setShowNewCase(false)
    setNewCaseTitle('')
    setShowModal(true)
  }

  async function handleCreateCase(): Promise<void> {
    if (!token || !newCaseTitle.trim()) return
    setCreatingCase(true)
    try {
      const newCase = await createCase(token, { title: newCaseTitle.trim() })
      setCases((prev) => [newCase, ...prev])
      setSelectedCaseId(newCase.id)
      setShowNewCase(false)
      setNewCaseTitle('')
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Грешка при създаване')
    } finally {
      setCreatingCase(false)
    }
  }

  function handleDelete(doc: Document): void {
    Alert.alert(
      'Изтриване на документ',
      `Сигурни ли сте, че искате да изтриете „${doc.fileName}"?`,
      [
        { text: 'Отказ', style: 'cancel' },
        {
          text: 'Изтрий', style: 'destructive',
          onPress: async () => {
            if (!token) return
            setSections((prev) => prev
              .map((sec) => ({ ...sec, data: sec.data.filter((d) => d.id !== doc.id) }))
              .filter((sec) => sec.data.length > 0)
            )
            try { await deleteDocument(token, doc.id) } catch { load(true) }
          },
        },
      ]
    )
  }

  function closeModal(): void {
    if (uploading) return
    setShowModal(false)
  }

  async function pickFromCamera(): Promise<void> {
    const perm = await ImagePicker.requestCameraPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Нямате разрешение', 'Разрешете достъп до камерата в настройките на телефона.')
      return
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets.length > 0) setPickedAsset(result.assets[0])
  }

  async function pickFromGallery(): Promise<void> {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (!perm.granted) {
      Alert.alert('Нямате разрешение', 'Разрешете достъп до галерията в настройките на телефона.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.85,
      allowsEditing: false,
    })
    if (!result.canceled && result.assets.length > 0) setPickedAsset(result.assets[0])
  }

  async function handleUpload(): Promise<void> {
    if (!token || !pickedAsset || !selectedCaseId) return
    setUploading(true)
    setUploadError('')

    try {
      const asset = pickedAsset
      const mimeType = (asset.mimeType ?? 'image/jpeg') as 'image/jpeg' | 'image/png' | 'image/webp'
      const ext = mimeType.split('/')[1] ?? 'jpg'
      const fileName = `snimka-${Date.now()}.${ext}`

      // 1. Get presigned upload URL
      const { key, uploadUrl } = await presignUpload(token, fileName, mimeType, asset.fileSize ?? undefined)

      // 2. Upload file directly to R2
      const uploadResult = await FileSystem.uploadAsync(uploadUrl, asset.uri, {
        httpMethod: 'PUT',
        headers: { 'Content-Type': mimeType },
      })
      if (uploadResult.status < 200 || uploadResult.status >= 300) {
        throw new Error(`Грешка при качване: ${uploadResult.status}`)
      }

      // 3. Create document record
      const doc = await createDocument(token, selectedCaseId, key, fileName, mimeType, documentType)

      // 4. Trigger AI analysis in background (fire and forget)
      triggerAnalysis(token, doc.id).catch(() => {})

      setShowModal(false)
      await load(true)
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : 'Грешка при качване')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <View style={s.center}><ActivityIndicator color="#1A4A6B" size="large" /></View>
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={12}>
          <Text style={s.back}>‹ Табло</Text>
        </TouchableOpacity>
        <Text style={s.headerTitle}>Документи</Text>
        <TouchableOpacity style={s.addBtn} onPress={openModal} hitSlop={8}>
          <Text style={s.addBtnText}>+ Качи</Text>
        </TouchableOpacity>
      </View>

      {error ? (
        <Text style={s.error}>{error}</Text>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => { setRefreshing(true); load(true) }}
              tintColor="#1A4A6B"
            />
          }
          contentContainerStyle={sections.length === 0 ? s.emptyContainer : s.list}
          ListEmptyComponent={
            <EmptyState
              icon="📷"
              title="Добавете документ"
              body="Снимайте епикризи, резултати от изследвания или амбулаторни листове. AI ще ги анализира за ТЕЛК."
              buttonLabel="Качи документ"
              onPress={openModal}
            />
          }
          renderSectionHeader={({ section }) => (
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <DocumentRow
              item={item}
              onPress={() => router.push(
                `/document-detail?id=${item.id}&name=${encodeURIComponent(item.fileName)}&fileUrl=${encodeURIComponent(item.fileUrl ?? '')}&mimeType=${encodeURIComponent(item.mimeType)}` as never
              )}
              onDelete={handleDelete}
            />
          )}
        />
      )}

      {/* Upload modal */}
      <Modal visible={showModal} transparent animationType="slide" onRequestClose={closeModal}>
        <KeyboardAvoidingView
          style={s.overlay}
          behavior="padding"
        >
          <TouchableOpacity style={s.backdrop} activeOpacity={1} onPress={closeModal} />

          <View style={s.sheet}>
            <View style={s.sheetHandle} />

            {!pickedAsset ? (
              /* Step 1: choose source */
              <>
                <Text style={s.sheetTitle}>Качи документ</Text>
                <Text style={s.sheetBody}>
                  Снимайте медицинския документ или изберете снимка от галерията.
                </Text>

                <TouchableOpacity style={[s.sourceBtn, { backgroundColor: '#1A4A6B' }]} onPress={pickFromCamera} activeOpacity={0.8}>
                  <Text style={s.sourceBtnText}>📷  Камера</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[s.sourceBtn, { backgroundColor: '#1A6B3C' }]} onPress={pickFromGallery} activeOpacity={0.8}>
                  <Text style={s.sourceBtnText}>🖼  Галерия</Text>
                </TouchableOpacity>

                <TouchableOpacity style={s.cancelBtn} onPress={closeModal} activeOpacity={0.75}>
                  <Text style={s.cancelBtnText}>Отказ</Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Step 2: select case + upload */
              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                <Text style={s.sheetTitle}>Изберете случай</Text>
                <Text style={s.sheetBody}>Свържете документа с ТЕЛК случай.</Text>

                <View style={s.imagePill}>
                  <Text style={s.imagePillIcon}>🖼</Text>
                  <Text style={s.imagePillName} numberOfLines={1}>
                    {pickedAsset.fileName ?? `снимка-${Date.now()}.jpg`}
                  </Text>
                  <TouchableOpacity onPress={() => setPickedAsset(null)} hitSlop={8}>
                    <Text style={s.imagePillX}>✕</Text>
                  </TouchableOpacity>
                </View>

                <Text style={s.typePickerLabel}>Вид документ</Text>
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={s.typePickerRow}
                >
                  {DOCUMENT_TYPE_OPTIONS.map((opt) => (
                    <TouchableOpacity
                      key={opt.value}
                      style={[s.typeChip, documentType === opt.value && s.typeChipSelected]}
                      onPress={() => setDocumentType(opt.value)}
                      activeOpacity={0.75}
                    >
                      <Text style={s.typeChipIcon}>{opt.icon}</Text>
                      <Text style={[s.typeChipLabel, documentType === opt.value && s.typeChipLabelSelected]}>
                        {opt.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                {cases.map((c) => (
                  <TouchableOpacity
                    key={c.id}
                    style={[s.caseOption, selectedCaseId === c.id && s.caseOptionSelected]}
                    onPress={() => setSelectedCaseId(c.id)}
                    activeOpacity={0.75}
                  >
                    <View style={[s.caseRadio, selectedCaseId === c.id && s.caseRadioSelected]} />
                    <Text style={[s.caseLabel, selectedCaseId === c.id && s.caseLabelSelected]}>
                      {c.title}
                    </Text>
                  </TouchableOpacity>
                ))}

                {showNewCase ? (
                  <View style={s.newCaseBox}>
                    <TextInput
                      style={s.newCaseInput}
                      placeholder="Име на случая…"
                      placeholderTextColor="#9AB0BF"
                      value={newCaseTitle}
                      onChangeText={setNewCaseTitle}
                      autoFocus
                      returnKeyType="done"
                      onSubmitEditing={handleCreateCase}
                    />
                    <View style={s.newCaseActions}>
                      <TouchableOpacity
                        style={[s.newCaseBtn, { backgroundColor: '#1A4A6B' }]}
                        onPress={handleCreateCase}
                        disabled={creatingCase || !newCaseTitle.trim()}
                        activeOpacity={0.8}
                      >
                        {creatingCase
                          ? <ActivityIndicator color="#fff" size="small" />
                          : <Text style={s.newCaseBtnText}>Създай</Text>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[s.newCaseBtn, { backgroundColor: '#B8CDD8' }]}
                        onPress={() => { setShowNewCase(false); setNewCaseTitle('') }}
                        activeOpacity={0.8}
                      >
                        <Text style={[s.newCaseBtnText, { color: '#1C2B3A' }]}>Отказ</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ) : (
                  <TouchableOpacity style={s.newCaseToggle} onPress={() => setShowNewCase(true)} activeOpacity={0.75}>
                    <Text style={s.newCaseToggleText}>+ Нов случай</Text>
                  </TouchableOpacity>
                )}

                {uploadError ? <Text style={s.uploadError}>{uploadError}</Text> : null}

                <TouchableOpacity
                  style={[s.uploadBtn, (!selectedCaseId || uploading) && s.uploadBtnDisabled]}
                  onPress={handleUpload}
                  disabled={!selectedCaseId || uploading}
                  activeOpacity={0.8}
                >
                  {uploading ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={s.uploadBtnText}>Качи документ</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity style={s.cancelBtn} onPress={closeModal} disabled={uploading} activeOpacity={0.75}>
                  <Text style={s.cancelBtnText}>Отказ</Text>
                </TouchableOpacity>
              </ScrollView>
            )}
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

  list: { paddingBottom: 16 },
  emptyContainer: { flex: 1, justifyContent: 'center', padding: 24 },

  sectionHeader: { backgroundColor: '#E8F4F8', paddingHorizontal: 16, paddingVertical: 8 },
  sectionTitle: { fontSize: 13, fontWeight: '600', color: '#3D5A73', textTransform: 'uppercase', letterSpacing: 0.5 },
  error: { color: '#8B1A1A', padding: 16, textAlign: 'center' },

  // Modal
  overlay: { flex: 1, justifyContent: 'flex-end' },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)' },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: '85%',
    gap: 12,
  },
  sheetHandle: {
    width: 40, height: 4, backgroundColor: '#C8D8E4',
    borderRadius: 2, alignSelf: 'center', marginBottom: 4,
  },
  sheetTitle: { fontSize: 20, fontWeight: '800', color: '#1C2B3A' },
  sheetBody: { fontSize: 14, color: '#3D5A73', lineHeight: 20 },

  sourceBtn: {
    borderRadius: 14, paddingVertical: 18,
    alignItems: 'center',
  },
  sourceBtnText: { color: '#fff', fontSize: 17, fontWeight: '700' },

  imagePill: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: '#E8F4F8', borderRadius: 10, padding: 10,
    borderWidth: 0.5, borderColor: '#B8CDD8',
  },
  imagePillIcon: { fontSize: 20 },
  imagePillName: { flex: 1, fontSize: 13, color: '#1C2B3A' },
  imagePillX: { fontSize: 14, color: '#8B4200', fontWeight: '700' },

  newCaseToggle: { paddingVertical: 12, alignItems: 'center' },
  newCaseToggleText: { fontSize: 15, color: '#1A4A6B', fontWeight: '600' },
  newCaseBox: { borderRadius: 12, borderWidth: 1.5, borderColor: '#1A4A6B', padding: 12, gap: 10 },
  newCaseInput: {
    borderBottomWidth: 1, borderBottomColor: '#B8CDD8',
    fontSize: 15, color: '#1C2B3A', paddingVertical: 6,
  },
  newCaseActions: { flexDirection: 'row', gap: 8 },
  newCaseBtn: { flex: 1, borderRadius: 10, paddingVertical: 10, alignItems: 'center' },
  newCaseBtnText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  caseOption: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    padding: 14, borderRadius: 12,
    borderWidth: 1.5, borderColor: '#B8CDD8',
    backgroundColor: '#fff',
  },
  caseOptionSelected: { borderColor: '#1A4A6B', backgroundColor: '#E8F4F8' },
  caseRadio: {
    width: 20, height: 20, borderRadius: 10,
    borderWidth: 2, borderColor: '#B8CDD8',
  },
  caseRadioSelected: { borderColor: '#1A4A6B', backgroundColor: '#1A4A6B' },
  caseLabel: { fontSize: 15, color: '#3D5A73', flex: 1 },
  caseLabelSelected: { color: '#1A4A6B', fontWeight: '600' },

  uploadError: { fontSize: 13, color: '#8B1A1A', textAlign: 'center' },

  uploadBtn: {
    backgroundColor: '#1A4A6B', borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
  },
  uploadBtnDisabled: { opacity: 0.45 },
  uploadBtnText: { color: '#fff', fontSize: 16, fontWeight: '700' },

  cancelBtn: { alignItems: 'center', paddingVertical: 10 },
  cancelBtnText: { color: '#3D5A73', fontSize: 15 },

  typePickerLabel: { fontSize: 13, fontWeight: '600', color: '#3D5A73', marginBottom: 8 },
  typePickerRow: { gap: 8, paddingBottom: 4 },
  typeChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingVertical: 7, paddingHorizontal: 11,
    borderRadius: 20, borderWidth: 1.5, borderColor: '#B8CDD8',
    backgroundColor: '#F8FBFC',
  },
  typeChipSelected: { borderColor: '#1A4A6B', backgroundColor: '#E8F4F8' },
  typeChipIcon: { fontSize: 14 },
  typeChipLabel: { fontSize: 12, color: '#3D5A73', fontWeight: '500' },
  typeChipLabelSelected: { color: '#1A4A6B', fontWeight: '700' },
})
