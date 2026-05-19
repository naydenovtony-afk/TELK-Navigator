import React, { useEffect } from 'react'
import { Tabs, useRouter } from 'expo-router'
import { Text, View, StyleSheet } from 'react-native'
import { useAuth } from '../../lib/auth'

function TabIcon({ emoji, label, focused }: { emoji: string; label: string; focused: boolean }): React.JSX.Element {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
      <Text style={[styles.label, focused && styles.labelActive]}>{label}</Text>
    </View>
  )
}

export default function AdminLayout(): React.JSX.Element {
  const { token } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!token) {
      router.replace('/sign-in')
    }
  }, [token])

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Потребители',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👥" label="Потребители" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профил',
          tabBarIcon: ({ focused }) => <TabIcon emoji="👤" label="Профил" focused={focused} />,
        }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#fff',
    borderTopWidth: 0.5,
    borderTopColor: '#B8CDD8',
    height: 64,
    paddingBottom: 6,
    paddingTop: 6,
    elevation: 8,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: -2 },
  },
  iconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 2,
  },
  iconWrapActive: { backgroundColor: '#1A4A6B12' },
  emoji: { fontSize: 22 },
  label: { fontSize: 11, color: '#7A95A8', fontWeight: '500' },
  labelActive: { color: '#1A4A6B', fontWeight: '700' },
})
