import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_BASE = path.resolve(process.env.HOME, '.openclaw/workspace/agent-cabinet/logs');

/**
 * Read all JSONL files in a directory, parse each line as JSON.
 * Returns an array of parsed objects.
 */
export function readJsonlLogs(subDir) {
  const dir = path.join(LOGS_BASE, subDir);
  if (!fs.existsSync(dir)) return [];

  const files = fs.readdirSync(dir).filter(f => f.endsWith('.jsonl'));
  const all = [];

  for (const file of files) {
    const filePath = path.join(dir, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim());
    for (const line of lines) {
      try {
        all.push(JSON.parse(line));
      } catch {
        // skip malformed lines
      }
    }
  }

  return all;
}

/**
 * Filter logs within a date range (ISO strings or Date objects).
 */
export function filterByRange(logs, range) {
  const now = new Date();
  let cutoff;
  if (range === '24h') cutoff = new Date(now - 24 * 60 * 60 * 1000);
  else if (range === '7d') cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000);
  else if (range === '30d') cutoff = new Date(now - 30 * 24 * 60 * 60 * 1000);
  else cutoff = new Date(now - 7 * 24 * 60 * 60 * 1000); // default 7d

  return logs.filter(l => {
    const ts = new Date(l.timestamp || l.startedAt || 0);
    return ts >= cutoff;
  });
}

/**
 * Get the previous period for trend comparison.
 */
export function getPreviousPeriod(range) {
  const now = new Date();
  let periodMs;
  if (range === '24h') periodMs = 24 * 60 * 60 * 1000;
  else if (range === '7d') periodMs = 7 * 24 * 60 * 60 * 1000;
  else if (range === '30d') periodMs = 30 * 24 * 60 * 60 * 1000;
  else periodMs = 7 * 24 * 60 * 60 * 1000;

  const currentStart = new Date(now - periodMs);
  const previousStart = new Date(currentStart - periodMs);

  return { previousStart, currentStart };
}

/**
 * Filter to previous period.
 */
export function filterByPreviousPeriod(logs, range) {
  const { previousStart, currentStart } = getPreviousPeriod(range);
  return logs.filter(l => {
    const ts = new Date(l.timestamp || l.startedAt || 0);
    return ts >= previousStart && ts < currentStart;
  });
}

/**
 * Calculate KPIs from delegation + quality logs.
 */
export function calculateKpis(delegations, previousDelegations, range) {
  const total = delegations.length;
  const completed = delegations.filter(d => d.status === 'completed').length;
  const failed = delegations.filter(d => d.status === 'failed').length;
  const running = delegations.filter(d => d.status === 'in_progress' || d.status === 'running').length;
  const delegated = delegations.filter(d => d.to && d.to !== 'none').length;

  // Previous period
  const prevTotal = previousDelegations.length;
  const prevCompleted = previousDelegations.filter(d => d.status === 'completed').length;
  const prevFailed = previousDelegations.filter(d => d.status === 'failed').length;

  const taskSuccessRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  const prevTaskSuccessRate = prevTotal > 0 ? Math.round((prevCompleted / prevTotal) * 100) : 0;

  const delegationRate = total > 0 ? Math.round((delegated / total) * 100) : 0;

  // Avg quality from quality logs
  const qualityLogs = readJsonlLogs('quality');
  const qualityFiltered = filterByRange(qualityLogs, range);
  const prevQualityFiltered = filterByPreviousPeriod(qualityLogs, range);

  const avgQuality = qualityFiltered.length > 0
    ? parseFloat((qualityFiltered.reduce((s, q) => s + (q.rating || 0), 0) / qualityFiltered.length).toFixed(2))
    : 0;
  const prevAvgQuality = prevQualityFiltered.length > 0
    ? parseFloat((prevQualityFiltered.reduce((s, q) => s + (q.rating || 0), 0) / prevQualityFiltered.length).toFixed(2))
    : 0;

  const trend = (curr, prev) => {
    if (prev === 0) return { direction: 'stable', delta: 0 };
    const d = curr - prev;
    return { direction: d > 0 ? 'up' : d < 0 ? 'down' : 'stable', delta: Math.abs(d) };
  };

  return {
    delegationRate: { value: delegationRate, ...trend(delegationRate, prevTotal > 0 ? Math.round((delegated / prevTotal) * 100) : 0) },
    taskSuccess: { value: taskSuccessRate, ...trend(taskSuccessRate, prevTaskSuccessRate) },
    avgQuality: { value: avgQuality, ...trend(avgQuality, prevAvgQuality) },
    errorCount: { value: failed, ...trend(failed, prevFailed, true) },
    _meta: { total, completed, running, failed }
  };
}

