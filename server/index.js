import express from 'express';
import cors from 'cors';
import kpisRoutes from './routes/kpis.js';
import agentsRoutes from './routes/agents.js';
import tasksRoutes from './routes/tasks.js';
import systemRoutes from './routes/system.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

kpisRoutes(app);
agentsRoutes(app);
tasksRoutes(app);
systemRoutes(app);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', ts: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`[server] Agent Dashboard API running on http://localhost:${PORT}`);
});
