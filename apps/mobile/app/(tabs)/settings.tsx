import React, { useEffect, useState } from 'react'
import {
  View, Text, StyleSheet, ActivityIndicator, ScrollView,
  TextInput, TouchableOpacity, Alert,
} from 'react-native'
import { useAuth } from '../../lib/auth'
import { getProfile, updateProfile, type UserProfile } from '../../lib/api'
import AppHeader from '../../components/AppHeader'

function Row({ label, value }: { label: string; value: string }): React.JSX.Element {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  )
}

export default function SettingsScreen(): React.JSX.Element {
  const { token } = useAuth()
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [nameInput, setNameInput] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (!token) return
    getProfile(token)
      .then((p) => { setProfile(p); setNameInput(p.name ?? '') })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

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

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#EDF3F7',
  },
  rowLabel: { fontSize: 15, color: '#3D5A73' },
  rowValue: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },
})
