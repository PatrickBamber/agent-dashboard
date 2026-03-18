# Agent Dashboard — SPEC.md

## 1. Overview

**Project:** `agent-dashboard`  
**Type:** Single-page React application (Vite)  
**Status:** v0.1 — scaffolded UI with mock data; no real data integration yet

This spec defines the next phase: connecting the dashboard to real agent-cabinet logs and OpenClaw runtime data, and enriching the UX with trends, drill-downs, and actionable insights.

---

## 2. Purpose & Goals

**Goal:** Give Pat a single-pane-of-glass view into how his agent system is performing — what's running, what's succeeding, where the bottlenecks are, and what to do next.

**Principles:**
- **At-a-glance** — Key health signals visible without scrolling
- **Trend-aware** — Spot degradation before it becomes a problem
- **Actionable** — Link data to next steps (e.g., error → investigate)
- **Low-burn** — Minimal noise; only show what matters

---

## 3. Audience

- **Primary:** Pat (software engineer, busy, technical)
- **Context:** Uses OpenClaw + agent-cabinet daily via Telegram; wants a browser tab to check in on system health and agent productivity without context-switching

---

## 4. Data Sources

### 4.1 Local Data Files (v1 — static sample data)

For v1, the dashboard uses static JSON files in `data/` as the data source. These serve as the contract between the data model and the UI, and can later be replaced by live aggregation from real logs.

| Path | Contents | Type |
|------|----------|------|
| `data/kpis.json` | Top-level KPI metrics + trend sparklines | `Kpi` |
| `data/tasks.json` | Paginated task delegation records | `TasksApiResponse` |
| `data/agents.json` | Aggregated stats per agent | `Agent[]` |
| `data/system-status.json` | Runtime service health | `SystemStatusApiResponse` |

> **Data types** are defined in `src/types.ts` — the single source of truth for all TypeScript interfaces.

### 4.2 Agent Cabinet Logs (future: live integration)

Located in `~/.openclaw/workspace/agent-cabinet/logs/`:

| Path | Contents | Format |
|------|----------|--------|
| `delegations/*.json` | Task delegation records | JSON, one per task |
| `quality/*.json` | Post-task quality ratings | JSON, one per task |
| `sessions/*.json` | Session start/end events | JSON, one per session |

### 4.3 Delegation Log Schema (current)

```json
{
  "task": "string",
  "agent": "coding | research | pm | devops",
  "status": "completed | failed | running",
  "startedAt": "ISO8601",
  "completedAt": "ISO8601 | null",
  "rating": 1-5 | null
}
```

### 4.3 OpenClaw Runtime API

- Gateway status endpoint (local)
- Active session count
- Error log tail

### 4.4 GitHub API (optional)

- PR/checks status for active repos
- Not required for v1; placeholder card only

---

## 5. Dashboard Sections

### 5.1 Header Bar

