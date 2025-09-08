import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  RefreshControl, 
  TouchableOpacity,
  Switch,
  Alert
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useCoolify } from '@/contexts/CoolifyContext';
import { coolifyApi } from '@/services/coolifyApi';
import { ArrowLeft, RefreshCw } from 'lucide-react-native';

interface LogsState {
  logs: string;
  isLoading: boolean;
  error: string | null;
  autoRefresh: boolean;
}

export default function LogsScreen() {
  const { uuid, name } = useLocalSearchParams<{ uuid: string; name: string }>();
  const { isConfigured, deployments } = useCoolify();
  const [logsState, setLogsState] = useState<LogsState>({
    logs: '',
    isLoading: false,
    error: null,
    autoRefresh: false,
  });
  
  const scrollViewRef = useRef<ScrollView>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Check if this app has running deployments
  const hasRunningDeployment = deployments.some(
    d => d.application_name === name && d.status === 'in_progress'
  );

  // Handle configuration and UUID validation
  useEffect(() => {
    if (!isConfigured) {
      Alert.alert('Error', 'Please configure your Coolify connection first', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/index') }
      ]);
      return;
    }

    if (!uuid) {
      Alert.alert('Error', 'No application UUID provided', [
        { text: 'OK', onPress: () => router.replace('/(tabs)/applications') }
      ]);
      return;
    }
  }, [isConfigured, uuid]);

  useEffect(() => {
    if (!isConfigured || !uuid) return;
    
    // Load logs initially
    fetchLogs();

    // Setup auto-refresh if enabled
    if (logsState.autoRefresh) {
      const interval = hasRunningDeployment ? 3000 : 10000;
      refreshIntervalRef.current = setInterval(fetchLogs, interval);
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [isConfigured, uuid, logsState.autoRefresh, hasRunningDeployment]);

  const fetchLogs = async () => {
    if (!uuid || !isConfigured) return;

    setLogsState(prev => ({ ...prev, isLoading: true, error: null }));
    
    try {
      const result = await coolifyApi.getApplicationLogs(uuid, 200);
      setLogsState(prev => ({
        ...prev,
        logs: result.logs || 'No logs available',
        isLoading: false,
      }));
      
      // Auto-scroll to bottom
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      setLogsState(prev => ({
        ...prev,
        error: `Failed to fetch logs: ${error instanceof Error ? error.message : 'Unknown error'}`,
        isLoading: false,
      }));
    }
  };

  const toggleAutoRefresh = (value: boolean) => {
    setLogsState(prev => ({ ...prev, autoRefresh: value }));
    
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
      refreshIntervalRef.current = null;
    }
  };

  const handleBackPress = () => {
    if (refreshIntervalRef.current) {
      clearInterval(refreshIntervalRef.current);
    }
    router.replace('/(tabs)/applications');
  };

  const onRefresh = async () => {
    await fetchLogs();
  };

  // Don't render if not configured or no UUID
  if (!isConfigured || !uuid) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <ArrowLeft size={20} color="#6B7280" />
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.title} numberOfLines={1}>
            {name ? decodeURIComponent(name) : 'Application Logs'}
          </Text>
          <Text style={styles.subtitle} numberOfLines={1}>
            {uuid}
          </Text>
        </View>
        <TouchableOpacity onPress={fetchLogs} disabled={logsState.isLoading}>
          <RefreshCw 
            size={20} 
            color={logsState.isLoading ? '#9CA3AF' : '#6B7280'} 
            style={{ 
              transform: [{ rotate: logsState.isLoading ? '180deg' : '0deg' }] 
            }}
          />
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <View style={styles.autoRefreshContainer}>
          <Text style={styles.controlLabel}>Auto-refresh</Text>
          <Switch
            value={logsState.autoRefresh}
            onValueChange={toggleAutoRefresh}
            trackColor={{ false: '#E5E7EB', true: '#3B82F6' }}
            thumbColor={logsState.autoRefresh ? '#FFFFFF' : '#F9FAFB'}
          />
        </View>
        {hasRunningDeployment && (
          <View style={styles.deploymentIndicator}>
            {[
              <View key="dot" style={styles.deploymentDot} />,
              <Text key="txt" style={styles.deploymentText}>Deployment running</Text>
            ]}
          </View>
        )}
      </View>

      {logsState.error && (
        <View style={styles.errorContainer}>
          {[
            <Text key="msg" style={styles.errorText}>{logsState.error}</Text>,
            <TouchableOpacity key="btn" onPress={() => setLogsState(prev => ({ ...prev, error: null }))}>
              <Text style={styles.errorDismiss}>Dismiss</Text>
            </TouchableOpacity>
          ]}
        </View>
      )}

      <ScrollView
        ref={scrollViewRef}
        style={styles.logsContainer}
        refreshControl={
          <RefreshControl refreshing={logsState.isLoading} onRefresh={onRefresh} />
        }
      >
        <Text style={styles.logsText}>
          {logsState.logs || 'Loading logs...'}
        </Text>
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
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#111827',
  },
  subtitle: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  controls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  autoRefreshContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  controlLabel: {
    fontSize: 14,
    color: '#374151',
    marginRight: 12,
    fontWeight: '500',
  },
  deploymentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  deploymentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  deploymentText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FEE2E2',
    borderColor: '#FECACA',
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
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
  logsContainer: {
    flex: 1,
    backgroundColor: '#1F2937',
    margin: 16,
    marginTop: 0,
    borderRadius: 8,
    padding: 16,
  },
  logsText: {
    fontFamily: 'Courier',
    fontSize: 12,
    color: '#F9FAFB',
    lineHeight: 16,
  },
});
