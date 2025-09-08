import { CoolifyApplication, CoolifyService } from '@/types/coolify';

export type NormalizedStatus = 'up' | 'down' | 'running' | 'success' | 'failed' | 'queued' | 'cancelled';

export function normalizeStatus(kind: 'server', reachable: boolean): NormalizedStatus;
export function normalizeStatus(kind: 'application', status: CoolifyApplication['status']): NormalizedStatus;
export function normalizeStatus(kind: 'service', status: CoolifyService['status']): NormalizedStatus;
export function normalizeStatus(kind: 'server' | 'application' | 'service', raw: unknown): NormalizedStatus {
  if (kind === 'server') {
    return raw ? 'up' : 'down';
  }

  const value = String(raw || '').toLowerCase();

  if (kind === 'application') {
    if (value.includes('cancel')) return 'cancelled';
    if (value.includes('queue') || value.includes('pend')) return 'queued';
    if (value.includes('fail') || value.includes('error') || value.includes('down')) return 'failed';
    if (value.includes('success') || value.includes('healthy') || value === 'up') return 'success';
    if (value.includes('run') || value.includes('progress')) return 'running';
    // Default to running when active state is unclear
    return 'running';
  }

  // service
  if (value.includes('cancel')) return 'cancelled';
  if (value.includes('queue') || value.includes('pend')) return 'queued';
  if (value.includes('running') && value.includes('healthy')) return 'success';
  if (value.includes('running') && value.includes('unhealthy')) return 'running';
  if (value.includes('running')) return 'running';
  if (value.includes('fail') || value.includes('error') || value.includes('stopp') || value.includes('down')) return 'failed';
  return 'failed';
}

