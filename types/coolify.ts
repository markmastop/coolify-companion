export interface CoolifyServer {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  settings: {
    is_reachable: boolean;
    created_at?: string;
    updated_at?: string;
  };
}

export interface CoolifyDeployment {
  id: string;
  uuid: string;
  application_uuid: string;
  application_name: string;
  server_name: string;
  status: 'running' | 'success' | 'failed' | 'queued' | 'cancelled';
  commit_sha?: string;
  created_at: string;
  updated_at: string;
}

export interface CoolifyApplication {
  id: string;
  uuid: string;
  name: string;
  description?: string;
  status: string;
  git_repository?: string;
  git_branch?: string;
  updated_at: string;
}

export interface CoolifyLogs {
  logs: string;
  application_uuid: string;
}

export interface ApiConfig {
  baseUrl: string;
  token: string;
}