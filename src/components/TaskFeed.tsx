import './TaskFeed.css';

interface Task {
  id: string;
  agent: string;
  status: string;
  quality: number | null;
  timestamps: { started: string; completed: string | null };
  duration_ms?: number | null;
}

interface TaskFeedProps {
  tasks: Task[];
  total: number;
  page: number;
  pageSize: number;
  onPageChange?: (page: number) => void;
  onAgentFilter?: (agent: string | null) => void;
  activeAgent?: string | null;
  loading?: boolean;
}

const statusConfig: Record<string, { label: string; cls: string }> = {
  completed: { label: 'Completed', cls: 'task-completed' },
  failed:    { label: 'Failed',    cls: 'task-failed'    },
  running:   { label: 'Running',   cls: 'task-running'   },
  in_progress:{ label: 'Running',   cls: 'task-running'   },
  queued:    { label: 'Queued',    cls: 'task-queued'    },
};

const agentColors: Record<string, string> = {
  coding: '#c084fc', research: '#60a5fa', pm: '#34d399', devops: '#fbbf24',
};

const agentLabels: Record<string, string> = {
  coding: 'Coding', research: 'Research', pm: 'PM', devops: 'DevOps',
};

function formatDuration(ms: number | null | undefined): string {
  if (ms == null || ms < 0) return '—';
  const s = Math.round(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function relativeTime(isoString: string | null | undefined): string {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  const d = Math.floor(h / 24);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export default function TaskFeed({ tasks = [], total = 0, page = 1, pageSize = 20, onPageChange, onAgentFilter, activeAgent, loading }: TaskFeedProps) {
  const totalPages = Math.ceil(total / pageSize) || 1;

  if (loading && tasks.length === 0) {
    return (
      <div className="task-feed">
        <div className="task-feed-loading">
          {[...Array(5)].map((_, i) => <div key={i} className="skeleton-row" />)}
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return <div className="task-empty"><p>No tasks found for this period.</p></div>;
  }

  return (
    <div className="task-feed">
      <ul className="task-list">
        {tasks.map((task) => {
          const cfg = statusConfig[task.status] || { label: task.status, cls: '' };
          return (
            <li key={task.id} className={`task-item ${cfg.cls}`}>
              <div className="task-info">
                <span className="task-name" title={task.id}>{task.id}</span>
                <span
                  className="task-agent"
                  style={{ color: agentColors[task.agent] || '#888' }}
                  onClick={() => onAgentFilter?.(task.agent === activeAgent ? null : task.agent)}
                  title={`Filter by ${task.agent}`}
                >
                  @{agentLabels[task.agent] || task.agent}
                </span>
              </div>
              <div className="task-meta">
                <span className={`task-status status-${cfg.label.toLowerCase()}`}>{cfg.label}</span>
                <span className="task-duration">{formatDuration(task.duration_ms)}</span>
                <span className="task-rating">
                  {task.quality != null
                    ? <>★ {task.quality.toFixed(1)}</>
                    : <span className="task-rating-empty">—</span>}
                </span>
                <span className="task-time">{relativeTime(task.timestamps?.started)}</span>
              </div>
            </li>
          );
        })}
      </ul>

      {totalPages > 1 && (
        <div className="task-pagination">
          <button className="page-btn" disabled={page <= 1} onClick={() => onPageChange?.(page - 1)}>← Prev</button>
          <span className="page-info">{page} / {totalPages}</span>
          <button className="page-btn" disabled={page >= totalPages} onClick={() => onPageChange?.(page + 1)}>Next →</button>
        </div>
      )}
    </div>
  );
}
