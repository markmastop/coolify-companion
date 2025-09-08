import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity, Alert } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { StatusChip } from '@/components/StatusChip';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyService } from '@/types/coolify';
import { Layers, Database, Server as ServerIcon, Info, RefreshCw, ExternalLink } from 'lucide-react-native';
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

  const renderServiceItem = ({ item }: { item: CoolifyService }) => (
    <ListItem
      title={String(item.name)}
      subtitle={`Type: ${String(item.service_type)}`}
      leftIcons={[
        <Layers key="i1" size={16} color="#10B981" />,
        <Database key="i2" size={16} color="#F59E0B" />,
        <ServerIcon key="i3" size={16} color="#6B7280" />,
      ]}
      rightButtons={[
        {
          icon: <Info size={14} color="#374151" />,
          onPress: () => Alert.alert('Not linked', 'This button is a placeholder.'),
        },
        {
          icon: <RefreshCw size={14} color="#2563EB" />,
          onPress: () => Alert.alert('Not linked', 'This button is a placeholder.'),
        },
        {
          icon: <ExternalLink size={14} color="#10B981" />,
          onPress: () => Alert.alert('Not linked', 'This button is a placeholder.'),
        },
      ]}
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
          {`Apps: ${item.applications.length} | DBs: ${item.databases.length}`}
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
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Services</Text>
      </View>

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
        <Text style={styles.sectionTitle}>All Services ({services.length})</Text>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
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
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  serviceDescription: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  serviceApps: {
    fontSize: 12,
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
