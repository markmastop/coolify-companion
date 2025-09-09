import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { coolifyApi } from '@/services/coolifyApi';
import { CoolifyServer, CoolifyDeployment, CoolifyApplication, CoolifyService, ApiConfig } from '@/types/coolify';

// Compare two deployment lists and detect meaningful changes
function areDeploymentsEqual(a: CoolifyDeployment[], b: CoolifyDeployment[]): boolean {
  if (a === b) return true;
  if (!Array.isArray(a) || !Array.isArray(b)) return false;
  if (a.length !== b.length) return false;
  const sortById = (arr: CoolifyDeployment[]) =>
    [...arr].sort((x, y) => String(x.deployment_uuid).localeCompare(String(y.deployment_uuid)));
  const aa = sortById(a);
  const bb = sortById(b);
  for (let i = 0; i < aa.length; i++) {
    const d1 = aa[i];
    const d2 = bb[i];
    if (String(d1.deployment_uuid) !== String(d2.deployment_uuid)) return false;
    if (String(d1.status) !== String(d2.status)) return false;
    if (String(d1.updated_at || '') !== String(d2.updated_at || '')) return false;
    if (String(d1.finished_at || '') !== String(d2.finished_at || '')) return false;
  }
  return true;
}

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
  refreshServers: (silent?: boolean) => Promise<void>;
  refreshDeployments: (silent?: boolean) => Promise<void>;
  refreshApplications: (silent?: boolean) => Promise<void>;
  refreshServices: (silent?: boolean) => Promise<void>;
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

  // Load config and cached data on startup
  useEffect(() => {
    loadStoredData();

    // Register a global error handler: on any API error, return to login
    coolifyApi.setUnauthorizedHandler(async () => {
      // For now, keep cached credentials so they can be shown on the login screen
      // Do not clear stored config; simply mark as not configured to show ConfigScreen
      setIsConfigured(false);
      setError('API error. Please verify your configuration and log in again.');
    });
  }, []);

  // Silent polling for deployments: 30s baseline, 5s when active
  useEffect(() => {
    if (!isConfigured) return;
    const hasActive = deployments.some(d => String(d.status).toLowerCase() === 'in_progress');
    const intervalMs = hasActive ? 5000 : 30000;

    // Do an immediate silent refresh when entering active state
    if (hasActive) {
      refreshDeployments(true).catch(() => {});
    }

    const interval = setInterval(() => {
      refreshDeployments(true).catch(() => {});
    }, intervalMs);

    return () => clearInterval(interval);
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
      setVersion(String(v));
    } catch (err) {
      console.warn('Failed to fetch version', err);
    }
  };

  const refreshServers = async (silent: boolean = false) => {
    if (!isConfigured) return;
    
    try {
      if (!silent) setIsLoading(true);
      setRefreshingServers(true);
      const data = await coolifyApi.getServers();
      console.log('Servers API Response:', data);
      setServers(data);
      await AsyncStorage.setItem(STORAGE_KEYS.SERVERS, JSON.stringify(data));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch servers: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (!silent) setIsLoading(false);
      setRefreshingServers(false);
    }
  };

  const refreshDeployments = async (silent: boolean = false) => {
    if (!isConfigured) return;
    
    try {
      if (!silent) setIsLoading(true);
      const data = await coolifyApi.getDeployments();
      console.log('Deployments API Response:', data);
      // Only update state/storage if something actually changed
      setDeployments(prev => {
        const changed = !areDeploymentsEqual(prev, data);
        if (changed) {
          AsyncStorage.setItem(STORAGE_KEYS.DEPLOYMENTS, JSON.stringify(data)).catch(() => {});
          return data;
        }
        return prev;
      });
      setError(null);
    } catch (err) {
      setError(`Failed to fetch deployments: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  const refreshApplications = async (silent: boolean = false) => {
    if (!isConfigured) return;
    
    try {
      if (!silent) setIsLoading(true);
      setRefreshingApplications(true);
      const data = await coolifyApi.getApplications();
      console.log('Applications API Response:', data);
      setApplications(data);
      await AsyncStorage.setItem(STORAGE_KEYS.APPLICATIONS, JSON.stringify(data));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch applications: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (!silent) setIsLoading(false);
      setRefreshingApplications(false);
    }
  };

  const refreshServices = async (silent: boolean = false) => {
    if (!isConfigured) return;
    
    try {
      if (!silent) setIsLoading(true);
      setRefreshingServices(true);
      const data = await coolifyApi.getServices();
      console.log('Services API Response:', data);
      setServices(data);
      await AsyncStorage.setItem(STORAGE_KEYS.SERVICES, JSON.stringify(data));
      setError(null);
    } catch (err) {
      setError(`Failed to fetch services: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      if (!silent) setIsLoading(false);
      setRefreshingServices(false);
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
