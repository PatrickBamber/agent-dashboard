import { useState } from 'react';
import './AgentTable.css';

const agentColors = {
  coding: '#c084fc',
  research: '#60a5fa',
  pm: '#34d399',
  devops: '#fbbf24',
};

const agentLabels = {
  coding: 'Coding',
  research: 'Research',
  pm: 'PM',
  devops: 'DevOps',
};

const formatDuration = (ms) => {
  if (!ms) return '—';
  const m = Math.floor(ms / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  return `${m}m`;
};

export default function AgentTable({ agents = [], onAgentClick, activeAgent }) {
  const [sortKey, setSortKey] = useState('total');
  const [sortDir, setSortDir] = useState('desc');

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = [...agents].sort((a, b) => {
    if (sortKey === 'name') {
      return sortDir === 'asc' ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name);
    }
    const av = a[sortKey] ?? -1;
    const bv = b[sortKey] ?? -1;
    if (av === bv) return 0;
    return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
  });

  const renderSortIcon = (key) => {
    if (sortKey !== key) return <span className="sort-icon">⇅</span>;
    return <span className="sort-icon active">{sortDir === 'asc' ? '↑' : '↓'}</span>;
  };

  return (
    <div className="agent-table-wrap">
      <table className="agent-table">
        <thead>
          <tr>
            <th onClick={() => handleSort('name')} className="th-agent">
              Agent {renderSortIcon('name')}
            </th>
            <th onClick={() => handleSort('total')}>
              Tasks {renderSortIcon('total')}
            </th>
            <th onClick={() => handleSort('successRate')}>
              Success {renderSortIcon('successRate')}
            </th>
            <th onClick={() => handleSort('avgQuality')}>
              Avg Quality {renderSortIcon('avgQuality')}
            </th>
            <th onClick={() => handleSort('avgDurationMs')}>
              Avg Duration {renderSortIcon('avgDurationMs')}
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map(a => (
            <tr
              key={a.name}
              className={`agent-row ${activeAgent === a.name ? 'active' : ''}`}
              onClick={() => onAgentClick && onAgentClick(a.name === activeAgent ? null : a.name)}
              style={{ '--agent-color': agentColors[a.name] || '#888' }}
            >
              <td data-label="Agent">
                <span className="agent-badge" style={{ background: (agentColors[a.name] || '#888') + '20', color: agentColors[a.name] || '#888' }}>
                  {agentLabels[a.name] || a.name}
                </span>
              </td>
              <td className="num" data-label="Tasks">{a.total}</td>
              <td className="num" data-label="Success">
                <span className={`rate-badge ${a.successRate >= 80 ? 'rate-good' : a.successRate >= 50 ? 'rate-ok' : 'rate-bad'}`}>
                  {a.successRate}%
                </span>
              </td>
              <td className="num" data-label="Avg Quality">
                {a.avgQuality != null
                  ? <span className="quality-stars">{'★'.repeat(Math.round(a.avgQuality))}{'☆'.repeat(5 - Math.round(a.avgQuality))} <span className="quality-num">{a.avgQuality}</span></span>
                  : <span className="text-dim">—</span>
                }
              </td>
              <td className="num text-dim" data-label="Avg Duration">{formatDuration(a.avgDurationMs)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
