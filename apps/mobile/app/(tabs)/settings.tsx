import React, { useEffect, useState } from 'react'
import { View, Text, StyleSheet, ActivityIndicator, ScrollView } from 'react-native'
import { useAuth } from '../../lib/auth'
import { getProfile, type UserProfile } from '../../lib/api'
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

  useEffect(() => {
    if (!token) return
    getProfile(token)
      .then(setProfile)
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [token])

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
        {/* Profile card */}
        <View style={s.card}>
          <Text style={s.cardLabel}>ПРОФИЛ</Text>

          <View style={s.avatarRow}>
            <View style={s.avatar}>
              <Text style={s.avatarText}>{initial}</Text>
            </View>
            <View style={s.avatarInfo}>
              <Text style={s.userName}>{profile?.name ?? '—'}</Text>
              <Text style={s.userEmail}>{profile?.email}</Text>
            </View>
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
  },
  avatarText: { color: '#fff', fontSize: 22, fontWeight: '700' },
  avatarInfo: { flex: 1, gap: 3 },
  userName: { fontSize: 18, fontWeight: '700', color: '#1C2B3A' },
  userEmail: { fontSize: 14, color: '#3D5A73' },

  divider: { height: 0.5, backgroundColor: '#B8CDD8' },

  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: '#EDF3F7',
  },
  rowLabel: { fontSize: 15, color: '#3D5A73' },
  rowValue: { fontSize: 15, fontWeight: '600', color: '#1C2B3A' },

})
