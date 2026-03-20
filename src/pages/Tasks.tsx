import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '../api/index.ts';
import TaskFeed from '../components/TaskFeed.tsx';
import '../components/TaskFeed.css';
import './Tasks.css';

interface TaskData {
  id: string;
  agent: string;
  status: string;
  quality: number | null;
  timestamps: { started: string; completed: string | null };
  duration_ms?: number | null;
}

interface TasksResponse {
  items: TaskData[];
  total: number;
  page: number;
  pageSize: number;
}

const RANGES = ['24h', '7d', '30d'];
const AGENTS = ['all', 'coding', 'research', 'pm', 'devops', 'security', 'business-analyst', 'designer', 'finance'];
const STATUSES = ['all', 'completed', 'failed', 'running', 'queued'];

const AGENT_LABELS: Record<string, string> = {
  all: 'All Agents', coding: 'Coding', research: 'Research', pm: 'PM', devops: 'DevOps',
  security: 'Security', 'business-analyst': 'Business Analyst', designer: 'Designer', finance: 'Finance',
};

const STATUS_LABELS: Record<string, string> = {
  all: 'All Status', completed: 'Completed', failed: 'Failed', running: 'Running', queued: 'Queued',
};

export default function Tasks() {
  const [range, setRange] = useState<string>('7d');
  const [agent, setAgent] = useState<string>('all');
  const [status, setStatus] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [tasks, setTasks] = useState<TasksResponse>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await api.tasks({
        range,
        agent: agent !== 'all' ? agent : undefined,
        status: status !== 'all' ? status : undefined,
        page,
        pageSize: 20,
      });
      setTasks(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  }, [range, agent, status, page]);

  useEffect(() => {
    setPage(1);
    fetchTasks();
  }, [fetchTasks]);

  const totalPages = useMemo(
    () => Math.ceil(tasks.total / tasks.pageSize) || 1,
    [tasks.total, tasks.pageSize]
  );

  return (
    <div className="tasks-page">
      <div className="tasks-header">
        <h1>Tasks</h1>
        <span className="tasks-total">{tasks.total} tasks</span>
      </div>

      <div className="tasks-filters">
        <select className="filter-select" value={range} onChange={e => { setRange(e.target.value); setPage(1); }} aria-label="Date range">
          {RANGES.map(r => <option key={r} value={r}>Last {r}</option>)}
        </select>
        <select className="filter-select" value={agent} onChange={e => { setAgent(e.target.value); setPage(1); }} aria-label="Filter by agent">
          {AGENTS.map(a => <option key={a} value={a}>{AGENT_LABELS[a] ?? a}</option>)}
        </select>
        <select className="filter-select" value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} aria-label="Filter by status">
          {STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
        </select>
        {loading && <span className="tasks-loading-badge">Loading…</span>}
      </div>

      {error ? (
        <div className="tasks-error">
          <p>⚠ {error}</p>
          <button className="page-btn" onClick={fetchTasks}>Retry</button>
        </div>
      ) : (
        <TaskFeed
          tasks={tasks.items}
          total={tasks.total}
          page={page}
          pageSize={tasks.pageSize}
          onPageChange={p => { setPage(p); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          onAgentFilter={a => { setAgent(a ?? 'all'); setPage(1); }}
          activeAgent={agent}
          loading={loading}
        />
      )}

      {totalPages > 1 && (
        <div className="tasks-pagination-info">
          Page {page} of {totalPages} — {tasks.total} total tasks
        </div>
      )}
    </div>
  );
}
