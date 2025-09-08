import { Tabs } from 'expo-router';
import { LayoutDashboard, Server, Smartphone, FileText, Settings } from 'lucide-react-native';
import { Platform } from 'react-native';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#6366F1',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarStyle: {
          backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.85)' : '#FFFFFF',
          backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
          borderTopWidth: 0,
          elevation: 0,
          shadowColor: '#000000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 20,
          height: Platform.OS === 'ios' ? 88 : 70,
          paddingTop: 8,
          paddingBottom: Platform.OS === 'ios' ? 28 : 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
          marginTop: 4,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Dashboard',
          tabBarIcon: ({ size, color }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="servers"
        options={{
          title: 'Servers',
          tabBarIcon: ({ size, color }) => (
            <Server size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          tabBarIcon: ({ size, color }) => (
            <Smartphone size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          tabBarIcon: ({ size, color }) => (
            <Settings size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="logs"
        options={{
          title: 'Logs',
          tabBarIcon: ({ size, color }) => (
            <FileText size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
    </Tabs>
  );
}
