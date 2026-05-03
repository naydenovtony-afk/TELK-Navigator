import React from 'react'
import { Tabs, useRouter } from 'expo-router'
import { Text, View, TouchableOpacity, StyleSheet } from 'react-native'
import { useAuth } from '../../lib/auth'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }): React.JSX.Element {
  return (
    <View style={[s.iconWrap, focused && s.iconWrapActive]}>
      <Text style={s.emoji}>{emoji}</Text>
    </View>
  )
}

export default function TabsLayout(): React.JSX.Element {
  const { setToken } = useAuth()
  const router = useRouter()

  function signOut(): void {
    setToken(null)
    router.replace('/sign-in')
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A4A6B',
        tabBarInactiveTintColor: '#7A95A8',
        tabBarLabelStyle: { fontSize: 13, fontWeight: '700', marginTop: 1 },
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: '#B8CDD8',
          backgroundColor: '#fff',
          height: 82,
          paddingBottom: 12,
          paddingTop: 6,
        },
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* ── Visible tabs ─────────────────────────────── */}
      <Tabs.Screen
        name="index"
        options={{ title: 'Табло', tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} /> }}
      />
      <Tabs.Screen
        name="settings"
        options={{ title: 'Настройки', tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} /> }}
      />
      <Tabs.Screen
        name="logout"
        options={{
          title: 'Изход',
          tabBarIcon: () => (
            <View style={[s.iconWrap, s.iconWrapLogout]}>
              <Text style={s.emoji}>🚪</Text>
            </View>
          ),
          tabBarLabel: () => <Text style={s.logoutLabel}>Изход</Text>,
          tabBarButton: (props) => (
            <TouchableOpacity
              style={props.style}
              onPress={signOut}
              accessibilityRole="button"
              accessibilityLabel="Изход от профила"
            >
              {props.children}
            </TouchableOpacity>
          ),
        }}
      />

      {/* ── Hidden tabs (reachable from dashboard) ───── */}
      <Tabs.Screen name="cases"      options={{ href: null }} />
      <Tabs.Screen name="deadlines"  options={{ href: null }} />
      <Tabs.Screen name="documents"  options={{ href: null }} />
      <Tabs.Screen name="rights"     options={{ href: null }} />
      <Tabs.Screen name="more"       options={{ href: null }} />
    </Tabs>
  )
}

const s = StyleSheet.create({
  iconWrap: {
    width: 44, height: 36,
    justifyContent: 'center', alignItems: 'center',
    borderRadius: 12,
  },
  iconWrapActive: { backgroundColor: '#1A4A6B18' },
  iconWrapLogout: {},
  emoji: { fontSize: 24 },
  logoutLabel: { fontSize: 13, fontWeight: '700', color: '#CC2A2A', marginTop: 1 },
})
