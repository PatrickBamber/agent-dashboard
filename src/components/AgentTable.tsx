import React, { useState } from 'react';
import './AgentTable.css';

interface Agent {
  name: string;
  total: number;
  successRate: number;
  avgQuality: number | null;
  avgDurationMs: number | null;
}

interface AgentTableProps {
  agents: Agent[];
  onAgentClick?: (agent: string | null) => void;
  activeAgent?: string | null;
}

const agentColors: Record<string, string> = {
  coding: '#c084fc', research: '#60a5fa', pm: '#34d399', devops: '#fbbf24',
};

const agentLabels: Record<string, string> = {
  coding: 'Coding', research: 'Research', pm: 'PM', devops: 'DevOps',
};

function formatDuration(ms: number | null | undefined): string {
  if (ms == null) return '—';
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
}

export default function AgentTable({ agents = [], onAgentClick, activeAgent }: AgentTableProps) {
  const [sortKey, setSortKey] = useState<string>('total');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const sorted = [...agents].sort((a, b) => {
    if (sortKey === 'name') {
      const cmp = a.name.localeCompare(b.name);
      return sortDir === 'asc' ? cmp : -cmp;
    }
    const av = a[sortKey as keyof Agent] ?? -1;
    const bv = b[sortKey as keyof Agent] ?? -1;
    if (av === bv) return 0;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const renderSortIcon = (key: string) =>
    sortKey !== key ? <span className="sort-icon">⇅</span>
    : <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;

  return (
    <div className="agent-table-wrap">
      <table className="agent-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} className="th-agent">Agent {renderSortIcon('name')}</th>
            <th onClick={() => handleSort('total')}>Tasks {renderSortIcon('total')}</th>
            <th onClick={() => handleSort('successRate')}>Success {renderSortIcon('successRate')}</th>
            <th onClick={() => handleSort('avgQuality')}>Avg Quality {renderSortIcon('avgQuality')}</th>
            <th onClick={() => handleSort('avgDurationMs')}>Avg Duration {renderSortIcon('avgDurationMs')}</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(a => (
            <tr
              key={a.name}
              className={`agent-row ${activeAgent === a.name ? 'active' : ''}`}
              onClick={() => onAgentClick?.(activeAgent === a.name ? null : a.name)}
              style={{ '--agent-color': agentColors[a.name] || '#888' } as React.CSSProperties}
            >
              <td>
                <span className="agent-badge" style={{ background: (agentColors[a.name] || '#888') + '20', color: agentColors[a.name] || '#888' }}>
                  {agentLabels[a.name] || a.name}
                </span>
              </td>
              <td className="num">{a.total}</td>
              <td className="num">
                <span className={`rate-badge ${a.successRate >= 80 ? 'rate-good' : a.successRate >= 50 ? 'rate-ok' : 'rate-bad'}`}>
                  {a.successRate}%
                </span>
              </td>
              <td className="num">
                {a.avgQuality != null
                  ? <span className="quality-stars">{'★'.repeat(Math.round(a.avgQuality))}{'☆'.repeat(5 - Math.round(a.avgQuality))} <span className="quality-num">{a.avgQuality}</span></span>
                  : <span className="text-dim">—</span>}
              </td>
              <td className="num text-dim">{formatDuration(a.avgDurationMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
