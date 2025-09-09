import React, { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity, Platform } from 'react-native';
import { useCoolify } from '@/contexts/CoolifyContext';
import { StatusChip } from '@/components/StatusChip';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyDeployment } from '@/types/coolify';
import { PlugZap, Server, Smartphone, Settings, RefreshCcw, TrendingUp } from 'lucide-react-native';

export default function DashboardScreen() {
  const { 
    servers, 
    applications,
    deployments, 
    services,
    version,
    isLoading, 
    error, 
    isConfigured, 
    refreshDeployments, 
    refreshServers,
    refreshServices,
    refreshApplications,
    refreshVersion,
    refreshingServers,
    refreshingApplications,
    refreshingServices,
    clearError 
  } = useCoolify();

  // Removed auto-refresh; use pull-to-refresh instead

  const onRefresh = useCallback(async () => {
    clearError();
    await Promise.all([refreshServers(), refreshDeployments(), refreshServices(), refreshApplications()]);
  }, [refreshServers, refreshDeployments, refreshServices, refreshApplications, clearError]);

  if (!isConfigured) {
    return <ConfigScreen />;
  }

  const serversUp = servers.filter(s => s.settings.is_reachable).length;
  const serversDown = servers.filter(s => !s.settings.is_reachable).length;
  
  // Longest uptime across servers
  const getUptimeSeconds = (srv: any): number => {
    const direct = Number((srv?.uptime_seconds ?? srv?.uptime) as any);
    if (!isNaN(direct) && direct > 0) return direct;
    const lastOnline = srv?.last_online_at || srv?.settings?.updated_at;
    if (lastOnline) {
      const t = new Date(String(lastOnline)).getTime();
      if (!isNaN(t)) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - t) / 1000));
        return diff;
      }
    }
    const created = srv?.created_at || srv?.settings?.created_at;
    if (created) {
      const t = new Date(String(created)).getTime();
      if (!isNaN(t)) {
        const now = Date.now();
        const diff = Math.max(0, Math.floor((now - t) / 1000));
        return diff;
      }
    }
    return 0;
  };

  const formatDuration = (seconds: number): string => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  const longestUptimeServer = servers
    .map(s => ({ server: s, secs: getUptimeSeconds(s) }))
    .sort((a, b) => b.secs - a.secs)[0];
  
  // Applications stats
  const totalApplications = applications.length;
  const applicationsUp = applications.filter(app => {
    const raw = String(app.status || '').toLowerCase();
    const [primary] = raw.split(':');
    return primary.includes('running');
  }).length;
  const applicationsDown = totalApplications - applicationsUp;
  // Extra app stats for summary bar
  const totalApps = totalApplications;
  const appsRunning = applicationsUp;
  const appsDown = applicationsDown;
  const appsWithDomain = applications.filter(app => !!(app as any)?.fqdn).length;
  const appsWithHealth = applications.filter(app => (app as any)?.health_check_enabled === true).length;
  
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
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.titleSection}>
            <Text style={styles.title}>Coolify Companion</Text>
            <Text style={styles.subtitle}>Your infrastructure at a glance!</Text>
          </View>
        </View>
        <View style={styles.headerActions}>
          <View style={[styles.connectionIndicator, (refreshingServers || refreshingApplications || refreshingServices) && styles.connectionIndicatorRefreshing]}>
            {refreshingServers || refreshingApplications || refreshingServices ? (
              <RefreshCcw size={18} color="#6366F1" />
            ) : (
              <PlugZap size={18} color="#10B981" />
            )}
          </View>
        </View>
      </View>
      <View style={styles.summaryBar}>
        <Text style={styles.headerSummary}>
          <TrendingUp size={14} color="#6366F1" /> Version {String(version)}
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

        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.iconTop}>
                <Server size={20} color={serversIconColor} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardValue}>{String(serversUp)}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>Servers</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>{String(servers.length)} total</Text>
            <Text
              style={[
                styles.cardMeta,
                serversDown > 0 ? styles.cardDownDanger : styles.cardDownOk,
              ]}
              numberOfLines={1}
            >
              {serversDown > 0 ? `${String(serversDown)} down` : 'All up'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.iconTop}>
                <Smartphone size={20} color={appsIconColor} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardValue}>{String(applicationsUp)}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>Applications</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>{String(totalApplications)} total</Text>
            <Text
              style={[
                styles.cardMeta,
                applicationsDown > 0 ? styles.cardDownDanger : styles.cardDownOk,
              ]}
              numberOfLines={1}
            >
              {applicationsDown > 0 ? `${String(applicationsDown)} down` : 'All up'}
            </Text>
          </View>

          <View style={styles.statCard}>
            <View style={styles.cardTopRow}>
              <View style={styles.iconTop}>
                <Settings size={20} color={servicesIconColor} strokeWidth={2.5} />
              </View>
              <Text style={styles.cardValue}>{String(servicesUp)}</Text>
            </View>
            <Text style={styles.cardTitle} numberOfLines={1}>Services</Text>
            <Text style={styles.cardMeta} numberOfLines={1}>{String(totalServices)} total</Text>
            <Text
              style={[
                styles.cardMeta,
                servicesDown > 0 ? styles.cardDownDanger : styles.cardDownOk,
              ]}
              numberOfLines={1}
            >
              {servicesDown > 0 ? `${String(servicesDown)} down` : 'All up'}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Running Deployments</Text>
            <View style={styles.sectionBadge}>
              <Text style={styles.sectionBadgeText}>{deployments.length}</Text>
            </View>
          </View>
          {deployments.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No deployments found yet. Any deployments planned?</Text>
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFBFC',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  headerContent: {
    flex: 1,
  },
  titleSection: {
    gap: 2,
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
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  versionBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Platform.OS === 'web' ? 'rgba(248, 250, 252, 0.8)' : '#F8FAFC',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    borderBottomWidth: 0,
  },
  versionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  versionText: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  // Summary bar below header (applications)
  summaryBar: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: Platform.OS === 'web' ? 'rgba(248, 250, 252, 0.8)' : '#F8FAFC',
    backdropFilter: Platform.OS === 'web' ? 'blur(10px)' : undefined,
    borderBottomWidth: 0,
  },
  headerSummary: {
    marginTop: 0,
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
  connectionIndicator: {
    backgroundColor: '#DCFCE7',
    borderRadius: 16,
    padding: 10,
    borderWidth: 0,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  connectionIndicatorRefreshing: {
    backgroundColor: '#E0E7FF',
    shadowColor: '#6366F1',
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
    fontWeight: '600',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  cardHeader: {
    display: 'none',
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: 'transparent',
  },
  cardContent: {
    flex: 1,
    marginLeft: 12,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  iconTop: {
    width: 28,
    height: 28,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  cardValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#111827',
    letterSpacing: -0.5,
  },
  cardTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 0,
  },
  cardTotal: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
    marginBottom: 0,
  },
  cardSubtitle: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  cardMeta: {
    fontSize: 12,
    fontWeight: '500',
    color: '#64748B',
  },
  cardDownDanger: {
    color: '#B91C1C',
    fontWeight: '700',
  },
  cardDownOk: {
    color: '#065F46',
    fontWeight: '700',
  },
  section: {
    margin: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: -0.3,
  },
  sectionBadge: {
    backgroundColor: '#6366F1',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  sectionBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  deploymentsContainer: {
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
  deploymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  deploymentInfo: {
    flex: 1,
  },
  deploymentApp: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
    letterSpacing: -0.2,
  },
  deploymentServer: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '500',
  },
  deploymentMeta: {
    alignItems: 'flex-end',
  },
  deploymentTime: {
    fontSize: 11,
    color: '#94A3B8',
    marginTop: 4,
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
});
