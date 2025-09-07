import React, { useCallback, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, FlatList, TouchableOpacity, Alert } from 'react-native';
import { router } from 'expo-router';
import { useCoolify } from '@/contexts/CoolifyContext';
import { ConfigScreen } from '@/components/ConfigScreen';
import { CoolifyApplication } from '@/types/coolify';
import { coolifyApi } from '@/services/coolifyApi';
import { FileText, RotateCcw } from 'lucide-react-native';

export default function ApplicationsScreen() {
  const { 
    applications, 
    isLoading, 
    error, 
    isConfigured, 
    refreshApplications,
    clearError 
  } = useCoolify();

  // Auto-refresh every 30 seconds
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
    router.push(`/logs?uuid=${app.uuid}&name=${encodeURIComponent(app.name)}`);
  };

  const handleRedeploy = async (app: CoolifyApplication) => {
    Alert.alert(
      'Confirm Redeploy',
      `Are you sure you want to redeploy "${app.name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Redeploy',
          style: 'destructive',
          onPress: async () => {
            try {
              const result = await coolifyApi.triggerRedeploy(app.uuid);
              Alert.alert(
                'Success', 
                result.message || 'Redeploy triggered successfully'
              );
            } catch (error) {
              Alert.alert(
                'Error',
                `Failed to trigger redeploy: ${error instanceof Error ? error.message : 'Unknown error'}`
              );
            }
          }
        }
      ]
    );
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const renderApplicationItem = ({ item }: { item: CoolifyApplication }) => (
    <View style={styles.appRow}>
      <View style={styles.appInfo}>
        <Text style={styles.appName} numberOfLines={1}>
          {String(item.name)}
        </Text>
        <Text style={styles.appId} numberOfLines={1}>
          UUID: {String(item.uuid)}
        </Text>
        {item.description && (
          <Text style={styles.appDescription} numberOfLines={2}>
            {String(item.description)}
          </Text>
        )}
        {item.git_repository && (
          <Text style={styles.appRepo} numberOfLines={1}>
            {String(item.git_repository)} ({String(item.git_branch || 'main')})
          </Text>
        )}
        <Text style={styles.appStatus}>
          Status: {String(item.status)}
        </Text>
        <Text style={styles.lastUpdate}>
          Updated: {String(formatDate(item.updated_at))}
        </Text>
      </View>
      <View style={styles.appActions}>
        <TouchableOpacity 
          style={styles.actionButton}
          onPress={() => handleViewLogs(item)}
        >
          <FileText size={16} color="#3B82F6" />
          <Text style={styles.actionButtonText}>Logs</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={[styles.actionButton, styles.redeployButton]}
          onPress={() => handleRedeploy(item)}
        >
          <RotateCcw size={16} color="#EF4444" />
          <Text style={[styles.actionButtonText, styles.redeployButtonText]}>Redeploy</Text>
        </TouchableOpacity>
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
        <Text style={styles.title}>Applications</Text>
      </View>

      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{String(error)}</Text>
          <TouchableOpacity onPress={clearError}>
            <Text style={styles.errorDismiss}>Dismiss</Text>
          </TouchableOpacity>
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>All Applications ({String(applications.length)})</Text>
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
  applicationsContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    paddingVertical: 8,
  },
  appRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
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
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 4,
  },
  appRepo: {
    fontSize: 12,
    color: '#3B82F6',
    marginBottom: 4,
  },
  appStatus: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 4,
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