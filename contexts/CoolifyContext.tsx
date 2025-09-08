import React, { createContext, useContext, useState, useEffect, useRef, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { coolifyApi } from '@/services/coolifyApi';
import { CoolifyServer, CoolifyDeployment, CoolifyApplication, CoolifyService, ApiConfig } from '@/types/coolify';

interface CoolifyContextType {
  config: ApiConfig | null;
  servers: CoolifyServer[];
  deployments: CoolifyDeployment[];
  applications: CoolifyApplication[];
  services: CoolifyService[];
  version: string | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  refreshingServers: boolean;
  refreshingApplications: boolean;
  refreshingServices: boolean;
  setConfig: (config: ApiConfig) => Promise<void>;
  refreshServers: () => Promise<void>;
  refreshDeployments: () => Promise<void>;
  refreshApplications: () => Promise<void>;
  refreshServices: () => Promise<void>;
  refreshVersion: () => Promise<void>;
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
  const [version, setVersion] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isConfigured, setIsConfigured] = useState(false);
  const [refreshingServers, setRefreshingServers] = useState(false);
  const [refreshingApplications, setRefreshingApplications] = useState(false);
  const [refreshingServices, setRefreshingServices] = useState(false);
  const isMounted = useRef(false);

  // Load config and cached data on startup
  useEffect(() => {
    isMounted.current = true;
    loadStoredData();

    // Register a global error handler: on any API error, return to login
    coolifyApi.setUnauthorizedHandler(async () => {
      // For now, keep cached credentials so they can be shown on the login screen
      // Do not clear stored config; simply mark as not configured to show ConfigScreen
      if (isMounted.current) {
        setIsConfigured(false);
        setError('API error. Please verify your configuration and log in again.');
      }
    });

    return () => {
      isMounted.current = false;
    };
  }, []);

  // Setup polling when configured
  useEffect(() => {
    if (!isConfigured) return;

    const deploymentInterval = 15000; // deployments every 15s
    const commonInterval = 30000; // servers/apps/services every 30s

    const deploymentPoller = setInterval(refreshDeployments, deploymentInterval);
    const serversPoller = setInterval(refreshServers, commonInterval);
    const applicationsPoller = setInterval(refreshApplications, commonInterval);
    const servicesPoller = setInterval(refreshServices, commonInterval);

    return () => {
      clearInterval(deploymentPoller);
      clearInterval(serversPoller);
      clearInterval(applicationsPoller);
      clearInterval(servicesPoller);
    };
  }, [isConfigured, deployments]);

  // Ensure data is fetched immediately after configuration if caches are empty
  useEffect(() => {
    if (!isConfigured) return;
    const needsInitialFetch =
      servers.length === 0 ||
      deployments.length === 0 ||
      applications.length === 0 ||
      services.length === 0;
    if (needsInitialFetch) {
      Promise.all([
        refreshServers(),
        refreshDeployments(),
        refreshApplications(),
        refreshServices(),
        refreshVersion(),
      ]).catch(() => {
        // errors are handled inside each refresh
      });
    } else {
      // Even if caches are present, fetch version once to populate the UI
      refreshVersion().catch(() => {});
    }
  }, [isConfigured]);

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
        refreshVersion(),
      ]);
    } catch (err) {
      setError('Failed to save configuration');
    }
  };

  const refreshVersion = async () => {
    if (!isConfigured) return;
    try {
      const v = await coolifyApi.getVersion();
      console.log('Version API Response:', v);
      if (isMounted.current) {
        setVersion(String(v));
      }
    } catch (err) {
      console.warn('Failed to fetch version', err);
    }
  };

  const refreshServers = async () => {
    if (!isConfigured) return;
    
    try {
      if (isMounted.current) {
        setIsLoading(true);
        setRefreshingServers(true);
      }
      const data = await coolifyApi.getServers();
      console.log('Servers API Response:', data);
      if (isMounted.current) {
        setServers(data);
        setError(null);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.SERVERS, JSON.stringify(data));
    } catch (err) {
      if (isMounted.current) {
        setError(`Failed to fetch servers: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setRefreshingServers(false);
      }
    }
  };

  const refreshDeployments = async () => {
    if (!isConfigured) return;
    
    try {
      if (isMounted.current) {
        setIsLoading(true);
      }
      const data = await coolifyApi.getDeployments();
      console.log('Deployments API Response:', data);
      if (isMounted.current) {
        setDeployments(data);
        setError(null);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.DEPLOYMENTS, JSON.stringify(data));
    } catch (err) {
      if (isMounted.current) {
        setError(`Failed to fetch deployments: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
      }
    }
  };

  const refreshApplications = async () => {
    if (!isConfigured) return;
    
    try {
      if (isMounted.current) {
        setIsLoading(true);
        setRefreshingApplications(true);
      }
      const data = await coolifyApi.getApplications();
      console.log('Applications API Response:', data);
      if (isMounted.current) {
        setApplications(data);
        setError(null);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data));
    } catch (err) {
      if (isMounted.current) {
        setError(`Failed to fetch applications: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setRefreshingApplications(false);
      }
    }
  };

  const refreshServices = async () => {
    if (!isConfigured) return;
    
    try {
      if (isMounted.current) {
        setIsLoading(true);
        setRefreshingServices(true);
      }
      const data = await coolifyApi.getServices();
      console.log('Services API Response:', data);
      if (isMounted.current) {
        setServices(data);
        setError(null);
      }
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data));
    } catch (err) {
      if (isMounted.current) {
        setError(`Failed to fetch services: ${err instanceof Error ? err.message : 'Unknown error'}`);
      }
    } finally {
      if (isMounted.current) {
        setIsLoading(false);
        setRefreshingServices(false);
      }
    }
  };

  const clearError = () => {
    if (isMounted.current) {
      setError(null);
    }
  };

  return (
    <CoolifyContext.Provider
      value={{
        config,
        servers,
        deployments,
        applications,
        services,
        version,
        isLoading,
        error,
        isConfigured,
        refreshingServers,
        refreshingApplications,
        refreshingServices,
        setConfig,
        refreshServers,
        refreshDeployments,
        refreshApplications,
        refreshServices,
        refreshVersion,
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
