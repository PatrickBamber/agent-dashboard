import { useState } from 'react';
import './TaskFeed.css';

const statusConfig = {
  completed: { label: 'completed', cls: 'task-completed' },
  failed: { label: 'failed', cls: 'task-failed' },
  in_progress: { label: 'running', cls: 'task-progress' },
  running: { label: 'running', cls: 'task-progress' },
  queued: { label: 'queued', cls: 'task-queued' },
};

const agentColors = {
  coding: '#c084fc',
  research: '#60a5fa',
  pm: '#34d399',
  devops: '#fbbf24',
  none: '#7a7a9a',
};

export default function TaskFeed({ tasks = [], total = 0, page = 1, pageSize = 20, onPageChange, onAgentFilter, activeAgent, onStatusFilter, activeStatus, loading }) {
  const totalPages = Math.ceil(total / pageSize);

  const renderStars = (r) => {
    if (!r) return <span className="task-rating-empty">—</span>;
    return (
      <span className="task-rating">
        {'★'.repeat(r)}{'☆'.repeat(5 - r)}
      </span>
    );
  };

  if (loading && tasks.length === 0) {
    return (
      <div className="task-feed">
        <div className="task-feed-loading">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="skeleton-row" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="task-feed">
      {tasks.length === 0 ? (
        <div className="task-empty">
          <p>No tasks found for this period.</p>
        </div>
      ) : (
        <>
          <ul className="task-list">
            {tasks.map((task) => {
              const cfg = statusConfig[task.status] || { label: task.status, cls: '' };
              return (
                <li key={task.id} className={`task-item ${cfg.cls}`}>
                  <div className="task-info">
                    <span className="task-name" title={task.name}>{task.name}</span>
                    <span
                      className="task-agent"
                      style={{ color: agentColors[task.agent] || '#888' }}
                      onClick={() => onAgentFilter && onAgentFilter(task.agent === activeAgent ? null : task.agent)}
                    >
                      @{task.agent}
                    </span>
                  </div>
                  <div className="task-meta">
                    <span className={`task-status status-${cfg.label}`}>{cfg.label}</span>
                    <span className="task-duration">{task.duration}</span>
                    {renderStars(task.rating)}
                    <span className="task-time">{task.time}</span>
                  </div>
                </li>
              );
            })}
          </ul>

          {totalPages > 1 && (
            <div className="task-pagination">
              <button
                className="page-btn"
                disabled={page <= 1}
                onClick={() => onPageChange && onPageChange(page - 1)}
              >
                ← Prev
              </button>
              <span className="page-info">
                {page} / {totalPages}
              </span>
              <button
                className="page-btn"
                disabled={page >= totalPages}
                onClick={() => onPageChange && onPageChange(page + 1)}
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
