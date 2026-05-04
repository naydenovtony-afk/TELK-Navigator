import React, { useState } from 'react'
import {
  View, Text, TouchableOpacity, Modal, StyleSheet,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useRouter } from 'expo-router'
import { useAuth } from '../lib/auth'

interface AppHeaderProps {
  title?: string
  subtitle?: string
  showBack?: boolean
}

export default function AppHeader({
  title = 'ТЕЛК Навигатор',
  subtitle,
  showBack = false,
}: AppHeaderProps): React.JSX.Element {
  const { setToken } = useAuth()
  const router = useRouter()
  const insets = useSafeAreaInsets()
  const [menuVisible, setMenuVisible] = useState(false)
  const [confirmVisible, setConfirmVisible] = useState(false)

  function openMenu(): void { setMenuVisible(true) }
  function closeMenu(): void { setMenuVisible(false) }

  function goSettings(): void {
    closeMenu()
    router.push('/(tabs)/settings')
  }

  function requestLogout(): void {
    closeMenu()
    setTimeout(() => setConfirmVisible(true), 150)
  }

  async function confirmLogout(): Promise<void> {
    setConfirmVisible(false)
    await setToken(null)
    router.replace('/sign-in')
  }

  function cancelLogout(): void { setConfirmVisible(false) }

  return (
    <>
      <View style={[s.header, { paddingTop: insets.top + 14 }]}>
        {showBack ? (
          <TouchableOpacity style={s.backBtn} onPress={() => router.back()} hitSlop={12}>
            <Text style={s.backText}>← Табло</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.titleBlock}>
            <Text style={s.title}>{title}</Text>
            {subtitle ? <Text style={s.subtitle}>{subtitle}</Text> : null}
          </View>
        )}

        <TouchableOpacity style={s.menuBtn} onPress={openMenu} hitSlop={12} accessibilityLabel="Меню">
          <Text style={s.menuDots}>⋮</Text>
        </TouchableOpacity>
      </View>

      {/* ── Dropdown menu ─────────────────────────────── */}
      <Modal visible={menuVisible} transparent animationType="fade" onRequestClose={closeMenu}>
        <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={closeMenu}>
          <View style={[s.dropdown, { top: insets.top + 60 }]}>
            <TouchableOpacity style={s.menuItem} onPress={goSettings} activeOpacity={0.7}>
              <Text style={s.menuIcon}>⚙️</Text>
              <Text style={s.menuLabel}>Настройки</Text>
            </TouchableOpacity>
            <View style={s.menuDivider} />
            <TouchableOpacity style={s.menuItem} onPress={requestLogout} activeOpacity={0.7}>
              <Text style={s.menuIcon}>🚪</Text>
              <Text style={[s.menuLabel, s.menuLabelRed]}>Изход</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Logout confirmation ───────────────────────── */}
      <Modal visible={confirmVisible} transparent animationType="fade" onRequestClose={cancelLogout}>
        <View style={s.confirmBackdrop}>
          <View style={s.confirmCard}>
            <Text style={s.confirmIcon}>🚪</Text>
            <Text style={s.confirmTitle}>Изход от профила</Text>
            <Text style={s.confirmDesc}>
              Сигурни ли сте, че искате да излезете?{'\n'}
              Ще трябва да влезете отново.
            </Text>
            <TouchableOpacity style={s.btnLogout} onPress={confirmLogout} activeOpacity={0.8}>
              <Text style={s.btnLogoutText}>Изход</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.btnCancel} onPress={cancelLogout} activeOpacity={0.8}>
              <Text style={s.btnCancelText}>Отказ</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </>
  )
}

const s = StyleSheet.create({
  header: {
    backgroundColor: '#1A4A6B',
    paddingHorizontal: 20,
    paddingBottom: 18,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  titleBlock: { flex: 1 },
  title: { color: '#fff', fontSize: 22, fontWeight: '800' },
  subtitle: { color: '#B8D8E8', fontSize: 13, marginTop: 2 },

  backBtn: { flex: 1, paddingBottom: 2 },
  backText: { color: '#B8D8E8', fontSize: 16, fontWeight: '600' },

  menuBtn: {
    width: 40, height: 40,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 20,
  },
  menuDots: { color: '#fff', fontSize: 26, lineHeight: 30, fontWeight: '700' },

  overlay: { flex: 1 },
  dropdown: {
    position: 'absolute',
    right: 14,
    backgroundColor: '#fff',
    borderRadius: 14,
    paddingVertical: 6,
    minWidth: 190,
    elevation: 10,
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 0.5,
    borderColor: '#B8CDD8',
  },
  menuItem: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingVertical: 13, paddingHorizontal: 18,
  },
  menuIcon: { fontSize: 20 },
  menuLabel: { fontSize: 16, fontWeight: '600', color: '#1C2B3A' },
  menuLabelRed: { color: '#CC2A2A' },
  menuDivider: { height: 0.5, backgroundColor: '#B8CDD8', marginHorizontal: 14 },

  confirmBackdrop: {
    flex: 1,
    backgroundColor: '#00000088',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 28,
  },
  confirmCard: {
    backgroundColor: '#fff',
    borderRadius: 22,
    padding: 30,
    width: '100%',
    alignItems: 'center',
    gap: 12,
    elevation: 20,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
  },
  confirmIcon: { fontSize: 54, lineHeight: 60 },
  confirmTitle: { fontSize: 22, fontWeight: '800', color: '#1C2B3A', textAlign: 'center' },
  confirmDesc: {
    fontSize: 15, color: '#3D5A73', textAlign: 'center', lineHeight: 22, marginBottom: 6,
  },
  btnLogout: {
    width: '100%', backgroundColor: '#CC2A2A', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnLogoutText: { color: '#fff', fontSize: 17, fontWeight: '800' },
  btnCancel: {
    width: '100%', backgroundColor: '#EDF3F7', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  btnCancelText: { color: '#3D5A73', fontSize: 17, fontWeight: '700' },
})
