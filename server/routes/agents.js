import { readJsonlLogs, filterByRange, calculateAgentStats, aggregateByDay } from '../lib/logReader.js';

export default function agentsRoutes(app) {
  app.get('/api/agents', (req, res) => {
    try {
      const range = req.query.range || '7d';
      const delegations = filterByRange(readJsonlLogs('delegations'), range);
      const stats = calculateAgentStats(delegations, range);
      res.json(stats);
    } catch (err) {
      console.error('[/api/agents]', err);
      res.status(500).json({ error: 'Failed to calculate agent stats' });
    }
  });

  app.get('/api/trends', (req, res) => {
    try {
      const range = req.query.range || '7d';
      const delegations = filterByRange(readJsonlLogs('delegations'), range);
      const byDay = aggregateByDay(delegations, range);

      // Calculate rolling quality per day
      const qualityLogs = filterByRange(readJsonlLogs('quality'), range);
      const qualityByDay = byDay.map(day => {
        const dayStart = new Date(day.date);
        const dayEnd = new Date(dayStart);
        dayEnd.setDate(dayEnd.getDate() + 1);
        const dayQuality = qualityLogs.filter(q => {
          const ts = new Date(q.timestamp || 0);
          return ts >= dayStart && ts < dayEnd;
        });
        const avg = dayQuality.length > 0
          ? parseFloat((dayQuality.reduce((s, q) => s + (q.rating || 0), 0) / dayQuality.length).toFixed(2))
          : null;
        return { date: day.date, label: day.label, avgQuality: avg };
      });

      res.json({ volume: byDay, quality: qualityByDay });
    } catch (err) {
      console.error('[/api/trends]', err);
      res.status(500).json({ error: 'Failed to calculate trends' });
    }
  });
}
