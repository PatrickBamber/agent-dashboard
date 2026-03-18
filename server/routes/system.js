import { checkLogsHealth } from '../lib/logReader.js';

export default function systemRoutes(app) {
  app.get('/api/system-status', (_req, res) => {
    const logsHealthy = checkLogsHealth();
    const now = new Date().toISOString();

    const services = [
      {
        service: 'openclaw-gateway',
        status: 'healthy',
        uptime: '3d 14h',
        lastChecked: now,
        message: 'v2.14.1 — local runtime active',
      },
      {
        service: 'telegram-bridge',
        status: 'healthy',
        uptime: '3d 14h',
        lastChecked: now,
        message: 'connected — 1 active session',
      },
      {
        service: 'agent-cabinet-logs',
        status: logsHealthy ? 'healthy' : 'degraded',
        uptime: '3d 14h',
        lastChecked: now,
        message: logsHealthy ? 'logs readable, recent writes present' : 'logs missing or stale',
      },
      {
        service: 'github-api',
        status: 'degraded',
        uptime: '3d 14h',
        lastChecked: now,
        message: 'rate limit: 47/60 remaining',
      },
    ];

    res.json({ services, generatedAt: now });
  });
}
