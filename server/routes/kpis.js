import { readJsonlLogs, filterByRange } from '../lib/logReader.js';

export default function kpisRoutes(app) {
  app.get('/api/kpis', (req, res) => {
    try {
      const range = req.query.range || '7d';
      const delegations = filterByRange(readJsonlLogs('delegations'), range);
      const qualityLogs = filterByRange(readJsonlLogs('quality'), range);

      const total = delegations.length;
      const completed = delegations.filter(d => d.status === 'completed').length;
      const failed = delegations.filter(d => d.status === 'failed').length;
      const delegated = delegations.filter(d => d.to && d.to !== 'none').length;

      const taskSuccess = total > 0 ? parseFloat(((completed / total) * 100).toFixed(1)) : 0;
      const delegationRate = total > 0 ? parseFloat(((delegated / total) * 100).toFixed(1)) : 0;
      const avgQuality = qualityLogs.length > 0
        ? parseFloat((qualityLogs.reduce((s, q) => s + (q.rating || 0), 0) / qualityLogs.length).toFixed(1))
        : 0;
      const errorCount = failed;

      // Build 7-day sparklines (use up to 7 data points regardless of range)
      const sparklineDays = 7;
      const now = new Date();

      const buildSparkline = (getValue) => {
        const result = [];
        for (let i = sparklineDays - 1; i >= 0; i--) {
          const dayStart = new Date(now);
          dayStart.setDate(dayStart.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setDate(dayEnd.getDate() + 1);
          const dayDelegations = delegations.filter(d => {
            const ts = new Date(d.timestamp || d.startedAt || 0);
            return ts >= dayStart && ts < dayEnd;
          });
          const dayQuality = qualityLogs.filter(q => {
            const ts = new Date(q.timestamp || 0);
            return ts >= dayStart && ts < dayEnd;
          });
          result.push(getValue(dayDelegations, dayQuality));
        }
        return result;
      };

      const trends = {
        delegationRate: buildSparkline((delegations, _quality) => {
          const t = delegations.length;
          const d = delegations.filter(d => d.to && d.to !== 'none').length;
          return t > 0 ? parseFloat(((d / t) * 100).toFixed(1)) : 0;
        }),
        taskSuccess: buildSparkline((delegations) => {
          const t = delegations.length;
          const c = delegations.filter(d => d.status === 'completed').length;
          return t > 0 ? parseFloat(((c / t) * 100).toFixed(1)) : 0;
        }),
        avgQuality: buildSparkline((_delegations, quality) => {
          return quality.length > 0
            ? parseFloat((quality.reduce((s, q) => s + (q.rating || 0), 0) / quality.length).toFixed(2))
            : 0;
        }),
        errorCount: buildSparkline((delegations) => {
          return delegations.filter(d => d.status === 'failed').length;
        }),
      };

      res.json({
        data: {
          delegationRate,
          taskSuccess,
          avgQuality,
          errorCount,
          trends,
        },
        range,
        generatedAt: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[/api/kpis]', err);
      res.status(500).json({ error: 'Failed to calculate KPIs' });
    }
  });
}
