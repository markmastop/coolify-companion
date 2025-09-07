import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { StatCard } from '@/components/StatCard';
import { StatusChip } from '@/components/StatusChip';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyDeployment } from '@/types/coolify';
import { RefreshCw } from 'lucide-react-native';

export default function DashboardScreen() {
  const { 
    servers, 
    deployments, 
    isLoading, 
    error, 
    isConfigured, 
    refreshDeployments, 
    refreshServers,
    clearError 
  } = useCoolify();

  const onRefresh = useCallback(async () => {
    clearError();
    await Promise.all([refreshServers(), refreshDeployments()]);
  }, [refreshServers, refreshDeployments, clearError]);

  if (!isConfigured) {
    return <ConfigScreen />;
  }

  const serversUp = servers.filter(s => s.settings.is_reachable).length;
  const serversDown = servers.filter(s => !s.settings.is_reachable).length;
  const runningDeployments = deployments.filter(d => d.status === 'running').length;

  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / (1000 * 60));
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffMins < 1440) return `${Math.floor(diffMins / 60)}h ago`;
    return `${Math.floor(diffMins / 1440)}d ago`;
  };

  const renderDeploymentItem = ({ item }: { item: CoolifyDeployment }) => (
    <View style={styles.deploymentRow}>
      <View style={styles.deploymentInfo}>
        <Text style={styles.deploymentApp} numberOfLines={1}>
          {item.application_name}
        </Text>
        <Text style={styles.deploymentServer} numberOfLines={1}>
          {item.server_name}
        </Text>
      </View>
      <View style={styles.deploymentMeta}>
        <StatusChip status={item.status} size="small" />
        <Text style={styles.deploymentTime}>
          {formatTimeAgo(item.created_at)}
        </Text>
      </View>
    </View>
  );

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={onRefresh} />
      }
    >
      <View style={styles.header}>
        <Text style={styles.title}>Coolify Monitor</Text>
        <TouchableOpacity onPress={onRefresh} disabled={isLoading}>
          <RefreshCw 
            size={20} 
            color={isLoading ? '#9CA3AF' : '#6B7280'} 
            style={{ transform: [{ rotate: isLoading ? '180deg' : '0deg' }] }}
          />
        </TouchableOpacity>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.statsContainer}>
        <StatCard
          title="Servers UP"
          value={serversUp}
          color="green"
          icon="✅"
        />
        <StatCard
          title="Servers DOWN"
          value={serversDown}
          color="red"
          icon="❌"
        />
        <StatCard
          title="Running Deployments"
          value={runningDeployments}
          color="blue"
          icon="🚀"
        />
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Recent Deployments</Text>
        {deployments.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>No deployments found</Text>
            <Text style={styles.emptyStateSubtext}>
              Pull to refresh or check your connection
            </Text>
          </View>
        ) : (
          <View style={styles.deploymentsContainer}>
            <FlatList
              data={deployments.slice(0, 10)}
              renderItem={renderDeploymentItem}
              keyExtractor={(item) => item.id}
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
  statsContainer: {
    flexDirection: 'row',
    padding: 16,
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
  deploymentsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
  },
  deploymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  deploymentInfo: {
    flex: 1,
  },
  deploymentApp: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    marginBottom: 2,
  },
  deploymentServer: {
    fontSize: 14,
    color: '#6B7280',
  },
  deploymentMeta: {
    alignItems: 'flex-end',
  },
  deploymentTime: {
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
});