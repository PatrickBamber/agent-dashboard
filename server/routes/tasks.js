import { readJsonlLogs, filterByRange } from '../lib/logReader.js';

export default function tasksRoutes(app) {
  app.get('/api/tasks', (req, res) => {
    try {
      const range = req.query.range || '7d';
      const agent = req.query.agent;
      const status = req.query.status;
      const page = parseInt(req.query.page) || 1;
      const pageSize = parseInt(req.query.pageSize) || 20;

      let tasks = filterByRange(readJsonlLogs('delegations'), range);

      if (agent && agent !== 'all') {
        tasks = tasks.filter(t => t.to === agent);
      }
      if (status && status !== 'all') {
        tasks = tasks.filter(t => t.status === status);
      }

      // Sort by timestamp descending
      tasks.sort((a, b) => new Date(b.timestamp || b.startedAt) - new Date(a.timestamp || a.startedAt));

      const total = tasks.length;
      const start = (page - 1) * pageSize;
      const items = tasks.slice(start, start + pageSize).map(t => {
        const ts = new Date(t.timestamp || t.startedAt);
        const durationMs = t.completedAt
          ? new Date(t.completedAt) - ts
          : (t.status === 'in_progress' || t.status === 'running')
            ? Date.now() - ts
            : null;

        const formatDuration = (ms) => {
          if (ms === null) return '—';
          const s = Math.floor(ms / 1000);
          const m = Math.floor(s / 60);
          const h = Math.floor(m / 60);
          if (h > 0) return `${h}h ${m % 60}m`;
          if (m > 0) return `${m}m ${s % 60}s`;
          return `${s}s`;
        };

        const relativeTime = (() => {
          const diff = Date.now() - ts.getTime();
          const m = Math.floor(diff / 60000);
          const h = Math.floor(m / 60);
          const d = Math.floor(h / 24);
          if (d > 0) return `${d}d ago`;
          if (h > 0) return `${h}h ago`;
          if (m > 0) return `${m}m ago`;
          return 'just now';
        })();

        return {
          id: t.task_id,
          name: (t.task_description || t.task_id || '').slice(0, 60),
          agent: t.to || 'none',
          status: t.status,
          duration: formatDuration(durationMs),
          rating: t.quality_rating ?? null,
          time: relativeTime,
          timestamp: ts.toISOString(),
        };
      });

      res.json({ items, total, page, pageSize });
    } catch (err) {
      console.error('[/api/tasks]', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });
}
