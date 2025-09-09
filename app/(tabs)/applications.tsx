import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useCoolify } from '@/contexts/CoolifyContext';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyApplication } from '@/types/coolify';
import { coolifyApi } from '@/services/coolifyApi';
import { Info, Globe, SquarePlay, SquareDot, Activity, LifeBuoy, Square, RefreshCw, Play, PlugZap } from 'lucide-react-native';
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

  // Removed auto-refresh; use pull-to-refresh instead

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
      subtitle={(() => {
        const buildPack = (item as any)?.build_pack || (item as any)?.buildpack || (item as any)?.build_type || (item as any)?.image;
        return buildPack ? `Build pack: ${String(buildPack)}` : undefined;
      })()}
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
      meta={(() => {
        const repo = (item as any)?.git_repository || (item as any)?.repository || (item as any)?.git_repo || (item as any)?.git_repo_url;
        const branch = (item as any)?.git_branch || 'main';
        return repo
          ? [
              <Text key="repo" style={styles.appRepo} numberOfLines={1}>
                {`${String(repo)} (${String(branch)})`}
              </Text>,
            ]
          : [];
      })()}
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
      {/* Header moved into navigation bar via Tabs options */}
      <View style={styles.summaryBar}>
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
    backgroundColor: '#F9FAFB',
  },
  headerContent: {
    flex: 1,
  },
  titleSection: {
    gap: 2,
  },
  header: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
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
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  headerSummary: {
    marginTop: 6,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  progressContainer: {
    marginTop: 8,
    height: 6,
    backgroundColor: '#E5E7EB',
    borderRadius: 9999,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 9999,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  summaryBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Platform.OS === 'web' ? 'rgba(248, 250, 252, 0.8)' : '#F8FAFC',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    borderBottomWidth: 0,
  },
  connectionIndicator: {
    backgroundColor: '#DCFCE7',
    borderRadius: 12,
    padding: 6,
    borderWidth: 1,
    borderColor: '#10B981',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  errorText: {
    color: '#DC2626',
    fontSize: 14,
    flex: 1,
  },
  errorDismiss: {
    color: '#DC2626',
    fontSize: 14,
    fontWeight: '600',
  },
  section: {
    margin: 20,
  },
  sectionTitle: {},
  applicationsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
  },
  appRow: {},
  appInfo: {
    flex: 1,
    paddingRight: 16,
  },
  appName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  appId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  appDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 0,
  },
  appRepo: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 0,
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  appActions: {
    flexDirection: 'column',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EBF8FF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#3B82F6',
    gap: 4,
  },
  redeployButton: {
    backgroundColor: '#FEF2F2',
    borderColor: '#EF4444',
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#3B82F6',
  },
  redeployButtonText: {
    color: '#EF4444',
  },
  separator: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  emptyState: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 40,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 4,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#9CA3AF',
  },
});
