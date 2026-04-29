import { Tabs } from 'expo-router'
import { Text } from 'react-native'

function TabIcon({ label }: { label: string }): React.JSX.Element {
  return <Text style={{ fontSize: 11, color: 'inherit' }}>{label}</Text>
}

export default function TabsLayout(): React.JSX.Element {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#1A4A6B',
        tabBarInactiveTintColor: '#3D5A73',
        tabBarStyle: {
          borderTopWidth: 0.5,
          borderTopColor: '#B8CDD8',
          backgroundColor: '#fff',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Случаи',
          tabBarIcon: () => <TabIcon label="📁" />,
        }}
      />
      <Tabs.Screen
        name="deadlines"
        options={{
          title: 'Срокове',
          tabBarIcon: () => <TabIcon label="📅" />,
        }}
      />
      <Tabs.Screen
        name="rights"
        options={{
          title: 'Права',
          tabBarIcon: () => <TabIcon label="⚖️" />,
        }}
      />
    </Tabs>
  )
}
