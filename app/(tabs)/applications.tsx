import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCoolify } from '@/contexts/CoolifyContext';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyApplication } from '@/types/coolify';
import { coolifyApi } from '@/services/coolifyApi';
import { Info, Globe, SquarePlay, SquareDot, Activity, LifeBuoy, Square, RefreshCw, Play } from 'lucide-react-native';
import { ListItem } from '@/components/ListItem';
import { normalizeStatus } from '@/utils/status';
import { formatDate } from '@/utils/format';

export default function ApplicationsScreen() {
  const { 
    applications, 
    isLoading, 
    error, 
    isConfigured, 
    refreshApplications,
    clearError 
  } = useCoolify();

  useEffect(() => {
    const interval = setInterval(() => {
      refreshApplications();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshApplications]);

  const onRefresh = useCallback(async () => {
    clearError();
    await refreshApplications();
  }, [refreshApplications, clearError]);

  if (!isConfigured) {
    return <ConfigScreen />;
  }

  const handleViewLogs = (app: CoolifyApplication) => {
    router.push(`/logs?uuid=${String(app.uuid)}&name=${encodeURIComponent(String(app.name))}`);
  };

  const handleRedeploy = async (app: CoolifyApplication) => {
    Alert.alert(
      'Confirm Redeploy',
      `Are you sure you want to redeploy "${String(app.name)}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeploy',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await coolifyApi.triggerRedeploy(String(app.uuid));
              Alert.alert(
                'Success', 
                String(result.message || 'Redeploy triggered successfully')
              );
            } catch (error) {
              Alert.alert(
                'Error',
                `Failed to trigger redeploy: ${error instanceof Error ? String(error.message) : 'Unknown error'}`
              );
            }
          }
        }
      ]
    );
  };

  const handleStop = async (app: CoolifyApplication) => {
    try {
      const result = await coolifyApi.stopApplication(String(app.uuid));
      Alert.alert('Stop', String(result.message || 'Stop triggered'));
      await refreshApplications();
    } catch (error) {
      Alert.alert('Error', `Failed to stop: ${error instanceof Error ? String(error.message) : 'Unknown error'}`);
    }
  };

  const handleStart = async (app: CoolifyApplication) => {
    try {
      const result = await coolifyApi.startApplication(String(app.uuid));
      Alert.alert('Start', String(result.message || 'Start triggered'));
      await refreshApplications();
    } catch (error) {
      Alert.alert('Error', `Failed to start: ${error instanceof Error ? String(error.message) : 'Unknown error'}`);
    }
  };

  const handleRestart = async (app: CoolifyApplication) => {
    try {
      const result = await coolifyApi.restartApplication(String(app.uuid));
      Alert.alert('Restart', String(result.message || 'Restart triggered'));
      await refreshApplications();
    } catch (error) {
      Alert.alert('Error', `Failed to restart: ${error instanceof Error ? String(error.message) : 'Unknown error'}`);
    }
  };

  const renderApplicationItem = ({ item }: { item: CoolifyApplication }) => (
    <ListItem
      title={String(item.name)}
      leftIcons={(() => {
        const raw = String(item.status || '').toLowerCase();
        const [p, s] = raw.split(':');
        const primary = (p || '').trim();
        const secondary = (s || '').trim();
        const first = primary.includes('running')
          ? <SquarePlay key="i1" size={16} color="#10B981" />
          : primary.includes('exited')
            ? <SquareDot key="i1" size={16} color="#EF4444" />
            : <SquareDot key="i1" size={16} color="#9CA3AF" />;
        const second = secondary.includes('unhealthy')
          ? <LifeBuoy key="i2" size={16} color="#F59E0B" />
          : secondary.includes('healthy')
            ? <Activity key="i2" size={16} color="#10B981" />
            : <Activity key="i2" size={16} color="#9CA3AF" />;
        return [
          first,
          second,
          <Globe key="i3" size={16} color="#0EA5E9" />,
        ];
      })()}
      meta={[
        item.description ? (
          <Text key="desc" style={styles.appDescription} numberOfLines={2}>
            {String(item.description)}
          </Text>
        ) : null,
        item.git_repository ? (
          <Text key="repo" style={styles.appRepo} numberOfLines={1}>
            {`${String(item.git_repository)} (${String(item.git_branch || 'main')})`}
          </Text>
        ) : null,
      ].filter(Boolean) as React.ReactNode[]}
      status={normalizeStatus('application', item.status)}
      showStatus={false}
      showUpdated={false}
      rightButtons={(() => {
        const raw = String(item.status || '').toLowerCase();
        const [primary] = raw.split(':');
        const isRunning = primary.includes('running');
        return [
          {
            icon: <Info size={14} color="#2563EB" />,
            onPress: () => handleViewLogs(item),
          },
          {
            icon: <Square size={14} color="#DC2626" />,
            onPress: () => isRunning ? handleStop(item) : Alert.alert('Already stopped'),
          },
          isRunning
            ? {
                icon: <RefreshCw size={14} color="#2563EB" />,
                onPress: () => handleRestart(item),
              }
            : {
                icon: <Play size={14} color="#10B981" />,
                onPress: () => handleStart(item),
              },
        ];
      })()}
      containerStyle={styles.appRow}
    />
  );

  // Header stats
  const totalApps = applications.length;
  const appsRunning = applications.filter(app => {
    const raw = String(app.status || '').toLowerCase();
    const [primary] = raw.split(':');
    return primary.includes('running');
  }).length;
  const appsDown = Math.max(0, totalApps - appsRunning);
  const appsWithDomain = applications.filter(app => !!(app as any)?.fqdn).length;
  const appsWithHealth = applications.filter(app => (app as any)?.health_check_enabled === true).length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Applications</Text>
        <Text style={styles.headerSummary}>
          {String(totalApps)} total • {String(appsRunning)} running • {String(appsDown)} stopped • {String(appsWithDomain)} domains • {String(appsWithHealth)} health checks
        </Text>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round((appsRunning / Math.max(totalApps || 1, 1)) * 100)}%`,
                backgroundColor: appsDown > 0 ? '#F59E0B' : '#10B981',
              },
            ]}
          />
        </View>
      </View>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={onRefresh} />}
      >
        {error && (
          <View style={styles.errorContainer}>
            {[
              <Text key="msg" style={styles.errorText}>{String(error)}</Text>,
              <TouchableOpacity key="btn" onPress={clearError}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            ]}
          </View>
        )}

        <View style={styles.section}>
          {applications.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No applications found</Text>
              <Text style={styles.emptyStateSubtext}>
                Pull to refresh or check your connection
              </Text>
            </View>
          ) : (
            <View style={styles.applicationsContainer}>
              <FlatList
                data={applications}
                renderItem={renderApplicationItem}
                keyExtractor={(item) => String(item.uuid)}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.85)' : '#FFFFFF',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderBottomWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  headerSummary: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
    marginBottom: 12,
  },
  progressContainer: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  progressFill: {
    height: '100%',
    borderRadius: 12,
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderRadius: 16,
    padding: 16,
    margin: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 2,
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '700',
  },
  section: {
    margin: 24,
  },
  applicationsContainer: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.8)' : '#FFFFFF',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderRadius: 20,
    paddingVertical: 12,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  appDescription: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 4,
    fontWeight: '500',
  },
  appRepo: {
    fontSize: 11,
    color: '#3B82F6',
    marginBottom: 4,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginHorizontal: 20,
  },
  emptyState: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.8)' : '#FFFFFF',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderRadius: 20,
    padding: 48,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 20,
    elevation: 5,
  },
  emptyStateText: {
    fontSize: 17,
    color: '#64748B',
    marginBottom: 8,
    fontWeight: '600',
  },
  emptyStateSubtext: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '500',
  },
  appRow: {},
});
