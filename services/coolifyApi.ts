import { ApiConfig, CoolifyServer, CoolifyDeployment, CoolifyApplication, CoolifyLogs, CoolifyService } from '@/types/coolify';
import { Platform } from 'react-native';

class UnauthorizedError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = 'UnauthorizedError';
    this.status = status;
  }
}

class CoolifyApiService {
  private config: ApiConfig | null = null;
  private unauthorizedHandler: (() => void) | null = null;

  setConfig(config: ApiConfig) {
    this.config = config;
  }

  private normalizeArrayResponse<T>(raw: any, keys: string[] = []): T[] {
    // Common shapes: [] | { data: [] } | { data: { key: [] } } | { key: [] }
    if (Array.isArray(raw)) return raw as T[];
    if (raw?.data) {
      if (Array.isArray(raw.data)) return raw.data as T[];
      for (const k of keys) {
        if (Array.isArray(raw.data?.[k])) return raw.data[k] as T[];
      }
    }
    for (const k of keys) {
      if (Array.isArray(raw?.[k])) return raw[k] as T[];
    }
    return [] as T[];
  }

  setUnauthorizedHandler(handler: () => void) {
    this.unauthorizedHandler = handler;
  }

  private getHeaders(): HeadersInit {
    if (!this.config) {
      throw new Error('API configuration not set');
    }
    return {
      'Authorization': `Bearer ${this.config.token}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Validate a provided config by pinging a simple endpoint
  async testConnection(config: ApiConfig): Promise<{ ok: boolean; status?: number; message: string }> {
    try {
      // Test connection using /api/v1/servers endpoint
      const url = `${config.baseUrl}/servers`;
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${config.token}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (response.ok) {
        return { ok: true, message: 'Connection successful' };
      }

      let detailed = '';
      try {
        const text = await response.text();
        if (text) {
          try {
            const json = JSON.parse(text);
            detailed = json?.message || json?.error || '';
          } catch {
            detailed = text;
          }
        }
      } catch {
        // ignore body parse errors
      }

      let message: string;
      switch (response.status) {
        case 401:
          message = 'Invalid API token';
          break;
        case 403:
          message = 'Access forbidden - check API token permissions';
          break;
        case 404:
          message = 'Coolify API not found at this URL';
          break;
        case 500:
          message = 'Coolify server internal error';
          break;
        default:
          message = `HTTP ${response.status}: ${response.statusText}`;
      }

      if (detailed && detailed !== message) {
        message = `${message}\nDetails: ${detailed}`;
      }

      return { ok: false, status: response.status, message };
    } catch (error) {
      const baseMsg = error instanceof Error ? error.message : 'Unknown error';
      return { 
        ok: false, 
        message: Platform.OS === 'web' ? `Network error: ${baseMsg}` : `Connection failed: ${baseMsg}`
      };
    }
  }

  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.config) {
      throw new Error('API configuration not set');
    }

    const url = `${this.config.baseUrl}${endpoint}`;

    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options?.headers,
        },
      });

      if (!response.ok) {
        // For now: on any API error, trigger re-login flow
        this.unauthorizedHandler?.();

        if (response.status === 401 || response.status === 403 || response.status === 404) {
          const message = response.status === 404
            ? 'API endpoint not found. Please check your configuration and log in again.'
            : 'Unauthorized: Invalid or expired API token.';
          throw new UnauthorizedError(message, response.status);
        }
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (err) {
      // Network or parsing error: also treat as auth/error requiring re-login
      this.unauthorizedHandler?.();
      throw err;
    }
  }

  async getServers(): Promise<CoolifyServer[]> {
    const raw = await this.fetchApi<any>('/servers');
    return this.normalizeArrayResponse<CoolifyServer>(raw, ['servers']);
  }

  async getDeployments(): Promise<CoolifyDeployment[]> {
    const raw = await this.fetchApi<any>('/deployments');
    return this.normalizeArrayResponse<CoolifyDeployment>(raw, ['deployments']);
  }

  async getApplications(): Promise<CoolifyApplication[]> {
    const raw = await this.fetchApi<any>('/applications');
    return this.normalizeArrayResponse<CoolifyApplication>(raw, ['applications', 'apps']);
  }

  async getServices(): Promise<CoolifyService[]> {
    const raw = await this.fetchApi<any>('/services');
    return this.normalizeArrayResponse<CoolifyService>(raw, ['services']);
  }

  async getVersion(): Promise<string> {
    if (!this.config) {
      throw new Error('API configuration not set');
    }
    const url = `${this.config.baseUrl}/version`;
    try {
      const response = await fetch(url, { headers: this.getHeaders() });
      if (!response.ok) {
        // Surface error but keep behavior consistent with other methods
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }
      // Some Coolify endpoints may return plain text; prefer text(), fallback to JSON parse
      const text = await response.text();
      try {
        const parsed = JSON.parse(text);
        // Support shapes like { version: 'x.y.z' } or { data: 'x.y.z' }
        return (parsed?.version ?? parsed?.data ?? text) as string;
      } catch {
        return text;
      }
    } catch (err) {
      // Propagate error so caller can decide logging/handling
      throw err;
    }
  }

  async getApplicationLogs(uuid: string, lines: number = 200): Promise<CoolifyLogs> {
    return this.fetchApi<CoolifyLogs>(`/applications/${uuid}/logs?lines=${lines}`);
  }

  async triggerRedeploy(uuid: string): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/deploy?uuid=${uuid}&force=true`, {
      method: 'POST',
    });
  }

  async stopApplication(uuid: string): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/applications/${uuid}/stop`, {
      method: 'POST',
    });
  }

  async startApplication(uuid: string): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/applications/${uuid}/start`, {
      method: 'POST',
    });
  }

  async restartApplication(uuid: string): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/applications/${uuid}/restart`, {
      method: 'POST',
    });
  }
}

export const coolifyApi = new CoolifyApiService();
