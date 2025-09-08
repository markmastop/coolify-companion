export function formatDate(input?: string | Date | null): string {
  if (!input) return '—';
  const d = typeof input === 'string' ? new Date(input) : input;
  if (!(d instanceof Date) || isNaN(d.getTime())) return '—';
  try {
    return d.toLocaleString();
  } catch {
    return d.toISOString();
  }
}

