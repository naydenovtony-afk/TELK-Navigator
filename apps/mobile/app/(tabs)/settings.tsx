import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TextInput, TouchableOpacity, Alert,
} from 'react-native'
import { useAuth } from '../../lib/auth'
import { getProfile, updateProfile, changePassword, type UserProfile } from '../../lib/api'
import { getTelkPercent, saveTelkPercent, clearTelkPercent } from '../../lib/prefs'
import AppHeader from '../../components/AppHeader'

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  )
}

function clampPct(v: string): string {
  const digits = v.replace(/[^0-9]/g, '')
  if (!digits) return ''
  const n = parseInt(digits, 10)
  return n > 100 ? '100' : digits
}

export default function SettingsScreen(): React.JSX.Element {
  const { token } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)

  const [savedPercent, setSavedPercent] = useState<number | null>(null)
  const [percentInput, setPercentInput] = useState('')
  const [editingPercent, setEditingPercent] = useState(false)
  const [savingPercent, setSavingPercent] = useState(false)

  const [pwOpen, setPwOpen] = useState(false)
  const [currentPw, setCurrentPw] = useState('')
  const [newPw, setNewPw] = useState('')
  const [confirmPw, setConfirmPw] = useState('')
  const [savingPw, setSavingPw] = useState(false)
  const [pwError, setPwError] = useState('')
  const [pwSuccess, setPwSuccess] = useState(false)

  useEffect(() => {
    if (!token) return
    Promise.all([
      getProfile(token).then((p) => { setProfile(p); setNameInput(p.name ?? '') }),
      getTelkPercent().then((p) => { setSavedPercent(p); setPercentInput(p !== null ? String(p) : '') }),
    ]).catch(() => {}).finally(() => setLoading(false))
  }, [token])

  async function handleSavePercent(): Promise<void> {
    const n = parseInt(percentInput, 10)
    if (isNaN(n) || n < 0 || n > 100) {
      Alert.alert('Невалидна стойност', 'Въведете число между 0 и 100.')
      return
    }
    setSavingPercent(true)
    try {
      await saveTelkPercent(n)
      setSavedPercent(n)
      setEditingPercent(false)
    } finally {
      setSavingPercent(false)
    }
  }

  async function handleClearPercent(): Promise<void> {
    await clearTelkPercent()
    setSavedPercent(null)
    setPercentInput('')
    setEditingPercent(false)
  }

  async function handleSaveName(): Promise<void> {
    if (!token || !nameInput.trim()) return
    setSaving(true)
    try {
      await updateProfile(token, nameInput.trim())
      setProfile((p) => p ? { ...p, name: nameInput.trim() } : p)
      setEditing(false)
    } catch {
      Alert.alert('Грешка', 'Неуспешно запазване. Опитайте отново.')
    } finally {
      setSaving(false)
    }
  }

  function handleCancelEdit(): void {
    setNameInput(profile?.name ?? '')
    setEditing(false)
  }

  async function handleChangePassword(): Promise<void> {
    setPwError('')
    setPwSuccess(false)
    if (!token) return
    if (!currentPw) { setPwError('Въведете текущата парола.'); return }
    if (newPw.length < 8) { setPwError('Новата парола трябва да е поне 8 символа.'); return }
    if (newPw !== confirmPw) { setPwError('Паролите не съвпадат.'); return }
    setSavingPw(true)
    try {
      await changePassword(token, currentPw, newPw, confirmPw)
      setPwSuccess(true)
      setCurrentPw(''); setNewPw(''); setConfirmPw('')
      setTimeout(() => { setPwSuccess(false); setPwOpen(false) }, 2000)
    } catch (e) {
      setPwError(e instanceof Error ? e.message : 'Грешка')
    } finally {
      setSavingPw(false)
    }
  }

  if (loading) return <View style={s.center}><ActivityIndicator color="#1A4A6B" /></View>

  const initial = ((profile?.name ?? profile?.email ?? '?')[0] ?? '?').toUpperCase()
  const roleLabel = profile?.role === 'admin' ? 'Администратор' : 'Пациент'
  const registeredOn = profile?.createdAt
    ? new Date(profile.createdAt).toLocaleDateString('bg-BG', { day: 'numeric', month: 'long', year: 'numeric' })
    : '—'

  return (
    <View style={s.container}>
      <AppHeader title="Настройки" subtitle="Профил и предпочитания" showBack />

      <ScrollView contentContainerStyle={s.content}>
        <View style={s.card}>
          <Text style={s.cardLabel}>ПРОФИЛ</Text>

          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={s.avatarInfo}>
              {editing ? (
                <TextInput
                  style={s.nameInput}
                  value={nameInput}
                  onChangeText={setNameInput}
                  autoFocus
                  placeholder="Въведете имена"
                  placeholderTextColor="#7A95A8"
                  returnKeyType="done"
                  onSubmitEditing={handleSaveName}
                />
              ) : (
                <Text style={s.userName}>{profile?.name ?? '—'}</Text>
              )}
              <Text style={s.userEmail}>{profile?.email}</Text>
            </View>
            {editing ? (
              <View style={s.editActions}>
                <TouchableOpacity style={s.saveBtn} onPress={handleSaveName} disabled={saving}>
                  {saving
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.saveBtnText}>Запази</Text>}
                </TouchableOpacity>
                <TouchableOpacity style={s.cancelBtn} onPress={handleCancelEdit} disabled={saving}>
                  <Text style={s.cancelBtnText}>Отказ</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity style={s.editBtn} onPress={() => setEditing(true)} hitSlop={10}>
                <Text style={s.editBtnText}>✏️</Text>
              </TouchableOpacity>
            )}
          </View>

          <View style={s.divider} />

          <Row label="Имейл" value={profile?.email ?? '—'} />
          <Row label="Роля" value={roleLabel} />
          <Row label="Регистриран на" value={registeredOn} />
        </View>

        {/* Password card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>СИГУРНОСТ</Text>

          <TouchableOpacity
            style={s.pwToggleRow}
            onPress={() => { setPwOpen((v) => !v); setPwError(''); setPwSuccess(false) }}
            activeOpacity={0.8}
          >
            <Text style={s.pwToggleText}>🔒  Промяна на парола</Text>
            <Text style={s.pwChevron}>{pwOpen ? '▲' : '▼'}</Text>
          </TouchableOpacity>

          {pwOpen && (
            <View style={s.pwForm}>
              <TextInput
                style={s.pwInput}
                placeholder="Текуща парола"
                placeholderTextColor="#9AB0BF"
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={s.pwInput}
                placeholder="Нова парола (мин. 8 символа)"
                placeholderTextColor="#9AB0BF"
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry
                autoCapitalize="none"
              />
              <TextInput
                style={s.pwInput}
                placeholder="Потвърди новата парола"
                placeholderTextColor="#9AB0BF"
                value={confirmPw}
                onChangeText={setConfirmPw}
                secureTextEntry
                autoCapitalize="none"
                returnKeyType="done"
                onSubmitEditing={handleChangePassword}
              />

              {pwError ? <Text style={s.pwError}>{pwError}</Text> : null}
              {pwSuccess ? <Text style={s.pwSuccess}>✓  Паролата е сменена успешно</Text> : null}

              <View style={s.pwActions}>
                <TouchableOpacity
                  style={[s.saveBtn, savingPw && { opacity: 0.55 }]}
                  onPress={handleChangePassword}
                  disabled={savingPw}
                >
                  {savingPw
                    ? <ActivityIndicator color="#fff" size="small" />
                    : <Text style={s.saveBtnText}>Смени паролата</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.cancelBtn}
                  onPress={() => { setPwOpen(false); setCurrentPw(''); setNewPw(''); setConfirmPw(''); setPwError('') }}
                  disabled={savingPw}
                >
                  <Text style={s.cancelBtnText}>Отказ</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>

        {/* TELK percent card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>ТЕЛК СТЕПЕН</Text>
          <Text style={s.cardHint}>
            Запазете процента от вашето ТЕЛК решение. Екранът „Права" ще покаже само правата, които се отнасят за вас.
          </Text>

          {editingPercent ? (
            <View style={s.percentEditRow}>
              <TextInput
                style={s.percentInput}
                keyboardType="number-pad"
                placeholder="0–100"
                placeholderTextColor="#9AB0BF"
                value={percentInput}
                onChangeText={(v) => setPercentInput(clampPct(v))}
                maxLength={3}
                autoFocus
                returnKeyType="done"
                onSubmitEditing={handleSavePercent}
              />
              <Text style={s.percentSymbol}>%</Text>
              <TouchableOpacity
                style={[s.saveBtn, { flex: 1 }]}
                onPress={handleSavePercent}
                disabled={savingPercent}
              >
                {savingPercent
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <Text style={s.saveBtnText}>Запази</Text>}
              </TouchableOpacity>
              <TouchableOpacity style={s.cancelBtn} onPress={() => { setEditingPercent(false); setPercentInput(savedPercent !== null ? String(savedPercent) : '') }}>
                <Text style={s.cancelBtnText}>Отказ</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={s.percentRow}>
              {savedPercent !== null ? (
                <>
                  <View style={s.percentBadge}>
                    <Text style={s.percentBadgeValue}>{savedPercent}%</Text>
                  </View>
                  <TouchableOpacity style={s.editBtn} onPress={() => setEditingPercent(true)} hitSlop={10}>
                    <Text style={s.editBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.clearBtn} onPress={handleClearPercent} hitSlop={10}>
                    <Text style={s.clearBtnText}>Изчисти</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <TouchableOpacity style={[s.saveBtn, { flex: 1 }]} onPress={() => setEditingPercent(true)}>
                  <Text style={s.saveBtnText}>Въведете процент</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#E8F4F8' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#E8F4F8' },

  content: { padding: 16, gap: 14, paddingBottom: 32 },

  card: {
    backgroundColor: '#fff', borderRadius: 16, padding: 20,
    borderWidth: 0.5, borderColor: '#B8CDD8', gap: 10,
    elevation: 1, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 4, shadowOffset: { width: 0, height: 2 },
  },
  cardLabel: { fontSize: 12, fontWeight: '700', color: '#7A95A8', letterSpacing: 1 },

  avatarRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: '#1A4A6B', justifyContent: 'center', alignItems: 'center',
    flexShrink: 0,
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  avatarInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1C2B3A' },
  userEmail: { fontSize: 14, color: '#3D5A73' },

  nameInput: {
    fontSize: 18, fontWeight: '700', color: '#1C2B3A',
    borderBottomWidth: 1.5, borderBottomColor: '#1A4A6B',
    paddingVertical: 2, paddingHorizontal: 0,
  },

  editBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#EDF3F7', justifyContent: 'center', alignItems: 'center',
  },
  editBtnText: { fontSize: 16 },

  editActions: { gap: 6 },
  saveBtn: {
    backgroundColor: '#1A4A6B', borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 14, alignItems: 'center', minWidth: 72,
  },
  saveBtnText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: '#EDF3F7', borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 14, alignItems: 'center',
  },
  cancelBtnText: { color: '#3D5A73', fontSize: 13, fontWeight: '600' },

  divider: { height: 0.5, backgroundColor: '#B8CDD8' },

  cardHint: { fontSize: 14, color: '#3D5A73', lineHeight: 20 },

  percentRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  percentBadge: {
    backgroundColor: '#1A4A6B', borderRadius: 12,
    paddingVertical: 8, paddingHorizontal: 18,
  },
  percentBadgeValue: { color: '#fff', fontSize: 22, fontWeight: '800' },

  percentEditRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  percentInput: {
    width: 72, borderWidth: 1.5, borderColor: '#1A4A6B', borderRadius: 10,
    padding: 10, fontSize: 18, fontWeight: '700', color: '#1C2B3A', textAlign: 'center',
  },
  percentSymbol: { fontSize: 18, color: '#1C2B3A', fontWeight: '600' },

  clearBtn: {
    backgroundColor: '#EDF3F7', borderRadius: 8,
    paddingVertical: 7, paddingHorizontal: 12,
  },
  clearBtnText: { color: '#8B1A1A', fontSize: 13, fontWeight: '600' },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#EDF3F7',
  },
  rowLabel: { fontSize: 15, color: '#3D5A73' },
  rowValue: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },

  pwToggleRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pwToggleText: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
  pwChevron: { fontSize: 12, color: '#7A95A8' },
  pwForm: { gap: 10, paddingTop: 4 },
  pwInput: {
    borderWidth: 1.5, borderColor: '#B8CDD8', borderRadius: 10,
    padding: 12, fontSize: 15, color: '#1C2B3A', backgroundColor: '#FAFCFD',
  },
  pwError:   { fontSize: 13, color: '#8B1A1A', lineHeight: 18 },
  pwSuccess: { fontSize: 13, color: '#1A6B3C', fontWeight: '600' },
  pwActions: { flexDirection: 'row', gap: 8, paddingTop: 2 },
})
