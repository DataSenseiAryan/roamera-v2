import { Tabs } from 'expo-router';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#0d9488',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
        },
        headerStyle: { backgroundColor: '#ffffff' },
        headerTintColor: '#0f172a',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Compass',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <TabIcon emoji="🧭" color={color} />,
        }}
      />
      <Tabs.Screen
        name="trips"
        options={{
          title: 'Trips',
          tabBarIcon: ({ color }) => <TabIcon emoji="🗺️" color={color} />,
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'AI Planner',
          tabBarLabel: 'AI',
          tabBarIcon: ({ color }) => <TabIcon emoji="✨" color={color} />,
        }}
      />
      <Tabs.Screen
        name="circles"
        options={{
          title: 'Circles',
          tabBarIcon: ({ color }) => <TabIcon emoji="🤝" color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => <TabIcon emoji="👤" color={color} />,
        }}
      />
    </Tabs>
  );
}

function TabIcon({ emoji, color }: { emoji: string; color: string }) {
  const { Text } = require('react-native') as typeof import('react-native');
  return <Text style={{ fontSize: 20, opacity: color === '#0d9488' ? 1 : 0.6 }}>{emoji}</Text>;
}
