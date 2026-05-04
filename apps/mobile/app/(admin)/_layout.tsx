import React from 'react'
import { Tabs } from 'expo-router'
import { Text, View, StyleSheet } from 'react-native'

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }): React.JSX.Element {
  return (
    <View style={[styles.iconWrap, focused && styles.iconWrapActive]}>
      <Text style={styles.emoji}>{emoji}</Text>
    </View>
  )
}

export default function AdminLayout(): React.JSX.Element {
  return (
    <Tabs screenOptions={{ headerShown: false, tabBarStyle: { display: 'none' } }}>
      <Tabs.Screen
        name="index"
        options={{ title: 'Потребители', tabBarIcon: ({ focused }) => <TabIcon emoji="👥" focused={focused} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: 'Профил', tabBarIcon: ({ focused }) => <TabIcon emoji="👤" focused={focused} /> }}
      />
    </Tabs>
  )
}

const styles = StyleSheet.create({
  iconWrap: { width: 40, height: 34, justifyContent: 'center', alignItems: 'center', borderRadius: 10 },
  iconWrapActive: { backgroundColor: '#1A4A6B15' },
  emoji: { fontSize: 22 },
})
