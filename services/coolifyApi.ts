import { ApiConfig, CoolifyServer, CoolifyDeployment, CoolifyApplication, CoolifyLogs } from '@/types/coolify';

class CoolifyApiService {
  private config: ApiConfig | null = null;

  setConfig(config: ApiConfig) {
    this.config = config;
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

  private async fetchApi<T>(endpoint: string, options?: RequestInit): Promise<T> {
    if (!this.config) {
      throw new Error('API configuration not set');
    }

    const url = `${this.config.baseUrl}${endpoint}`;
    const response = await fetch(url, {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async getServers(): Promise<CoolifyServer[]> {
    return this.fetchApi<CoolifyServer[]>('/servers');
  }

  async getDeployments(): Promise<CoolifyDeployment[]> {
    return this.fetchApi<CoolifyDeployment[]>('/deployments');
  }

  async getApplications(): Promise<CoolifyApplication[]> {
    return this.fetchApi<CoolifyApplication[]>('/applications');
  }

  async getApplicationLogs(uuid: string, lines: number = 200): Promise<CoolifyLogs> {
    return this.fetchApi<CoolifyLogs>(`/applications/${uuid}/logs?lines=${lines}`);
  }

  async triggerRedeploy(uuid: string): Promise<{ success: boolean; message: string }> {
    return this.fetchApi<{ success: boolean; message: string }>(`/deploy?uuid=${uuid}&force=true`, {
      method: 'POST',
    });
  }
}

export const coolifyApi = new CoolifyApiService();