import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { StatusChip } from '@/components/StatusChip';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyService } from '@/types/coolify';

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getServiceStatusColor = (status: string): 'green' | 'red' | 'blue' | 'orange' => {
    if (status.includes('running') && status.includes('healthy')) return 'green';
    if (status.includes('running') && status.includes('unhealthy')) return 'orange';
    if (status.includes('running')) return 'blue';
    return 'red';
  };

  const renderServiceItem = ({ item }: { item: CoolifyService }) => (
    <View style={styles.serviceRow}>
      <View style={styles.serviceInfo}>
        <Text style={styles.serviceName} numberOfLines={1}>
          {String(item.name)}
        </Text>
        <Text style={styles.serviceType} numberOfLines={1}>
          Type: {String(item.service_type)}
        </Text>
        <Text style={styles.serviceServer} numberOfLines={1}>
          Server: {String(item.server.name)}
        </Text>
        {item.description && (
          <Text style={styles.serviceDescription} numberOfLines={2}>
            {String(item.description)}
          </Text>
        )}
        <Text style={styles.serviceApps}>
          Apps: {item.applications.length} | DBs: {item.databases.length}
        </Text>
        <Text style={styles.lastUpdate}>
          Updated: {String(formatDate(item.updated_at))}
        </Text>
      </View>
      <View style={styles.serviceMeta}>
        {[
          <StatusChip 
            key="chip"
            status={getServiceStatusColor(item.status) === 'green' ? 'success' : 
                   getServiceStatusColor(item.status) === 'orange' ? 'running' :
                   getServiceStatusColor(item.status) === 'blue' ? 'running' : 'failed'} 
            size="small" 
          />,
          <Text key="text" style={styles.serviceStatus}>
            {String(item.status)}
          </Text>
        ]}
      </View>
    </View>
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
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
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