/**
 * Per-agent stats.
 */
export function calculateAgentStats(delegations, range) {
  const agents = ['coding', 'research', 'pm', 'devops'];
  const qualityLogs = readJsonlLogs('quality');

  return agents.map(agent => {
    const tasks = delegations.filter(d => d.to === agent);
    const completed = tasks.filter(d => d.status === 'completed');
    const failed = tasks.filter(d => d.status === 'failed');
    const successRate = tasks.length > 0 ? Math.round((completed.length / tasks.length) * 100) : 0;

    const agentQualityLogs = qualityLogs.filter(q =>
      tasks.some(t => t.task_id === q.task_id)
    );
    const avgQuality = agentQualityLogs.length > 0
      ? parseFloat((agentQualityLogs.reduce((s, q) => s + (q.rating || 0), 0) / agentQualityLogs.length).toFixed(2))
      : null;

    const durations = completed
      .map(d => {
        const start = new Date(d.timestamp || d.startedAt);
        const end = new Date(d.completedAt || d.timestamp);
        return end - start;
      })
      .filter(ms => ms > 0 && ms < 24 * 60 * 60 * 1000); // valid: under 24h

    const avgDurationMs = durations.length > 0
      ? Math.round(durations.reduce((s, d) => s + d, 0) / durations.length)
      : null;

    return {
      agent,
      total: tasks.length,
      completed: completed.length,
      failed: failed.length,
      running: tasks.filter(d => d.status === 'in_progress' || d.status === 'running').length,
      successRate,
      avgQuality,
      avgDurationMs,
    };
  });
}

/**
 * Daily aggregation for trend charts.
 */
export function aggregateByDay(logs, range) {
  const now = new Date();
  let days;
  if (range === '24h') days = 1;
  else if (range === '7d') days = 7;
  else if (range === '30d') days = 30;
  else days = 7;

  const result = [];
  for (let i = days - 1; i >= 0; i--) {
    const dayStart = new Date(now);
    dayStart.setDate(dayStart.getDate() - i);
    dayStart.setHours(0, 0, 0, 0);
    const dayEnd = new Date(dayStart);
    dayEnd.setDate(dayEnd.getDate() + 1);

    const dayLogs = logs.filter(l => {
      const ts = new Date(l.timestamp || l.startedAt || 0);
      return ts >= dayStart && ts < dayEnd;
    });

    result.push({
      date: dayStart.toISOString().split('T')[0],
      label: dayStart.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      total: dayLogs.length,
      completed: dayLogs.filter(l => l.status === 'completed').length,
      failed: dayLogs.filter(l => l.status === 'failed').length,
      running: dayLogs.filter(l => l.status === 'in_progress' || l.status === 'running').length,
    });
  }
  return result;
}

/**
 * Check if agent-cabinet logs are reachable.
 */
export function checkLogsHealth() {
  try {
    const delegationsDir = path.join(LOGS_BASE, 'delegations');
    if (!fs.existsSync(delegationsDir)) return false;
    const files = fs.readdirSync(delegationsDir).filter(f => f.endsWith('.jsonl'));
    if (files.length === 0) return false;
    // Check for recent writes (within last 5 minutes)
    const latest = files.map(f => fs.statSync(path.join(delegationsDir, f)).mtime).sort((a, b) => b - a)[0];
    const ageMs = Date.now() - latest.getTime();
    return ageMs < 5 * 60 * 1000;
  } catch {
    return false;
  }
}
