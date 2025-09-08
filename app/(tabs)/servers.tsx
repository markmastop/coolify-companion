import React, { useCallback, useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity, Modal, Alert } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { StatusChip } from '@/components/StatusChip';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyServer } from '@/types/coolify';
import { X, Cpu, Globe, Info, RefreshCw, ExternalLink, SquarePlay, SquareDot } from 'lucide-react-native';
import { ListItem } from '@/components/ListItem';
import { normalizeStatus } from '@/utils/status';
import { formatDate } from '@/utils/format';

export default function ServersScreen() {
  const { 
    servers, 
    services,
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

  // Header stats
  const totalServers = servers.length;
  const upServers = servers.filter(s => (s as any)?.settings?.is_reachable === true || (s as any)?.is_reachable === true).length;
  const downServers = Math.max(0, totalServers - upServers);
  const tunnelServers = servers.filter(s => (s as any)?.settings?.is_cloudflare_tunnel === true).length;
  const buildSlots = servers.reduce((sum, s) => sum + (Number((s as any)?.settings?.concurrent_builds) || 0), 0);

  const renderServerItem = ({ item }: { item: CoolifyServer }) => {
    const serverServices = services.filter(s => {
      const srvUuid = (s as any)?.server?.uuid;
      const srvId = (s as any)?.server?.id ?? (s as any)?.server_id;
      return String(srvUuid || srvId) === String(item.uuid) || String(srvId) === String(item.id);
    });
    const hasAnyService = serverServices.length > 0;
    const statusStr = (txt: string | undefined) => String(txt || '').toLowerCase();
    const hasUnhealthy = serverServices.some(s => {
      const v = statusStr((s as any)?.status);
      return v.includes('unhealthy') || v.includes('fail') || v.includes('error');
    });
    const hasFqdn = serverServices.some(s => Array.isArray((s as any)?.applications) && (s as any).applications.some((a: any) => !!a?.fqdn));

    const cpuColor = hasUnhealthy ? '#F59E0B' : (hasAnyService && item.settings?.is_reachable ? '#10B981' : '#9CA3AF');
    const globeColor = item.settings?.is_reachable ? (hasFqdn ? '#0EA5E9' : '#6B7280') : '#9CA3AF';

    return (
      <ListItem
        title={String(item.name)}
        leftIcons={[
          item.settings?.is_reachable 
            ? <SquarePlay key="i1" size={16} color="#10B981" />
            : <SquareDot key="i1" size={16} color="#EF4444" />,
          <Cpu key="i2" size={16} color={cpuColor} />,
          <Globe key="i3" size={16} color={globeColor} />,
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
          item.description ? (
            <Text key="desc" style={styles.serverDescription} numberOfLines={2}>
              {String(item.description)}
            </Text>
          ) : null,
          <Text key="id" style={styles.serverId} numberOfLines={1}>
            {`ID: ${String(item.id)}`}
          </Text>
        ].filter(Boolean) as React.ReactNode[]}
        status={normalizeStatus('server', Boolean(item.settings?.is_reachable))}
        showStatus={false}
        showUpdated={false}
        onPress={() => setSelectedServer(item)}
        containerStyle={styles.serverRow}
      />
    );
  };

  const sortedServers = [...servers].sort((a, b) => a.name.localeCompare(b.name));

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Servers</Text>
        <Text style={styles.headerSummary}>
          {String(totalServers)} total • {String(upServers)} up • {String(downServers)} down • {String(tunnelServers)} tunnels • {String(buildSlots)} slots
        </Text>
        <View style={styles.progressContainer}>
          <View
            style={[
              styles.progressFill,
              {
                width: `${Math.round((upServers / Math.max(totalServers || 1, 1)) * 100)}%`,
                backgroundColor: downServers > 0 ? '#F59E0B' : '#10B981',
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
                <Text style={styles.detailValue}>{String(formatDate(selectedServer.settings?.created_at || null))}</Text>
              </View>
            </ScrollView>
          </View>
        )}
      </Modal>
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
  serversContainer: {
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
  serverId: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 2,
    fontWeight: '500',
  },
  serverDescription: {
    fontSize: 12,
    color: '#64748B',
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
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: Platform.OS === 'ios' ? 64 : 44,
    backgroundColor: Platform.OS === 'web' ? 'rgba(255, 255, 255, 0.95)' : '#FFFFFF',
    backdropFilter: Platform.OS === 'web' ? 'blur(20px)' : undefined,
    borderBottomWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.3,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  detailRow: {
    backgroundColor: Platform.OS === 'web' ? 'rgba(248, 250, 252, 0.8)' : '#F8FAFC',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 0,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 8,
    elevation: 1,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    fontSize: 15,
    color: '#111827',
    fontWeight: '600',
    letterSpacing: -0.1,
  },
  serverRow: {},
});
