const BASE = '/api';

async function request(path, params = {}) {
  const url = new URL(BASE + path, window.location.origin);
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  const res = await fetch(url.toString());
  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`);
  return res.json();
}

export const api = {
  kpis: (range = '7d') => request('/kpis', { range }),
  agents: (range = '7d') => request('/agents', { range }),
  trends: (range = '7d') => request('/trends', { range }),
  tasks: (params = {}) => request('/tasks', params),
  systemStatus: () => request('/system-status'),
};
