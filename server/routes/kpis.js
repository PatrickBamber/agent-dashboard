import { readJsonlLogs, filterByRange, filterByPreviousPeriod, calculateKpis } from '../lib/logReader.js';

export default function kpisRoutes(app) {
  app.get('/api/kpis', (req, res) => {
    try {
      const range = req.query.range || '7d';
      const delegations = filterByRange(readJsonlLogs('delegations'), range);
      const previousDelegations = filterByPreviousPeriod(readJsonlLogs('delegations'), range);
      const kpis = calculateKpis(delegations, previousDelegations, range);
      res.json(kpis);
    } catch (err) {
      console.error('[/api/kpis]', err);
      res.status(500).json({ error: 'Failed to calculate KPIs' });
    }
  });
}
