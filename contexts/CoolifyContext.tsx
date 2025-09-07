import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { coolifyApi } from '@/services/coolifyApi';
import { CoolifyServer, CoolifyDeployment, CoolifyApplication, CoolifyService, ApiConfig } from '@/types/coolify';

interface CoolifyContextType {
  config: ApiConfig | null;
  servers: CoolifyServer[];
  deployments: CoolifyDeployment[];
  applications: CoolifyApplication[];
  services: CoolifyService[];
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  setConfig: (config: ApiConfig) => Promise<void>;
  refreshServers: () => Promise<void>;
  refreshDeployments: () => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshServices: () => Promise<void>;
  clearError: () => void;
}

const CoolifyContext = createContext<CoolifyContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CONFIG: 'coolify_config',
  SERVERS: 'coolify_servers',
  DEPLOYMENTS: 'coolify_deployments',
  APPLICATIONS: 'coolify_applications',
  SERVICES: 'coolify_services',
};

interface CoolifyProviderProps {
  children: ReactNode;
}

export function CoolifyProvider({ children }: CoolifyProviderProps) {
  const [config, setConfigState] = useState<ApiConfig | null>(null);
  const [servers, setServers] = useState<CoolifyServer[]>([]);
  const [deployments, setDeployments] = useState<CoolifyDeployment[]>([]);
  const [applications, setApplications] = useState<CoolifyApplication[]>([]);
  const [services, setServices] = useState<CoolifyService[]>([]);
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

    const hasRunningDeployments = deployments.some(d => d.status === 'in_progress');
    const deploymentInterval = 10000; // Always 10 seconds for deployments
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
      const storedServices = await AsyncStorage.getItem(STORAGE_KEYS.SERVICES);

      if (storedConfig) {
        const parsedConfig = JSON.parse(storedConfig);
        setConfigState(parsedConfig);
        coolifyApi.setConfig(parsedConfig);
        setIsConfigured(true);
      }

      if (storedServers) setServers(JSON.parse(storedServers));
      if (storedDeployments) setDeployments(JSON.parse(storedDeployments));
      if (storedApplications) setApplications(JSON.parse(storedApplications));
      if (storedServices) setServices(JSON.parse(storedServices));
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
        refreshServices(),
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
      console.log('Applications API Response:', data);
      setApplications(data);
      await AsyncStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch applications: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshServices = async () => {
    if (!isConfigured) return;
    
    try {
      setIsLoading(true);
      const data = await coolifyApi.getServices();
      setServices(data);
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch services: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
        services,
        isLoading,
        error,
        isConfigured,
        setConfig,
        refreshServers,
        refreshDeployments,
        refreshApplications,
        refreshServices,
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
