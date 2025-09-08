import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity, Modal } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { StatusChip } from '@/components/StatusChip';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyServer } from '@/types/coolify';
import { X } from 'lucide-react-native';

export default function ServersScreen() {
  const { 
    servers, 
    isLoading, 
    error, 
    isConfigured, 
    refreshServers,
    clearError 
  } = useCoolify();
  
  const [selectedServer, setSelectedServer] = useState<CoolifyServer | null>(null);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refreshServers();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshServers]);

  const onRefresh = useCallback(async () => {
    clearError();
    await refreshServers();
  }, [refreshServers, clearError]);

  if (!isConfigured) {
    return <ConfigScreen />;
  }

  const formatDate = (dateString: string) => {
    if (!dateString) return 'No date';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid date';
    return date.toLocaleDateString();
  };

  const renderServerItem = ({ item }: { item: CoolifyServer }) => (
    <TouchableOpacity
      style={styles.serverRow}
      onPress={() => setSelectedServer(item)}
    >
      <View style={styles.serverInfo}>
        <Text style={styles.serverName} numberOfLines={1}>
          {String(item.name)}
        </Text>
        <Text style={styles.serverId} numberOfLines={1}>
          ID: {String(item.id)}
        </Text>
        {item.description && (
          <Text style={styles.serverDescription} numberOfLines={2}>
            {String(item.description)}
          </Text>
        )}
      </View>
      <View style={styles.serverMeta}>
        {[
          <StatusChip key="chip" status={item.settings.is_reachable ? 'up' : 'down'} size="small" />,
          <Text key="text" style={styles.lastUpdate}>
            {String(formatDate(item.settings?.created_at || 'No date available'))}
          </Text>
        ]}
      </View>
    </TouchableOpacity>
  );

  const sortedServers = [...servers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <ScrollView 
        style={styles.container}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        <View style={styles.header}>
          <Text style={styles.title}>Servers</Text>
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
          <Text style={styles.sectionTitle}>All Servers ({servers.length})</Text>
          {servers.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No servers found</Text>
              <Text style={styles.emptyStateSubtext}>
                Pull to refresh or check your connection
              </Text>
            </View>
          ) : (
            <View style={styles.serversContainer}>
              <FlatList
                data={sortedServers}
                renderItem={renderServerItem}
               keyExtractor={(item) => item.uuid}
                scrollEnabled={false}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            </View>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={selectedServer !== null}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        {selectedServer && (
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Server Details</Text>
              <TouchableOpacity onPress={() => setSelectedServer(null)}>
                <X size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Name</Text>
                <Text style={styles.detailValue}>{String(selectedServer.name)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Status</Text>
                <StatusChip status={selectedServer.settings.is_reachable ? 'up' : 'down'} />
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>UUID</Text>
                <Text style={styles.detailValue}>{String(selectedServer.uuid)}</Text>
              </View>
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>ID</Text>
                <Text style={styles.detailValue}>{String(selectedServer.id)}</Text>
              </View>
              
              {selectedServer.description && (
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Description</Text>
                  <Text style={styles.detailValue}>{String(selectedServer.description)}</Text>
                </View>
              )}
              
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Created</Text>
                <Text style={styles.detailValue}>{String(formatDate(selectedServer.settings?.created_at || 'No date available'))}</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
    </>
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 16,
  },
  serversContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
  },
  serverRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  serverInfo: {
    flex: 1,
  },
  serverName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  serverId: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  serverDescription: {
    fontSize: 14,
    color: '#6B7280',
  },
  serverMeta: {
    alignItems: 'flex-end',
  },
  lastUpdate: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#111827',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  detailRow: {
    marginBottom: 20,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    color: '#111827',
  },
});
