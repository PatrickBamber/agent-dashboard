import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const AGENTS_DIR = path.resolve(process.env.AGENTS_DIR || '/root/.openclaw/agents');
const LOGS_BASE = path.resolve(process.env.HOME || '/root', '.openclaw/workspace/agent-cabinet/logs');

/**
 * Get Kitten's current active session file (most recent .jsonl in main sessions dir).
 */
function getCurrentSessionFile() {
  try {
    const sessionsDir = path.join(AGENTS_DIR, 'main/sessions');
    if (!fs.existsSync(sessionsDir)) return null;

    const files = fs.readdirSync(sessionsDir)
      .filter(f => f.endsWith('.jsonl') && !f.includes('.deleted'))
      .map(f => ({
        name: f,
        mtime: fs.statSync(path.join(sessionsDir, f)).mtime.getTime()
      }))
      .sort((a, b) => b.mtime - a.mtime);

    if (!files.length) return null;
    return { path: path.join(sessionsDir, files[0].name), mtime: files[0].mtime };
  } catch {
    return null;
  }
}

/**
 * Get Kitten's current state from the active session file.
 */
function getKittenState() {
  const session = getCurrentSessionFile();
  if (!session) {
    return { status: 'unknown', since: null, lastActivity: null };
  }

  const now = Date.now();
  const ageMs = now - session.mtime;
  const isActive = ageMs < 60000; // modified within last 60s

  // Read last line to get last message timestamp
  let lastMessageTs = null;
  try {
    const content = fs.readFileSync(session.path, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    if (lines.length > 0) {
      const last = JSON.parse(lines[lines.length - 1]);
      lastMessageTs = last.timestamp || last.message?.timestamp || null;
    }
  } catch {
    // ignore
  }

  return {
    status: isActive ? 'active' : 'idle',
    since: new Date(session.mtime).toISOString(),
    lastActivity: lastMessageTs,
    sessionAgeMs: ageMs,
  };
}

/**
 * Get recent delegation activity (last 20).
 */
function getRecentDelegations(limit = 20) {
  try {
    const delegationsDir = path.join(LOGS_BASE, 'delegations');
    if (!fs.existsSync(delegationsDir)) return [];

    const files = fs.readdirSync(delegationsDir)
      .filter(f => f.endsWith('.jsonl'))
      .sort((a, b) => b.localeCompare(a)); // newest first

    const entries = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(delegationsDir, file), 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      for (const line of lines.reverse()) {
        try {
          entries.push({ ...JSON.parse(line), _file: file });
        } catch {
          // skip
        }
      }
      if (entries.length >= limit) break;
    }

    return entries.slice(0, limit).map(e => ({
      task: e.task || e.description || 'Unknown task',
      agent: e.agent || 'unknown',
      status: e.status || 'unknown',
      rating: e.quality_rating || e.rating || null,
      startedAt: e.started_at || e.ts || null,
      completedAt: e.completed_at || null,
    }));
  } catch {
    return [];
  }
}

/**
 * Get today's quick stats.
 */
function getTodayStats() {
  try {
    const delegationsDir = path.join(LOGS_BASE, 'delegations');
    if (!fs.existsSync(delegationsDir)) {
      return { total: 0, completed: 0, failed: 0, avgQuality: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayMs = today.getTime();

    const files = fs.readdirSync(delegationsDir).filter(f => f.endsWith('.jsonl'));
    let total = 0, completed = 0, failed = 0;
    const ratings = [];

    for (const file of files) {
      const content = fs.readFileSync(path.join(delegationsDir, file), 'utf-8');
      const lines = content.split('\n').filter(l => l.trim());
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          const ts = new Date(entry.started_at || entry.ts || 0).getTime();
          if (ts < todayMs) continue;
          total++;
          if (entry.status === 'completed') completed++;
          if (entry.status === 'failed') failed++;
          if (entry.quality_rating) ratings.push(entry.quality_rating);
        } catch {
          // skip
        }
      }
    }

    return {
      total,
      completed,
      failed,
      avgQuality: ratings.length
        ? parseFloat((ratings.reduce((s, r) => s + r, 0) / ratings.length).toFixed(1))
        : null,
    };
  } catch {
    return { total: 0, completed: 0, failed: 0, avgQuality: null };
  }
}

/**
 * Get recent errors / transgressions.
 */
function getRecentErrors(limit = 10) {
  try {
    const transDir = path.join(LOGS_BASE, 'transgressions');
    if (!fs.existsSync(transDir)) return [];

    const files = fs.readdirSync(transDir).filter(f => f.endsWith('.jsonl'))
      .sort((a, b) => b.localeCompare(a));

    const entries = [];
    for (const file of files) {
      const content = fs.readFileSync(path.join(transDir, file), 'utf-8');
      const lines = content.split('\n').filter(l => l.trim()).reverse();
      for (const line of lines) {
        try {
          const e = JSON.parse(line);
          entries.push({
            severity: e.severity || 'medium',
            description: e.description || e.message || 'Unknown',
            agent: e.agent || 'system',
            timestamp: e.timestamp || e.ts || null,
          });
        } catch {
          // skip
        }
      }
      if (entries.length >= limit) break;
    }
    return entries.slice(0, limit);
  } catch {
    return [];
  }
}

// ─── Routes ───────────────────────────────────────────────────────────────────

export default function hudRoutes(app) {

  // GET /api/hud/state — full state snapshot
  app.get('/api/hud/state', (_req, res) => {
    try {
      res.json({
        kitten: getKittenState(),
        stats: getTodayStats(),
        recent: getRecentDelegations(20),
        errors: getRecentErrors(5),
        ts: new Date().toISOString(),
      });
    } catch (err) {
      console.error('[/api/hud/state]', err);
      res.status(500).json({ error: 'Failed to get HUD state' });
    }
  });

  // GET /api/hud/events — SSE stream of state changes
  app.get('/api/hud/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // disable nginx buffering if any
    res.flushHeaders();

    // Track last state to detect changes
    let lastState = null;

    const sendUpdate = () => {
      try {
        const state = {
          kitten: getKittenState(),
          stats: getTodayStats(),
          recent: getRecentDelegations(20),
          errors: getRecentErrors(5),
          ts: new Date().toISOString(),
        };

        // Send only if changed
        const changed = !lastState || JSON.stringify(state) !== JSON.stringify(lastState);
        if (changed) {
          lastState = state;
          res.write(`data: ${JSON.stringify(state)}\n\n`);
        }
      } catch {
        // ignore
      }
    };

    // Send initial state
    sendUpdate();

    // Poll every 5 seconds
    const interval = setInterval(sendUpdate, 5000);

    // Clean up on client disconnect
    req.on('close', () => {
      clearInterval(interval);
      res.end();
    });
  });
}
