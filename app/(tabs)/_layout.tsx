import { Tabs } from 'expo-router';
import { LayoutDashboard, Server, Smartphone, FileText, Settings, PlugZap, RefreshCcw } from 'lucide-react-native';
import { Platform, View, Text } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';

function DashboardHeaderTitle() {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>
        Coolify Companion
      </Text>
      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>
        Your infrastructure at a glance!
      </Text>
    </View>
  );
}

function ApplicationsHeaderTitle() {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>
        Applications
      </Text>
      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>
        Your apps, running smoothly!
      </Text>
    </View>
  );
}

function ServersHeaderTitle() {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>
        Servers
      </Text>
      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>
        Your servers, always in sight!
      </Text>
    </View>
  );
}

function ServicesHeaderTitle() {
  return (
    <View style={{ gap: 2 }}>
      <Text style={{ fontSize: 18, fontWeight: '800', color: '#111827', letterSpacing: -0.5 }}>
        Services
      </Text>
      <Text style={{ fontSize: 12, color: '#64748B', fontWeight: '500' }}>
        Your services, always under control!
      </Text>
    </View>
  );
}

function ConnectionIndicator() {
  const {
    refreshingServers,
    refreshingApplications,
    refreshingServices,
  } = useCoolify();

  const refreshing = refreshingServers || refreshingApplications || refreshingServices;

  return (
    <View
      style={{
        backgroundColor: refreshing ? '#E0E7FF' : '#DCFCE7',
        borderRadius: 16,
        padding: 8,
        borderWidth: 0,
        shadowColor: refreshing ? '#6366F1' : '#10B981',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 3,
        marginRight: 8,
      }}
    >
      {refreshing ? (
        <RefreshCcw size={18} color="#6366F1" />
      ) : (
        <PlugZap size={18} color="#10B981" />
      )}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        headerTitleAlign: 'left',
        headerShadowVisible: false,
        headerStyle: {
          backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.9)' : '#FFFFFF',
        },
        headerTitleStyle: {
          color: '#111827',
        },
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
          headerTitle: () => <DashboardHeaderTitle />,
          headerRight: () => <ConnectionIndicator />,
          tabBarIcon: ({ size, color }) => (
            <LayoutDashboard size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="servers"
        options={{
          title: 'Servers',
          headerTitle: () => <ServersHeaderTitle />,
          headerRight: () => <ConnectionIndicator />,
          tabBarIcon: ({ size, color }) => (
            <Server size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="applications"
        options={{
          title: 'Applications',
          headerTitle: () => <ApplicationsHeaderTitle />,
          headerRight: () => <ConnectionIndicator />,
          tabBarIcon: ({ size, color }) => (
            <Smartphone size={22} color={color} strokeWidth={2.5} />
          ),
        }}
      />
      <Tabs.Screen
        name="services"
        options={{
          title: 'Services',
          headerTitle: () => <ServicesHeaderTitle />,
          headerRight: () => <ConnectionIndicator />,
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
