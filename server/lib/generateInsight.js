#!/usr/bin/env node
/**
 * generateInsight.js — Run by host cron job at 8am, 12pm, 12am.
 * Reads delegation + quality logs, writes a text insight to data/insight.json.
 * The dashboard reads this via GET /api/insight.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_BASE = path.resolve(process.env.HOME, '.openclaw/workspace/agent-cabinet/logs');
const OUT_PATH = path.resolve(process.env.HOME, '.openclaw/workspace/agent-dashboard/data/insight.json');

function readJsonl(subDir) {
  const dir = path.join(LOGS_BASE, subDir);
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.jsonl'))
    .flatMap(file => {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      return content.split('\n').filter(l => l.trim()).map(l => {
        try { return JSON.parse(l); } catch { return null; }
      }).filter(Boolean);
    });
}

function filter24h(logs) {
  const cutoff = Date.now() - 24 * 60 * 60 * 1000;
  return logs.filter(l => {
    const ts = new Date(l.ts || l.timestamp || l.startedAt || 0).getTime();
    return ts >= cutoff;
  });
}

function filterPeriod(logs, days) {
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  return logs.filter(l => {
    const ts = new Date(l.ts || l.timestamp || l.startedAt || 0).getTime();
    return ts >= cutoff;
  });
}

function generate(force24h = false) {
  const delegations = readJsonl('delegations');
  const qualityLogs = readJsonl('quality');

  const periodDays = force24h ? 1 : 1; // always last 24h for insight
  const recent = filterPeriod(delegations, periodDays);
  const recentQuality = filterPeriod(qualityLogs, periodDays);

  const total = recent.length;
  const completed = recent.filter(d => d.status === 'completed').length;
  const failed = recent.filter(d => d.status === 'failed').length;
  const active = recent.filter(d => d.status === 'running' || d.status === 'in_progress').length;
  const rated = recentQuality.filter(q => q.rating != null);
  const avgQuality = rated.length > 0
    ? rated.reduce((s, q) => s + q.rating, 0) / rated.length
    : null;

  const lines = [];

  if (total === 0) {
    lines.push('No tasks recorded in the last 24 hours.');
  } else {
    if (completed > 0) lines.push(`${completed} task${completed !== 1 ? 's' : ''} completed.`);
    if (failed > 0) lines.push(`${failed} task${failed !== 1 ? 's' : ''} failed — review recommended.`);
    if (active > 0) lines.push(`${active} task${active !== 1 ? 's' : ''} still running.`);
    if (avgQuality !== null) {
      const q = avgQuality.toFixed(1);
      lines.push(`Average quality: ${q}/5.`);
    }
    if (rated.length > 0) {
      const lowRatings = rated.filter(q => q.rating <= 2);
      if (lowRatings.length > 0) {
        lines.push(`${lowRatings.length} task${lowRatings.length !== 1 ? 's' : ''} rated 2 or below — inspect for issues.`);
      }
    }
  }

  // Previous 24h for comparison
  const prevStart = Date.now() - 48 * 60 * 60 * 1000;
  const prevEnd = Date.now() - 24 * 60 * 60 * 1000;
  const prev = delegations.filter(d => {
    const ts = new Date(d.ts || d.timestamp || d.startedAt || 0).getTime();
    return ts >= prevStart && ts < prevEnd;
  });
  if (total > 0 && prev.length > 0) {
    const delta = total - prev.length;
    const pct = ((delta / prev.length) * 100).toFixed(0);
    if (delta > 0) lines.push(`+${delta} tasks vs yesterday (+${pct}%).`);
    else if (delta < 0) lines.push(`${delta} tasks vs yesterday (${pct}%).`);
  }

  // Agent breakdown
  const byAgent = {};
  for (const d of recent) {
    const a = d.agent || 'unknown';
    if (!byAgent[a]) byAgent[a] = 0;
    byAgent[a]++;
  }
  const topAgents = Object.entries(byAgent).sort((a, b) => b[1] - a[1]).slice(0, 3);
  if (topAgents.length > 0) {
    const agentStr = topAgents.map(([a, n]) => `${a} (${n})`).join(', ');
    lines.push(`Most active: ${agentStr}.`);
  }

  const insight = {
    text: lines.join(' '),
    generatedAt: new Date().toISOString(),
    period: '24h',
    stats: { total, completed, failed, active, avgQuality: avgQuality ? +avgQuality.toFixed(2) : null },
  };

  fs.writeFileSync(OUT_PATH, JSON.stringify(insight, null, 2));
  console.log(`[insight] Written: ${OUT_PATH}`);
  console.log(`[insight] ${insight.text}`);
}

// Run: node generateInsight.js [--24h]
const force24h = process.argv.includes('--24h');
generate(force24h);
