import { checkLogsHealth } from '../lib/logReader.js';

export default function systemRoutes(app) {
  app.get('/api/system-status', (req, res) => {
    const logsHealthy = checkLogsHealth();

    const services = [
      {
        name: 'OpenClaw Gateway',
        status: 'operational',
        detail: 'Local runtime',
      },
      {
        name: 'Telegram Bridge',
        status: 'operational',
        detail: 'Connected',
      },
      {
        name: 'Agent-Cabinet Logs',
        status: logsHealthy ? 'operational' : 'degraded',
        detail: logsHealthy ? 'Readable, recent writes' : 'Logs missing or stale',
      },
      {
        name: 'GitHub API',
        status: 'unknown',
        detail: 'Not configured',
      },
    ];

    const overall = services.every(s => s.status === 'operational')
      ? 'operational'
      : services.some(s => s.status === 'degraded' || s.status === 'down')
        ? 'degraded'
        : 'unknown';

    res.json({ services, overall });
  });
}
