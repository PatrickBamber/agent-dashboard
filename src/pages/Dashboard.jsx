import { useState, useEffect } from 'react'
import './Dashboard.css'

const MOCK_DATA = {
  kpis: {
    delegationRate: { value: 78, change: 5, trend: 'up' },
    taskSuccess: { value: 94, change: 2, trend: 'up' },
    qualityScore: { value: 4.7, change: 0.3, trend: 'up' },
    errorCount: { value: 3, change: -2, trend: 'down' },
  },
  recentTasks: [
    { id: 1, name: 'Deploy staging environment', agent: 'coding', status: 'completed', time: '2m ago' },
    { id: 2, name: 'Review PR #42 — auth refactor', agent: 'coding', status: 'completed', time: '8m ago' },
    { id: 3, name: 'Check deployment health', agent: 'monitoring', status: 'in-progress', time: 'running' },
    { id: 4, name: 'Update dependencies', agent: 'coding', status: 'queued', time: 'queued' },
    { id: 5, name: 'Generate test coverage report', agent: 'devops', status: 'failed', time: '15m ago' },
  ],
  activeProjects: [
    { id: 1, name: 'agent-dashboard', status: 'active', tasks: 12, done: 9 },
    { id: 2, name: 'openclaw-config', status: 'active', tasks: 5, done: 2 },
    { id: 3, name: 'agent-cabinet', status: 'review', tasks: 8, done: 8 },
  ],
  frameworkStatus: [
    { name: 'OpenClaw', status: 'operational', uptime: '99.98%' },
    { name: 'Codex Runtime', status: 'operational', uptime: '99.95%' },
    { name: 'GitHub API', status: 'degraded', uptime: '98.12%' },
    { name: 'Telegram Bridge', status: 'operational', uptime: '100%' },
  ],
}

const statusColor = (status) => {
  switch (status) {
    case 'operational': return 'status-green'
    case 'degraded': return 'status-yellow'
    case 'down': return 'status-red'
    default: return ''
  }
}

const taskStatusClass = (status) => {
  switch (status) {
    case 'completed': return 'task-completed'
    case 'in-progress': return 'task-progress'
    case 'failed': return 'task-failed'
    case 'queued': return 'task-queued'
    default: return ''
  }
}

export default function Dashboard() {
  const [lastRefresh, setLastRefresh] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setLastRefresh(new Date())
    }, 60000)
    return () => clearInterval(timer)
  }, [])

  const { kpis } = MOCK_DATA

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1>Agent Dashboard</h1>
        <span className="refresh-badge">
          Auto-refresh: 60s · Last: {lastRefresh.toLocaleTimeString()}
        </span>
      </div>

      <section className="kpi-grid">
        <div className="kpi-card">
          <span className="kpi-label">Delegation Rate</span>
          <span className="kpi-value">{kpis.delegationRate.value}%</span>
          <span className={`kpi-change trend-${kpis.delegationRate.trend}`}>
            {kpis.delegationRate.trend === 'up' ? '↑' : '↓'} {Math.abs(kpis.delegationRate.change)}%
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Task Success</span>
          <span className="kpi-value">{kpis.taskSuccess.value}%</span>
          <span className={`kpi-change trend-${kpis.taskSuccess.trend}`}>
            {kpis.taskSuccess.trend === 'up' ? '↑' : '↓'} {Math.abs(kpis.taskSuccess.change)}%
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Quality Score</span>
          <span className="kpi-value">{kpis.qualityScore.value}</span>
          <span className={`kpi-change trend-${kpis.qualityScore.trend}`}>
            {kpis.qualityScore.trend === 'up' ? '↑' : '↓'} {Math.abs(kpis.qualityScore.change)}
          </span>
        </div>
        <div className="kpi-card">
          <span className="kpi-label">Error Count</span>
          <span className="kpi-value">{kpis.errorCount.value}</span>
          <span className={`kpi-change trend-${kpis.errorCount.trend === 'down' ? 'up' : 'down'}`}>
            {kpis.errorCount.trend === 'down' ? '↓' : '↑'} {Math.abs(kpis.errorCount.change)}
          </span>
        </div>
      </section>

      <div className="dashboard-grid">
        <section className="panel">
          <h2>Recent Tasks</h2>
          <ul className="task-list">
            {MOCK_DATA.recentTasks.map((task) => (
              <li key={task.id} className={`task-item ${taskStatusClass(task.status)}`}>
                <div className="task-info">
                  <span className="task-name">{task.name}</span>
                  <span className="task-agent">@{task.agent}</span>
                </div>
                <div className="task-meta">
                  <span className={`task-status status-${task.status}`}>{task.status}</span>
                  <span className="task-time">{task.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="panel">
          <h2>Active Projects</h2>
          <ul className="project-list">
            {MOCK_DATA.activeProjects.map((project) => {
              const pct = Math.round((project.done / project.tasks) * 100)
              return (
                <li key={project.id} className="project-item">
                  <div className="project-header">
                    <span className="project-name">{project.name}</span>
                    <span className={`project-status status-${project.status}`}>{project.status}</span>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill" style={{ width: `${pct}%` }}></div>
                  </div>
                  <span className="project-progress">{project.done}/{project.tasks} tasks · {pct}%</span>
                </li>
              )
            })}
          </ul>
        </section>

        <section className="panel">
          <h2>Framework Status</h2>
          <ul className="framework-list">
            {MOCK_DATA.frameworkStatus.map((fw) => (
              <li key={fw.name} className="framework-item">
                <div className="framework-info">
                  <span className={`status-dot ${statusColor(fw.status)}`}></span>
                  <span className="framework-name">{fw.name}</span>
                </div>
                <div className="framework-meta">
                  <span className={`fw-status-text ${statusColor(fw.status)}`}>{fw.status}</span>
                  <span className="fw-uptime">{fw.uptime}</span>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  )
}
