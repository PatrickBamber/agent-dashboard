import './KpiCard.css';

interface KpiCardProps {
  label: string;
  value: number;
  sparkline?: number[];
  unit?: string;
  invertTrend?: boolean;
}

export default function KpiCard({ label, value, sparkline = [], unit = '', invertTrend = false }: KpiCardProps) {
  let trendDir: 'up' | 'down' | 'stable' = 'stable';
  let delta: string | null = null;
  if (sparkline && sparkline.length >= 2) {
    const prev = sparkline[sparkline.length - 2];
    const curr = sparkline[sparkline.length - 1];
    const diff = curr - prev;
    if (invertTrend) {
      if (diff < -0.5) { trendDir = 'up'; delta = diff.toFixed(1); }
      else if (diff > 0.5) { trendDir = 'down'; delta = diff.toFixed(1); }
    } else {
      if (diff > 0.5) { trendDir = 'up'; delta = diff.toFixed(1); }
      else if (diff < -0.5) { trendDir = 'down'; delta = diff.toFixed(1); }
    }
  }

  const trendArrow = trendDir === 'up' ? '↑' : trendDir === 'down' ? '↓' : '→';

  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-label">{label}</span>
        <span className={`kpi-trend trend-${trendDir}`}>{trendArrow} {delta != null ? `${delta}` : ''}</span>
      </div>
      <div className="kpi-value">
        <span className="kpi-number">{typeof value === 'number' ? value.toLocaleString() : value}</span>
        {unit && <span className="kpi-unit">{unit}</span>}
      </div>
    </div>
  );
}
