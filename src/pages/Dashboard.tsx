import { useState, useEffect, useCallback } from 'react';
import { api } from '../api/index.ts';
import KpiCard from '../components/KpiCard.tsx';
import AgentTable from '../components/AgentTable.tsx';
import { VolumeChart, QualityChart } from '../components/TrendChart.tsx';
import TaskFeed from '../components/TaskFeed.tsx';
import SystemStatus from '../components/SystemStatus.tsx';
import InsightCard from '../components/InsightCard.tsx';
import './Dashboard.css';

interface KpiData {
  delegationRate: number;
  taskSuccess: number;
  avgQuality: number;
  errorCount: number;
  trends: {
    delegationRate?: number[];
    taskSuccess?: number[];
    avgQuality?: number[];
    errorCount?: number[];
  };
}

interface AgentData {
  name: string;
  total: number;
  successRate: number;
  avgQuality: number | null;
  avgDurationMs: number | null;
}

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

interface TrendData {
  volume?: { date: string; label: string; completed: number; failed: number; running: number; total: number }[];
  quality?: { date: string; label: string; avgQuality: number | null }[];
}

interface SystemData {
  services: {
    service: string;
    status: 'healthy' | 'degraded' | 'down' | 'unknown';
    uptime?: string;
    lastChecked?: string;
    message?: string;
  }[];
  generatedAt: string;
}

const RANGES = ['24h', '7d', '30d'];

export default function Dashboard() {
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [range, setRange] = useState<string>('7d');
  const [activeAgent, setActiveAgent] = useState<string | null>(null);
  const [taskPage, setTaskPage] = useState<number>(1);

  const [kpis, setKpis] = useState<KpiData | null>(null);

  const [agents, setAgents] = useState<AgentData[]>([]);

  const [trends, setTrends] = useState<TrendData | null>(null);

  const [tasks, setTasks] = useState<TasksResponse>({ items: [], total: 0, page: 1, pageSize: 20 });
  const [tasksLoading, setTasksLoading] = useState<boolean>(true);

  const [systemStatus, setSystemStatus] = useState<SystemData | null>(null);
  const [systemLoading, setSystemLoading] = useState<boolean>(true);

  const runningCount = tasks.items.filter((t: TaskData) => t.status === 'in_progress' || t.status === 'running').length;

  const fetchAll = useCallback(async () => {
    setLastRefresh(new Date());
    setTasksLoading(true);
    setSystemLoading(true);

    const [kpisRes, agentsRes, trendsRes, tasksRes, systemRes] = await Promise.allSettled([
      api.kpis(range),
      api.agents(range),
      api.trends(range),
      api.tasks({ range, agent: activeAgent || undefined, status: 'all', page: taskPage, pageSize: 20 }),
      api.systemStatus(),
    ]);

    if (kpisRes.status === 'fulfilled') setKpis(kpisRes.value.data);

    if (agentsRes.status === 'fulfilled') setAgents(agentsRes.value.data);

    if (trendsRes.status === 'fulfilled') setTrends(trendsRes.value.data as TrendData);

    if (tasksRes.status === 'fulfilled') { setTasks(tasksRes.value as TasksResponse); }
    setTasksLoading(false);

    if (systemRes.status === 'fulfilled') setSystemStatus(systemRes.value as SystemData);
    setSystemLoading(false);
  }, [range, activeAgent, taskPage]);

  useEffect(() => {
    const timer = setTimeout(fetchAll, 0);
    const id = setInterval(fetchAll, 15000);
    return () => { clearTimeout(timer); clearInterval(id); };
  }, [fetchAll]);

  const sparkKpis = [
    { label: 'Delegation Rate', value: kpis?.delegationRate ?? 0, unit: '%', sparkline: kpis?.trends?.delegationRate },
    { label: 'Task Success', value: kpis?.taskSuccess ?? 0, unit: '%', sparkline: kpis?.trends?.taskSuccess },
    { label: 'Avg Quality', value: kpis?.avgQuality ?? 0, unit: '/5', sparkline: kpis?.trends?.avgQuality },
    { label: 'Errors', value: kpis?.errorCount ?? 0, sparkline: kpis?.trends?.errorCount, invertTrend: true },
  ];

  const agentData = agents.map(a => ({
    name: a.name,
    total: a.total,
    successRate: a.successRate,
    avgQuality: a.avgQuality,
    avgDurationMs: a.avgDurationMs,
  }));

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <div className="header-left">
          <h1>Agent Dashboard</h1>
          <span className="refresh-badge">
            Auto-refresh: 15s · Last: {lastRefresh.toLocaleTimeString()}
          </span>
        </div>
        <div className="header-right">
          {runningCount > 0 && (
            <span className="live-badge" title={`${runningCount} task${runningCount > 1 ? 's' : ''} currently running`}>
              <span className="live-dot" />
              {runningCount} running
            </span>
          )}
          <button className="refresh-btn" onClick={fetchAll} title="Refresh now">
            ↻
          </button>
          <select
            className="range-select"
            value={range}
            onChange={e => { setRange(e.target.value); setTaskPage(1); }}
          >
            {RANGES.map(r => <option key={r} value={r}>Last {r}</option>)}
          </select>
        </div>
      </div>

      <InsightCard />

      <div className="kpi-grid">
        {sparkKpis.map(kpi => (
          <KpiCard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            unit={kpi.unit}
            sparkline={kpi.sparkline}
            invertTrend={kpi.invertTrend}
          />
        ))}
      </div>

      <div className="two-col">
        <AgentTable
          agents={agentData}
          onAgentClick={(a: string | null) => { setActiveAgent(a); setTaskPage(1); }}
          activeAgent={activeAgent}
        />
        <div className="panel">
          <div className="panel-header">
            <h2>Volume</h2>
          </div>
          <VolumeChart data={trends?.volume ?? []} />
        </div>
      </div>

      <div className="two-col">
        <div className="panel">
          <div className="panel-header">
            <h2>Quality</h2>
          </div>
          <QualityChart data={trends?.quality ?? []} />
        </div>
        <div className="panel">
          <div className="panel-header">
            <h2>Active Tasks</h2>
          </div>
          <TaskFeed
            tasks={tasks.items}
            total={tasks.total}
            page={taskPage}
            pageSize={tasks.pageSize}
            onPageChange={(p: number) => setTaskPage(p)}
            onAgentFilter={(a: string | null) => { setActiveAgent(a); setTaskPage(1); }}
            activeAgent={activeAgent}
            loading={tasksLoading}
          />
        </div>
      </div>

      <div className="panel">
        <div className="panel-header">
          <h2>System</h2>
          <span className="panel-sub">{systemStatus?.generatedAt ? `Checked ${new Date(systemStatus.generatedAt).toLocaleTimeString()}` : ''}</span>
        </div>
        <SystemStatus
          services={systemStatus?.services}
          loading={systemLoading}
        />
      </div>
    </div>
  );
}
