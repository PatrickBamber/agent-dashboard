import express from 'express';
import cors from 'cors';
import kpisRoutes from './routes/kpis.js';
import agentsRoutes from './routes/agents.js';
import tasksRoutes from './routes/tasks.js';
import systemRoutes from './routes/system.js';
import statsRoutes from './routes/stats.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Static files — serve built React app
app.use(express.static('public'));
// Vite HMR in dev uses /src for ES modules
app.use(express.static('src'));

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

kpisRoutes(app);
agentsRoutes(app);
tasksRoutes(app);
systemRoutes(app);
statsRoutes(app);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

// SPA fallback — serve index.html for non-API routes (supports client-side routing)
app.get("/", (_req, res) => {
  res.sendFile('/app/public/index.html');
});

app.listen(PORT, () => {
  console.log(`[server] Agent Dashboard API running on http://localhost:${PORT}`);
});
