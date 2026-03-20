import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const INSIGHT_PATH = path.join(process.env.HOME, '.openclaw/workspace/agent-dashboard/data/insight.json');

export default function insightRoutes(app) {
  app.get('/api/insight', (_req, res) => {
    try {
      if (fs.existsSync(INSIGHT_PATH)) {
        const data = JSON.parse(fs.readFileSync(INSIGHT_PATH, 'utf8'));
        res.json(data);
      } else {
        res.json({ text: 'No insight available yet.', generatedAt: null, period: '24h', stats: null });
      }
    } catch (err) {
      console.error('[/api/insight]', err);
      res.status(500).json({ error: 'Failed to read insight' });
    }
  });
}
