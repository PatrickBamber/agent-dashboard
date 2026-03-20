import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.js';
import KpiCard from '../components/KpiCard.jsx';
import AgentTable from '../components/AgentTable.jsx';
import { VolumeChart, QualityChart } from '../components/TrendChart.jsx';
import TaskFeed from '../components/TaskFeed.jsx';
import SystemStatus from '../components/SystemStatus.jsx';
import InsightCard from '../components/InsightCard.jsx';
import './Dashboard.css';

const RANGES = ['24h', '7d', '30d'];

export default function Dashboard() {
  const [lastRefresh, setLastRefresh] = useState(new Date());
  const [range, setRange] = useState('7d');
  const [activeAgent, setActiveAgent] = useState(null);
  const [activeStatus, setActiveStatus] = useState('all');
  const [taskPage, setTaskPage] = useState(1);

  // Data state
  const [kpis, setKpis] = useState(null);
  const [kpisLoading, setKpisLoading] = useState(true);
  const [kpisError, setKpisError] = useState(null);

  const [agents, setAgents] = useState([]);
  const [agentsLoading, setAgentsLoading] = useState(true);

  const [trends, setTrends] = useState(null);
  const [trendsLoading, setTrendsLoading] = useState(true);

  const [tasks, setTasks] = useState({ items: [], total: 0, page: 1, pageSize: 20 });
  const [tasksLoading, setTasksLoading] = useState(true);

  const [systemStatus, setSystemStatus] = useState(null);
  const [systemLoading, setSystemLoading] = useState(true);

  // Count currently-running tasks for live indicator
  const runningCount = tasks.items.filter(t => t.status === 'in_progress' || t.status === 'running').length;

  const fetchAll = useCallback(async () => {
    setLastRefresh(new Date());
    setKpisLoading(true);
    setAgentsLoading(true);
    setTrendsLoading(true);
    setTasksLoading(true);
    setSystemLoading(true);

    const [kpisRes, agentsRes, trendsRes, tasksRes, systemRes] = await Promise.allSettled([
      api.kpis(range),
      api.agents(range),
      api.trends(range),
      api.tasks({ range, agent: activeAgent || undefined, status: activeStatus !== 'all' ? activeStatus : undefined, page: taskPage, pageSize: 20 }),
      api.systemStatus(),
    ]);

    if (kpisRes.status === 'fulfilled') { setKpis(kpisRes.value.data); setKpisError(null); }
    else { setKpisError(kpisRes.reason?.message); }
    setKpisLoading(false);

    if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value.data);
    setAgentsLoading(false);

    if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data || trendsRes.value);
    setTrendsLoading(false);

    if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value.data || tasksRes.value);
    setTasksLoading(false);

    if (systemRes.status === 'fulfilled') setSystemStatus(systemRes.value.data || systemRes.value);
    setSystemLoading(false);
  }, [range, activeAgent, activeStatus, taskPage]);

  // Fetch immediately on mount, then auto-refresh every 15s
  useEffect(() => {
    const timer = setTimeout(fetchAll, 0);
    const id = setInterval(fetchAll, 15000);
    return () => { clearTimeout(timer); clearInterval(id); };
  }, [fetchAll]);

  const handleAgentFilter = (agent) => {
    setActiveAgent(agent);
    setTaskPage(1);
  };

  const handleStatusFilter = (status) => {
    setActiveStatus(status);
    setTaskPage(1);
  };

  return (
    <div className="dashboard">
      {/* Header */}
      <div className="dashboard-header">
        <h1>Agent Dashboard</h1>
        <div className="header-controls">
          <select
            className="range-select"
            value={range}
            onChange={e => { setRange(e.target.value); setTaskPage(1); }}
          >
            {RANGES.map(r => <option key={r} value={r}>Last {r}</option>)}
          </select>
          <span className="refresh-badge">
            Auto-refresh: 15s · Last: {lastRefresh.toLocaleTimeString()}
          </span>
          {runningCount > 0 && (
            <span className="live-badge" title={`${runningCount} task${runningCount > 1 ? 's' : ''} currently running`}>
              <span className="live-dot" />
              {runningCount} running
            </span>
          )}
          <button className="refresh-btn" onClick={fetchAll} title="Refresh now">
            ↻
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <section className="kpi-grid">
        {kpisLoading && !kpis ? (
          [...Array(4)].map((_, i) => <div key={i} className="skeleton-card" />)
        ) : kpis ? (
          <>
            <KpiCard
              label="Delegation Rate"
              value={kpis.delegationRate ?? 0}
              unit="%"
              sparkline={kpis.trends?.delegationRate}
            />
            <KpiCard
              label="Task Success"
              value={kpis.taskSuccess ?? 0}
              unit="%"
              sparkline={kpis.trends?.taskSuccess}
            />
            <KpiCard
              label="Avg Quality"
              value={kpis.avgQuality ?? 0}
              unit="/5"
              sparkline={kpis.trends?.avgQuality}
            />
            <KpiCard
              label="Error Count"
              value={kpis.errorCount ?? 0}
              sparkline={kpis.trends?.errorCount}
              invertTrend
            />
          </>
        ) : kpisError ? (
          <div className="error-banner">⚠ Failed to load KPIs: {kpisError}</div>
        ) : null}
      </section>

      {/* Insight Card */}
      <InsightCard />

      {/* Agent Activity + Trends */}
      <div className="two-col">
        <section className="panel">
          <h2>Agent Activity</h2>
          {agentsLoading && !agents.length ? (
            <div className="skeleton-rows">{[...Array(4)].map((_, i) => <div key={i} className="skeleton-row" style={{ height: '44px', marginBottom: '4px' }} />)}</div>
          ) : (
            <AgentTable agents={agents} onAgentClick={handleAgentFilter} activeAgent={activeAgent} />
          )}
        </section>

        <section className="panel">
          <h2>Trends</h2>
          {trendsLoading && !trends ? (
            <div className="skeleton-rows">{[...Array(3)].map((_, i) => <div key={i} className="skeleton-row" style={{ height: '36px', marginBottom: '8px' }} />)}</div>
          ) : trends ? (
            <>
              <div className="trend-section">
                <h3 className="trend-title">Task Volume</h3>
                {trends.volume?.length > 0
                  ? <VolumeChart data={trends.volume} />
                  : <div className="chart-empty">No data</div>
                }
              </div>
              <div className="trend-section">
                <h3 className="trend-title">Quality Trend</h3>
                {trends.quality?.length > 0
                  ? <QualityChart data={trends.quality} />
                  : <div className="chart-empty">No data</div>
                }
              </div>
            </>
          ) : null}
        </section>
      </div>

      {/* Recent Tasks */}
      <section className="panel panel-full">
        <div className="panel-header">
          <h2>Recent Tasks</h2>
          <div className="task-filters">
            <select
              className="filter-select"
              value={activeAgent || 'all'}
              onChange={e => handleAgentFilter(e.target.value === 'all' ? null : e.target.value)}
            >
              <option value="all">All Agents</option>
              <option value="coding">Coding</option>
              <option value="research">Research</option>
              <option value="pm">PM</option>
              <option value="devops">DevOps</option>
            </select>
            <select
              className="filter-select"
              value={activeStatus}
              onChange={e => handleStatusFilter(e.target.value)}
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
              <option value="in_progress">Running</option>
              <option value="queued">Queued</option>
            </select>
            <span className="task-count">{tasks.total} tasks</span>
          </div>
        </div>
        <TaskFeed
          tasks={tasks.items}
          total={tasks.total}
          page={tasks.page}
          pageSize={tasks.pageSize}
          onPageChange={setTaskPage}
          onAgentFilter={handleAgentFilter}
          activeAgent={activeAgent}
          loading={tasksLoading}
        />
      </section>

      {/* Framework Status */}
      <section className="panel panel-full">
        <h2>Framework Status</h2>
        <SystemStatus services={systemStatus?.services} generatedAt={systemStatus?.generatedAt} loading={systemLoading} />
      </section>
    </div>
  );
}
