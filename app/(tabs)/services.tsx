import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { StatusChip } from '@/components/StatusChip';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyService } from '@/types/coolify';
import { Layers, Database, Server as ServerIcon, Info, RefreshCw, ExternalLink, SquarePlay, SquareDot, Activity, LifeBuoy, Globe, Square, Play } from 'lucide-react-native';
import { ListItem } from '@/components/ListItem';
import { normalizeStatus } from '@/utils/status';
import { formatDate } from '@/utils/format';

export default function ServicesScreen() {
  const { 
    services, 
    isLoading, 
    error, 
    isConfigured, 
    refreshServices,
    clearError 
  } = useCoolify();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshServices();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshServices]);

  const onRefresh = useCallback(async () => {
    clearError();
    await refreshServices();
  }, [refreshServices, clearError]);

  if (!isConfigured) {
    return <ConfigScreen />;
  }

  // Header stats
  const totalServices = services.length;
  const servicesRunning = services.filter(s => {
    const raw = String(s.status || '').toLowerCase();
    const [primary] = raw.split(':');
    return primary.includes('running');
  }).length;
  const servicesStopped = Math.max(0, totalServices - servicesRunning);
  const servicesHealthy = services.filter(s => String(s.status || '').toLowerCase().includes('healthy')).length;
  const servicesUnhealthy = services.filter(s => String(s.status || '').toLowerCase().includes('unhealthy')).length;

  const renderServiceItem = ({ item }: { item: CoolifyService }) => (
    <ListItem
      title={String(item.name)}
      subtitle={`Type: ${String(item.service_type)}`}
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
      rightButtons={(() => {
        const raw = String(item.status || '').toLowerCase();
        const [primary] = raw.split(':');
        const isRunning = primary.includes('running');
        return [
          {
            icon: <Info size={14} color="#2563EB" />,
            onPress: () => Alert.alert('Not linked', 'Service logs are not wired yet.'),
          },
          {
            icon: <Square size={14} color="#DC2626" />,
            onPress: () => Alert.alert('Not linked', isRunning ? 'Service stop not wired yet.' : 'Service already stopped.'),
          },
          isRunning
            ? {
                icon: <RefreshCw size={14} color="#2563EB" />,
                onPress: () => Alert.alert('Not linked', 'Service restart not wired yet.'),
              }
            : {
                icon: <Play size={14} color="#10B981" />,
                onPress: () => Alert.alert('Not linked', 'Service start not wired yet.'),
              },
        ];
      })()}
      meta={[
        <Text key="server" style={styles.serviceServer} numberOfLines={1}>
          {`Server: ${String(item.server.name)}`}
        </Text>,
        item.description ? (
          <Text key="desc" style={styles.serviceDescription} numberOfLines={2}>
            {String(item.description)}
          </Text>
        ) : null,
        <Text key="apps" style={styles.serviceApps}>
          {`Apps: ${Array.isArray((item as any)?.applications) ? (item as any).applications.length : 0} | DBs: ${Array.isArray((item as any)?.databases) ? (item as any).databases.length : 0}`}
        </Text>,
      ].filter(Boolean) as React.ReactNode[]}
      status={normalizeStatus('service', item.status)}
      showStatus={false}
      showUpdated={false}
      containerStyle={styles.serviceRow}
    />
  );

  const sortedServices = [...services].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
        <Text style={styles.headerSummary}>
          {String(totalServices)} total • {String(servicesRunning)} running • {String(servicesStopped)} stopped • {String(servicesHealthy)} healthy • {String(servicesUnhealthy)} unhealthy
        </Text>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round((servicesRunning / Math.max(totalServices || 1, 1)) * 100)}%`,
                backgroundColor: servicesStopped > 0 ? '#F59E0B' : '#10B981',
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
              <Text key="msg" style={styles.errorText}>{error}</Text>,
              <TouchableOpacity key="btn" onPress={clearError}>
                <Text style={styles.errorDismiss}>Dismiss</Text>
              </TouchableOpacity>
            ]}
          </View>
        )}

        <View style={styles.section}>
          {services.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No services found</Text>
              <Text style={styles.emptyStateSubtext}>
                Pull to refresh or check your connection
                </Text>
            </View>
          ) : (
            <View style={styles.servicesContainer}>
              <FlatList
                data={sortedServices}
                renderItem={renderServiceItem}
                keyExtractor={(item) => item.uuid}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  headerSummary: {
    marginTop: 6,
    fontSize: 12,
    color: '#6B7280',
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
  servicesContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
  },
  serviceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  serviceInfo: {
    flex: 1,
    paddingRight: 16,
  },
  serviceName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 4,
  },
  serviceType: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: 2,
  },
  serviceServer: {
    fontSize: 11,
    color: '#6B7280',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
  },
  serviceApps: {
    fontSize: 11,
    color: '#059669',
    marginBottom: 4,
    fontWeight: '600',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  serviceMeta: {
    alignItems: 'flex-end',
  },
  serviceStatus: {
    fontSize: 10,
    color: '#6B7280',
    marginTop: 4,
    textAlign: 'center',
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
