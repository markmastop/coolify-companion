import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { coolifyApi } from '@/services/coolifyApi';
import { CoolifyServer, CoolifyDeployment, CoolifyApplication, ApiConfig } from '@/types/coolify';

interface CoolifyContextType {
  config: ApiConfig | null;
  servers: CoolifyServer[];
  deployments: CoolifyDeployment[];
  applications: CoolifyApplication[];
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  setConfig: (config: ApiConfig) => Promise<void>;
  refreshServers: () => Promise<void>;
  refreshDeployments: () => Promise<void>;
  refreshApplications: () => Promise<void>;
  clearError: () => void;
}

const CoolifyContext = createContext<CoolifyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONFIG: 'coolify_config',
  SERVERS: 'coolify_servers',
  DEPLOYMENTS: 'coolify_deployments',
  APPLICATIONS: 'coolify_applications',
};

interface CoolifyProviderProps {
  children: ReactNode;
}

export function CoolifyProvider({ children }: CoolifyProviderProps) {
  const [config, setConfigState] = useState<ApiConfig | null>(null);
  const [servers, setServers] = useState<CoolifyServer[]>([]);
  const [deployments, setDeployments] = useState<CoolifyDeployment[]>([]);
  const [applications, setApplications] = useState<CoolifyApplication[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);

  // Load config and cached data on startup
  useEffect(() => {
    loadStoredData();

    // Register a global unauthorized handler so any 401/403 forces re-login
    coolifyApi.setUnauthorizedHandler(async () => {
      try {
        await AsyncStorage.removeItem(STORAGE_KEYS.CONFIG);
        await AsyncStorage.removeItem(STORAGE_KEYS.SERVERS);
        await AsyncStorage.removeItem(STORAGE_KEYS.DEPLOYMENTS);
        await AsyncStorage.removeItem(STORAGE_KEYS.APPLICATIONS);
      } catch {}

      setConfigState(null);
      setServers([]);
      setDeployments([]);
      setApplications([]);
      setIsConfigured(false);
      setError('Connection error or invalid configuration. Please log in again.');
    });
  }, []);

  // Setup polling when configured
  useEffect(() => {
    if (!isConfigured) return;

    const hasRunningDeployments = deployments.some(d => d.status === 'running');
    const deploymentInterval = hasRunningDeployments ? 5000 : 30000;
    const serverInterval = 30000;

    const deploymentPoller = setInterval(refreshDeployments, deploymentInterval);
    const serverPoller = setInterval(refreshServers, serverInterval);

    return () => {
      clearInterval(deploymentPoller);
      clearInterval(serverPoller);
    };
  }, [isConfigured, deployments]);

  const loadStoredData = async () => {
    try {
      const storedConfig = await AsyncStorage.getItem(STORAGE_KEYS.CONFIG);
      const storedServers = await AsyncStorage.getItem(STORAGE_KEYS.SERVERS);
      const storedDeployments = await AsyncStorage.getItem(STORAGE_KEYS.DEPLOYMENTS);
      const storedApplications = await AsyncStorage.getItem(STORAGE_KEYS.APPLICATIONS);

      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setConfigState(parsedConfig);
        coolifyApi.setConfig(parsedConfig);
        setIsConfigured(true);
      }

      if (storedServers) setServers(JSON.parse(storedServers));
      if (storedDeployments) setDeployments(JSON.parse(storedDeployments));
      if (storedApplications) setApplications(JSON.parse(storedApplications));
    } catch (err) {
      console.error('Failed to load stored data:', err);
    }
  };

  const setConfig = async (newConfig: ApiConfig) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(newConfig));
      setConfigState(newConfig);
      coolifyApi.setConfig(newConfig);
      setIsConfigured(true);
      setError(null);
      
      // Load initial data
      await Promise.all([
        refreshServers(),
        refreshDeployments(),
        refreshApplications(),
      ]);
    } catch (err) {
      setError('Failed to save configuration');
    }
  };

  const refreshServers = async () => {
    if (!isConfigured) return;
    
    try {
      setIsLoading(true);
      const data = await coolifyApi.getServers();
      setServers(data);
      await AsyncStorage.setItem(STORAGE_KEYS.SERVERS, JSON.stringify(data));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch servers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshDeployments = async () => {
    if (!isConfigured) return;
    
    try {
      setIsLoading(true);
      const data = await coolifyApi.getDeployments();
      setDeployments(data);
      await AsyncStorage.setItem(STORAGE_KEYS.DEPLOYMENTS, JSON.stringify(data));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch deployments: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshApplications = async () => {
    if (!isConfigured) return;
    
    try {
      setIsLoading(true);
      const data = await coolifyApi.getApplications();
      setApplications(data);
      await AsyncStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch applications: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const clearError = () => setError(null);

  return (
    <CoolifyContext.Provider
      value={{
        config,
        servers,
        deployments,
        applications,
        isLoading,
        error,
        isConfigured,
        setConfig,
        refreshServers,
        refreshDeployments,
        refreshApplications,
        clearError,
      }}
    >
      {children}
    </CoolifyContext.Provider>
  );
}

export function useCoolify() {
  const context = useContext(CoolifyContext);
  if (context === undefined) {
    throw new Error('useCoolify must be used within a CoolifyProvider');
  }
  return context;
}
