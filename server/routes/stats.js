import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_PATH = path.join(__dirname, '../../data/live-stats.json');

export default function statsRoutes(app) {
  app.get('/api/stats/usage', (_req, res) => {
    try {
      if (fs.existsSync(DATA_PATH)) {
        const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
        res.json(data);
      } else {
        res.json({ error: 'No stats data yet — run statsCollector.js first' });
      }
    } catch (err) {
      console.error('[/api/stats/usage]', err);
      res.status(500).json({ error: 'Failed to read stats' });
    }
  });
}
