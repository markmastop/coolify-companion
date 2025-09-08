import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { StatusChip } from '@/components/StatusChip';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyDeployment } from '@/types/coolify';
import { Wifi, Server, Smartphone, Settings, RefreshCcw } from 'lucide-react-native';

export default function DashboardScreen() {
  const { 
    servers, 
    applications,
    deployments, 
    services,
    isLoading, 
    error, 
    isConfigured, 
    refreshDeployments, 
    refreshServers,
    refreshServices,
    refreshApplications,
    refreshingServers,
    refreshingApplications,
    refreshingServices,
    clearError 
  } = useCoolify();

  // Auto-refresh: deployments every 15s; others every 30s
  useEffect(() => {
    const deploymentInterval = setInterval(refreshDeployments, 15000);
    const otherInterval = setInterval(() => {
      refreshServers();
      refreshServices();
      refreshApplications();
    }, 30000);

    return () => {
      clearInterval(deploymentInterval);
      clearInterval(otherInterval);
    };
  }, [refreshServers, refreshDeployments, refreshServices, refreshApplications]);

  const onRefresh = useCallback(async () => {
    clearError();
    await Promise.all([refreshServers(), refreshDeployments(), refreshServices(), refreshApplications()]);
  }, [refreshServers, refreshDeployments, refreshServices, refreshApplications, clearError]);

  if (!isConfigured) {
    return <ConfigScreen />;
  }

  const serversUp = servers.filter(s => s.settings.is_reachable).length;
  const serversDown = servers.filter(s => !s.settings.is_reachable).length;
  
  // Applications stats
  const totalApplications = applications.length;
  const applicationsUp = applications.filter(app => {
    const raw = String(app.status || '').toLowerCase();
    const [primary] = raw.split(':');
    return primary.includes('running');
  }).length;
  const applicationsDown = totalApplications - applicationsUp;
  
  // Services stats  
  const totalServices = services.length;
  const servicesUp = services.filter(service => {
    const raw = String(service.status || '').toLowerCase();
    const [primary, secondary] = raw.split(':');
    return primary.includes('running') && (secondary ? secondary.includes('healthy') : true);
  }).length;
  const servicesDown = totalServices - servicesUp;

  const serversIconColor = serversDown > 0 ? '#F59E0B' : '#10B981';
  const appsIconColor = applicationsDown > 0 ? '#F59E0B' : '#10B981';
  const servicesIconColor = servicesDown > 0 ? '#F59E0B' : '#10B981';

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
          {String(item.application_name)}
        </Text>
        <Text style={styles.deploymentServer} numberOfLines={1}>
          {String(item.server_name)}
        </Text>
      </View>
      <View style={styles.deploymentMeta}>
        {[
          <StatusChip key="chip" status={item.status === 'in_progress' ? 'running' : item.status} size="small" />,
          <Text key="time" style={styles.deploymentTime}>
            {formatTimeAgo(item.created_at)}
          </Text>
        ]}
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
          <Text style={styles.title}>Coolify Companion</Text>
          <View style={styles.headerActions}>
          <View style={[styles.connectionIndicator, (refreshingServers || refreshingApplications || refreshingServices) && styles.connectionIndicatorRefreshing]}>
            {refreshingServers || refreshingApplications || refreshingServices ? (
              <RefreshCcw size={16} color="#2563EB" />
            ) : (
              <Wifi size={16} color="#10B981" />
            )}
          </View>
          </View>
        </View>

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

      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            {[
              <Server key="icon" size={20} color={serversIconColor} />,
              <Text key="value" style={styles.cardValue}>{String(serversUp)}</Text>
            ]}
          </View>
          <Text style={styles.cardTitle}>{String(servers.length)} Servers</Text>
          <Text style={styles.cardSubtitle}>{String(serversDown)} down</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            {[
              <Smartphone key="icon" size={20} color={appsIconColor} />,
              <Text key="value" style={styles.cardValue}>{String(applicationsUp)}</Text>
            ]}
          </View>
          <Text style={styles.cardTitle}>{String(totalApplications)} Apps</Text>
          <Text style={styles.cardSubtitle}>{String(applicationsDown)} down</Text>
        </View>
        
        <View style={styles.statCard}>
          <View style={styles.cardHeader}>
            {[
              <Settings key="icon" size={20} color={servicesIconColor} />,
              <Text key="value" style={styles.cardValue}>{String(servicesUp)}</Text>
            ]}
          </View>
          <Text style={styles.cardTitle}>{String(totalServices)} Services</Text>
          <Text style={styles.cardSubtitle}>{String(servicesDown)} down</Text>
        </View>
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
              keyExtractor={(item) => String(item.deployment_uuid)}
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
  connectionIndicatorRefreshing: {
    backgroundColor: '#DBEAFE',
    borderColor: '#2563EB',
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
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#F3F4F6',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  cardValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#111827',
  },
  cardTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  cardSubtitle: {
    fontSize: 10,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 2,
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
