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
        // Support both old 'in_progress' and new 'running' status
        tasks = tasks.filter(t => {
          if (status === 'running') return t.status === 'running' || t.status === 'in_progress';
          return t.status === status;
        });
      }

      // Sort by timestamp descending
      tasks.sort((a, b) => {
        const ta = new Date(a.timestamp || a.startedAt || 0);
        const tb = new Date(b.timestamp || b.startedAt || 0);
        return tb - ta;
      });

      const total = tasks.length;
      const start = (page - 1) * pageSize;
      const items = tasks.slice(start, start + pageSize).map(t => {
        const started = new Date(t.timestamp || t.startedAt || new Date());
        const completed = t.completedAt ? new Date(t.completedAt) : null;
        const duration_ms = completed
          ? completed - started
          : (t.status === 'running' || t.status === 'in_progress')
            ? Date.now() - started.getTime()
            : null;

        // Map server status 'in_progress' → 'running' per types.ts
        const serverStatus = t.status === 'in_progress' ? 'running' : t.status;

        return {
          id: t.task_id || t.id || String(Math.random()),
          agent: t.to || 'none',
          status: serverStatus,
          quality: t.quality_rating ?? null,
          confidencePre: t.confidencePre ?? null,
          confidencePost: t.confidencePost ?? null,
          timestamps: {
            started: started.toISOString(),
            completed: completed ? completed.toISOString() : null,
          },
          duration_ms,
        };
      });

      res.json({ items, total, page, pageSize, range });
    } catch (err) {
      console.error('[/api/tasks]', err);
      res.status(500).json({ error: 'Failed to fetch tasks' });
    }
  });
}
