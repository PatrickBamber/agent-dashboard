import { useState, useEffect, useRef } from 'react';
import './Hud.css';

interface HudState {
  kitten: {
    status: 'active' | 'idle' | 'unknown';
    since: string | null;
    lastActivity: string | null;
    sessionAgeMs: number | null;
  };
  stats: {
    total: number;
    completed: number;
    failed: number;
    avgQuality: number | null;
  };
  recent: Array<{
    task: string;
    agent: string;
    status: string;
    rating: number | null;
    startedAt: string | null;
    completedAt: string | null;
  }>;
  errors: Array<{
    severity: string;
    description: string;
    agent: string;
    timestamp: string | null;
  }>;
  ts: string;
}

function formatAge(ms: number): string {
  if (ms < 60000) return 'just now';
  if (ms < 3600000) return `${Math.floor(ms / 60000)}m ago`;
  if (ms < 86400000) return `${Math.floor(ms / 3600000)}h ago`;
  return `${Math.floor(ms / 86400000)}d ago`;
}

function timeAgo(ts: string | null): string {
  if (!ts) return '—';
  const diff = Date.now() - new Date(ts).getTime();
  if (diff < 60000) return 'just now';
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
  return `${Math.floor(diff / 86400000)}d ago`;
}

function StatusDot({ status }: { status: string }) {
  return (
    <span className={`status-dot status-${status}`} aria-label={status} />
  );
}

function AgentBadge({ agent }: { agent: string }) {
  return <span className={`agent-badge agent-${agent}`}>{agent}</span>;
}

function StatusBadge({ status }: { status: string }) {
  return <span className={`status-badge status-${status}`}>{status}</span>;
}

export default function Hud() {
  const [state, setState] = useState<HudState | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [filter, setFilter] = useState<'all' | 'errors'>('all');
  const esRef = useRef<EventSource | null>(null);

  useEffect(() => {
    function connect() {
      const es = new EventSource('/api/hud/events');
      esRef.current = es;

      es.onopen = () => setConnected(true);
      es.onerror = () => setConnected(false);

      es.onmessage = (e) => {
        try {
          setState(JSON.parse(e.data));
          setLastUpdate(new Date());
        } catch {
          // ignore parse errors
        }
      };
    }

    // Fetch initial state via HTTP
    fetch('/api/hud/state')
      .then(r => r.json())
      .then(data => {
        setState(data);
        setLastUpdate(new Date());
      })
      .catch(() => {});

    connect();

    return () => {
      esRef.current?.close();
    };
  }, []);

  if (!state) {
    return (
      <div className="hud-loading">
        <div className="hud-spinner" />
        <p>Connecting to Kitten...</p>
      </div>
    );
  }

  const { kitten, stats, recent, errors } = state;

  return (
    <div className="hud">
      {/* ── Header ─────────────────────────────────── */}
      <header className="hud-header">
        <div className="hud-brand">
          <span className="hud-brand-icon">🐱</span>
          <span className="hud-brand-name">Kitten</span>
        </div>
        <div className="hud-header-meta">
          <div className={`conn-indicator ${connected ? 'conn-live' : 'conn-offline'}`}>
            <StatusDot status={connected ? 'active' : 'unknown'} />
            <span>{connected ? 'live' : 'offline'}</span>
          </div>
          {lastUpdate && (
            <span className="last-update">{formatAge(Date.now() - lastUpdate.getTime())}</span>
          )}
        </div>
      </header>

      {/* ── Kitten Status Card ──────────────────────── */}
      <section className="hud-card kitten-card">
        <div className="kitten-status-row">
          <div className="kitten-status-main">
            <StatusDot status={kitten.status} />
            <span className="kitten-status-label">
              {kitten.status === 'active' ? 'Active' : kitten.status === 'idle' ? 'Idle' : 'Unknown'}
            </span>
          </div>
          {kitten.lastActivity && (
            <span className="kitten-last-activity">
              Last activity: {timeAgo(kitten.lastActivity)}
            </span>
          )}
        </div>
        {errors.length > 0 && (
          <div className="kitten-alerts">
            <span className="alert-count">{errors.length} alert{errors.length !== 1 ? 's' : ''}</span>
          </div>
        )}
      </section>

      {/* ── Quick Stats ─────────────────────────────── */}
      <section className="hud-quick-stats">
        <div className="stat-chip">
          <span className="stat-val">{stats.total}</span>
          <span className="stat-label">tasks</span>
        </div>
        <div className="stat-chip stat-completed">
          <span className="stat-val">{stats.completed}</span>
          <span className="stat-label">done</span>
        </div>
        <div className="stat-chip stat-failed">
          <span className="stat-val">{stats.failed}</span>
          <span className="stat-label">failed</span>
        </div>
        {stats.avgQuality && (
          <div className="stat-chip stat-quality">
            <span className="stat-val">⭐{stats.avgQuality}</span>
            <span className="stat-label">quality</span>
          </div>
        )}
      </section>

      {/* ── Errors / Alerts ─────────────────────────── */}
      {errors.length > 0 && (
        <section className="hud-card hud-errors">
          <h2 className="hud-section-title">
            <span className="title-dot title-dot-error" />
            Alerts
          </h2>
          <ul className="error-list">
            {errors.map((err, i) => (
              <li key={i} className={`error-item error-${err.severity}`}>
                <span className="error-severity">{err.severity}</span>
                <span className="error-desc">{err.description}</span>
                <span className="error-time">{timeAgo(err.timestamp)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Activity Feed ───────────────────────────── */}
      <section className="hud-card hud-feed">
        <div className="hud-section-header">
          <h2 className="hud-section-title">
            <span className="title-dot" />
            Activity
          </h2>
          <div className="feed-filters">
            <button
              className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >All</button>
            <button
              className={`filter-btn ${filter === 'errors' ? 'active' : ''}`}
              onClick={() => setFilter('errors')}
            >Errors</button>
          </div>
        </div>

        {recent.length === 0 ? (
          <p className="feed-empty">No recent activity</p>
        ) : (
          <ul className="feed-list">
            {recent
              .filter(r => filter === 'errors' ? r.status === 'failed' : true)
              .map((item, i) => (
                <li key={i} className={`feed-item feed-${item.status}`}>
                  <div className="feed-item-top">
                    <span className="feed-task">{item.task}</span>
                    <span className="feed-time">{timeAgo(item.startedAt)}</span>
                  </div>
                  <div className="feed-item-bottom">
                    <AgentBadge agent={item.agent} />
                    <StatusBadge status={item.status} />
                    {item.rating && (
                      <span className="feed-rating">⭐{item.rating}</span>
                    )}
                  </div>
                </li>
              ))}
          </ul>
        )}
      </section>
    </div>
  );
}
