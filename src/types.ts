// Core data model types for agent-dashboard

// ============================================================================
// KPI (Key Performance Indicator) — top-level metrics
// ============================================================================

export interface Kpi {
  delegation_rate: number;   // 0-100, percentage of tasks delegated vs self-handled
  success_rate: number;      // 0-100, percentage of tasks completed (not failed)
  quality_score: number;     // 0-5, average quality rating across all rated tasks
  error_count: number;       // count of failed tasks in the period

  // Trend data for sparklines (last 7 data points)
  trends: {
    delegation_rate?: number[];
    success_rate?: number[];
    quality_score?: number[];
    error_count?: number[];
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
  quality: number | null;       // 1-5 rating, null if unrated
  confidence_pre: number | null;  // 0-100, confidence before delegation
  confidence_post: number | null; // 0-100, confidence after completion
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
  success_rate: number;        // 0-100
  avg_quality: number;         // 0-5
  total_duration_ms: number;   // sum of all task durations for this agent
}

// ============================================================================
// SystemStatus — framework/runtime health
// ============================================================================

export type ServiceStatus = 'healthy' | 'degraded' | 'down' | 'unknown';

export interface SystemStatus {
  service: string;
  status: ServiceStatus;
  last_checked: string;        // ISO8601
  message?: string;            // optional detail (e.g. error reason, version)
}

// ============================================================================
// API Response shapes (what the server returns)
// ============================================================================

export interface KpiApiResponse {
  data: Kpi;
  range: '24h' | '7d' | '30d';
  generated_at: string;        // ISO8601
}

export interface AgentApiResponse {
  data: Agent[];
  range: '24h' | '7d' | '30d';
  generated_at: string;
}

export interface TasksApiResponse {
  items: Task[];
  total: number;
  page: number;
  page_size: number;
  range: '24h' | '7d' | '30d';
}

export interface SystemStatusApiResponse {
  services: SystemStatus[];
  generated_at: string;
}
