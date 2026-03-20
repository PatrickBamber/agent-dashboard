const BASE = '/api';

async function request<T>(path: string, params: Record<string, unknown> = {}): Promise<T> {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json() as Promise<T>;
}

interface KpiData {
  delegationRate: number;
  taskSuccess: number;
  avgQuality: number;
  errorCount: number;
  trends: {
    delegationRate?: number[];
    taskSuccess?: number[];
    avgQuality?: number[];
    errorCount?: number[];
  };
}

interface AgentData {
  name: string;
  total: number;
  successRate: number;
  avgQuality: number | null;
  avgDurationMs: number | null;
}

interface TaskData {
  id: string;
  agent: string;
  status: string;
  quality: number | null;
  timestamps: { started: string; completed: string | null };
  duration_ms?: number | null;
}

interface SystemStatusData {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  uptime?: string;
  lastChecked?: string;
  message?: string;
}

export const api = {
  kpis: (range = '7d') => request<{ data: KpiData; range: string }>('/kpis', { range }),
  agents: (range = '7d') => request<{ data: AgentData[]; range: string }>('/agents', { range }),
  trends: (range = '7d') => request<{ data: unknown }>('/trends', { range }),
  tasks: (params: Record<string, unknown> = {}) => request<{ items: TaskData[]; total: number; page: number; pageSize: number }>('/tasks', params),
  systemStatus: () => request<{ services: SystemStatusData[] }>('/system-status'),
};
