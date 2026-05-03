import React from 'react'
import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function Icon({ label }: { label: string }): React.JSX.Element {
  return <Text style={{ fontSize: 18 }}>{label}</Text>
}

export default function AdminLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A4A6B',
        tabBarInactiveTintColor: '#7A95A8',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: '#B8CDD8',
          backgroundColor: '#fff',
          height: 60,
          paddingBottom: 6,
        },
      }}
    >
      <Tabs.Screen name="index" options={{ title: 'Потребители', tabBarIcon: () => <Icon label="👥" /> }} />
      <Tabs.Screen name="profile" options={{ title: 'Профил', tabBarIcon: () => <Icon label="👤" /> }} />
    </Tabs>
  )
}