- App title + version badge
- Last refresh timestamp + manual refresh button
- Agent-cabinet connection status indicator (green dot = healthy, red = can't reach logs)
- Time range selector: Last 24h | 7d | 30d (default: 7d)

### 5.2 KPI Strip (Top Row)

Four cards, always visible:

| Card | Metric | Source |
|------|--------|--------|
| **Delegation Rate** | % tasks delegated vs handled in main session | `delegations/` count vs total tasks |
| **Task Success Rate** | % completed (not failed) | `delegations/` status breakdown |
| **Avg Quality Score** | Mean rating across rated tasks | `quality/` ratings |
| **Error / Failure Count** | Count of failed tasks in period | `delegations/` status=failed |

Each card shows:
- Current value (large)
- Trend arrow + delta vs previous period (small)
- Subtle sparkline (last 7 data points) — **new**

### 5.3 Agent Activity Panel

Horizontal bar chart (or table) showing task volume per agent:

- Columns: `coding`, `research`, `pm`, `devops`
- Metrics per agent: total tasks, success rate, avg quality, avg duration
- Sortable by any column
- Click agent row to filter Recent Tasks (5.5) to that agent

### 5.4 Trend Charts

Two time-series charts:

1. **Task Volume (7d)** — stacked area chart: completed / failed / running per day
2. **Quality Trend (7d)** — line chart: rolling avg quality score per day

Tech: Recharts or lightweight SVG (no heavy chart lib unless already in deps)

### 5.5 Recent Tasks Feed

Paginated list of last 20 delegations:

| Column | Details |
|--------|---------|
| Task name | Truncated at 60 chars |
| Agent | Badge (color-coded by agent type) |
| Status | completed / failed / running / queued |
| Duration | "3m 24s" — calculated from timestamps |
| Rating | ⭐ 1-5 or "—" if unrated |
| Time | Relative ("2m ago") |

Filters: agent type, status, date range  
Sort: newest first (default), or by status

### 5.6 Project Health (Stretch / v2)

Scan git repos under `~/patrickbamber/Developer/` for `.agent-todo` markers or conventional commit metadata to infer active project status.

Not required for v1; add as extension.

### 5.7 Framework / System Status

Current operational health:

| Service | Status Source |
|---------|--------------|
| OpenClaw Gateway | Local health endpoint |
| Telegram Bridge | Connection state |
| Agent-Cabinet Logs | Directory readable + recent writes |
| GitHub API | Optional; show rate limit status if configured |

Visual: status dot grid (compact), expandable to detail panel.

---

## 6. UX / UI Notes

### 6.1 Layout

- **Single page**, vertical scroll, no routing needed yet
- **Responsive:** usable on desktop (primary) and tablet; mobile de-prioritized
- Max content width: 1200px, centered
- Sidebar-free — header + content only

### 6.2 Color Scheme

Follow existing `index.css` / `App.css` variables. If none, use a neutral dark-friendly palette:

- Background: `#0f1117` (near-black)
- Surface: `#1c1f2e` (card backgrounds)
- Border: `#2a2d3e`
- Accent: `#6c8ef5` (soft blue)
- Success: `#4caf7d`
- Warning: `#e8a838`
- Error: `#e05252`

### 6.3 Typography

- Font: system stack (no external font dependency)
- KPI values: large, bold monospace-ish
- Body: clean sans-serif

### 6.4 Interactions

- Auto-refresh: 60s (already implemented; keep it)
- Manual refresh button in header
- Sparklines are decorative (not interactive) in v1
- Filter controls: dropdowns/selects — no modal dialogs
- Hover states on all clickable elements

### 6.5 Error States

- If logs directory missing: show friendly empty state with setup hint
- If data fetch fails: show inline error banner, keep last good data
- Loading state: skeleton cards (not spinners)

---

## 7. Technical Approach

### 7.1 Data Layer (v1)

- **Node.js backend** (Express or Fastify) that reads agent-cabinet logs and exposes a REST API
- OR: read logs directly from the frontend via a local API endpoint served by OpenClaw / Vite proxy
- Prefer: lightweight Express server in `server/` directory that aggregates logs and serves `/api/*`

### 7.2 API Endpoints (proposed)

```
GET /api/kpis?range=7d     → { delegationRate, taskSuccess, avgQuality, errorCount, trends }
GET /api/agents?range=7d   → [{ agent, total, successRate, avgQuality, avgDurationMs }]
GET /api/tasks?range=7d&agent=&status=&page=1 → { items: [...], total, page, pageSize }
GET /api/system-status     → [{ service, status, uptime }]
```

### 7.3 Data Aggregation

- Log files are JSONL (newline-delimited JSON) — one JSON object per line
- Server reads and aggregates on startup + every 30s
- No database — raw log files are the source of truth

### 7.4 Build / Dev

- Keep existing `npm run dev` for frontend
- Add `npm run server` for the API server (concurrent with Vite in dev)
- Single `npm start` command runs both in production

### 7.5 Logging & Monitoring

- Dashboard server logs: requests, errors, aggregation stats
- No external logging service needed

---

## 8. Out of Scope (v1)

- User auth (single-user local app)
- Historical data export
- Alerting / notifications
- Mobile layout optimization
- Project-level task tracking (5.6)

---

## 9. File Structure

```
agent-dashboard/
├── SPEC.md                    ← this file
├── data/                     ← static sample data (replaced by live later)
│   ├── kpis.json             ← KPI metrics + trends
│   ├── tasks.json            ← paginated task list
│   ├── agents.json           ← per-agent aggregated stats
│   └── system-status.json    ← service health
├── src/
│   ├── types.ts              ← TypeScript interfaces for all data models
│   ├── App.jsx
│   ├── pages/
│   │   └── Dashboard.jsx      ← main dashboard view
│   ├── components/
│   │   ├── KpiCard.jsx        ← reusable KPI card with sparkline
│   │   ├── AgentTable.jsx     ← agent activity table
│   │   ├── TrendChart.jsx     ← time-series chart
│   │   ├── TaskFeed.jsx       ← recent tasks with filters
│   │   └── SystemStatus.jsx   ← framework status dots
│   ├── hooks/
│   │   └── useApi.js          ← fetch wrapper with loading/error state
│   └── api/
│       └── index.js           ← API client (fetch calls to server)
├── server/
│   ├── index.js               ← Express/Fastify server entry
│   ├── routes/
│   │   ├── kpis.js
│   │   ├── agents.js
│   │   ├── tasks.js
│   │   └── system.js
│   └── lib/
│       └── logReader.js       ← reads + aggregates JSONL log files
├── package.json               ← add server deps here
└── vite.config.js             ← proxy /api → server in dev
```

### 9.1 Data Model Summary (`src/types.ts`)

All TypeScript interfaces are co-located in `src/types.ts` for easy reference and type-checking.

| Interface | Description |
|-----------|-------------|
| `Kpi` | Top-level metrics: delegation_rate, success_rate, quality_score, error_count + trend sparklines |
| `Task` | Single delegation: id, agent, status, quality, confidence_pre/post, timestamps |
| `Agent` | Aggregated per-agent: name, task IDs, success_rate, avg_quality, total_duration |
| `SystemStatus` | Service health: service name, status (healthy/degraded/down/unknown), last_checked |
| `KpiApiResponse` | API envelope wrapping Kpi + range + generated_at |
| `AgentApiResponse` | API envelope wrapping Agent[] + range + generated_at |
| `TasksApiResponse` | Paginated task list with items, total, page, page_size |
| `SystemStatusApiResponse` | API envelope wrapping SystemStatus[] + generated_at |

---

## 10. Success Criteria (v1)

- [ ] **Data model defined** — `src/types.ts` has all interfaces; `data/*.json` have realistic sample data
- [ ] Dashboard loads with real data from agent-cabinet logs (no mock data)
- [ ] KPI cards show correct values with trend arrows
- [ ] Agent activity table is populated and sortable
- [ ] Task feed is filterable and paginated
- [ ] System status reflects actual runtime health
- [ ] App gracefully handles missing/malformed log files
- [ ] `npm start` runs both frontend + backend concurrently
- [ ] Page renders in < 2s on local machine
