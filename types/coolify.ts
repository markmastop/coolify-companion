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
  id: number;
  deployment_uuid: string;
  application_id: string;
  application_name: string;
  server_id: number;
  server_name: string;
  status: 'in_progress' | 'success' | 'failed' | 'queued' | 'cancelled';
  commit?: string;
  commit_message?: string;
  deployment_url?: string;
  finished_at?: string;
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

export interface CoolifyService {
  uuid: string;
  name: string;
  environment_id: number;
  created_at: string;
  updated_at: string;
  server_id: number;
  description?: string;
  service_type: string;
  status: string;
  server_status: boolean;
  server: {
    id: number;
    uuid: string;
    name: string;
    description?: string;
    ip: string;
  };
  applications: Array<{
    id: number;
    uuid: string;
    name: string;
    status: string;
    fqdn?: string;
    image: string;
    created_at: string;
    updated_at: string;
  }>;
  databases: Array<{
    id: number;
    uuid: string;
    name: string;
    status: string;
    image: string;
    created_at: string;
    updated_at: string;
  }>;
}