import React from 'react'
import { Tabs } from 'expo-router'

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="settings" />
      <Tabs.Screen name="logout"    options={{ href: null }} />
      <Tabs.Screen name="cases"     options={{ href: null }} />
      <Tabs.Screen name="deadlines" options={{ href: null }} />
      <Tabs.Screen name="documents" options={{ href: null }} />
      <Tabs.Screen name="rights"    options={{ href: null }} />
      <Tabs.Screen name="more"      options={{ href: null }} />
    </Tabs>
  )
}
