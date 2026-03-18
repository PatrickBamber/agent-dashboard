// Core data model types for agent-dashboard

// ============================================================================
// KPI (Key Performance Indicator) — top-level metrics
// ============================================================================

export interface Kpi {
  delegationRate: number;   // 0-100, percentage of tasks delegated vs self-handled
  taskSuccess: number;      // 0-100, percentage of tasks completed (not failed)
  avgQuality: number;       // 0-5, average quality rating across all rated tasks
  errorCount: number;       // count of failed tasks in the period

  // Trend data for sparklines (last 7 data points)
  trends: {
    delegationRate?: number[];
    taskSuccess?: number[];
    avgQuality?: number[];
    errorCount?: number[];
  };
}

// ============================================================================
// Task — a single delegation record
// ============================================================================

export type TaskStatus = 'completed' | 'failed' | 'running' | 'queued';
export type AgentType = 'coding' | 'research' | 'pm' | 'devops';

export interface Task {
  id: string;
  agent: AgentType;
  status: TaskStatus;
  quality: number | null;           // 1-5 rating, null if unrated
  confidencePre: number | null;    // 0-100, confidence before delegation
  confidencePost: number | null;   // 0-100, confidence after completion
  timestamps: {
    started: string;            // ISO8601
    completed: string | null;  // ISO8601 or null if still running
  };
  duration_ms?: number;        // computed: completed - started
}

// ============================================================================
// Agent — aggregated stats per agent
// ============================================================================

export interface Agent {
  name: AgentType;
  tasks: string[];             // task IDs assigned to this agent
  total: number;               // total number of tasks assigned
  successRate: number;        // 0-100
  avgQuality: number;         // 0-5
  avgDurationMs: number;       // average duration per task in ms
  totalDurationMs: number;    // sum of all task durations for this agent
}

// ============================================================================
// SystemStatus — framework/runtime health
// ============================================================================

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface SystemStatus {
  service: string;
  status: ServiceStatus;
  uptime: string;              // human-readable uptime string (e.g. "3d 14h")
  lastChecked: string;        // ISO8601
  message?: string;           // optional detail (e.g. error reason, version)
}

// ============================================================================
// API Response shapes (what the server returns)
// ============================================================================

export interface KpiApiResponse {
  data: Kpi;
  range: '24h' | '7d' | '30d';
  generatedAt: string;        // ISO8601
}

export interface AgentApiResponse {
  data: Agent[];
  range: '24h' | '7d' | '30d';
  generatedAt: string;
}

export interface TasksApiResponse {
  items: Task[];
  total: number;
  page: number;
  pageSize: number;
  range: '24h' | '7d' | '30d';
}

export interface SystemStatusApiResponse {
  services: SystemStatus[];
  generatedAt: string;
}
