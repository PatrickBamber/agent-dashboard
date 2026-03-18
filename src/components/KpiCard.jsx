import './KpiCard.css';

/**
 * @param {string} label
 * @param {number|string} value
 * @param {number[]} sparkline - last 7 data points for sparkline
 * @param {string} [unit] - e.g. '%' or '/5'
 * @param {boolean} [invertTrend] - for error count: down = good
 */
export default function KpiCard({ label, value, sparkline = [], unit = '', invertTrend = false }) {
  // Compute trend direction + delta from sparkline (last two points)
  let trendDir = 'stable';
  let delta = null;
  if (sparkline && sparkline.length >= 2) {
    const prev = sparkline[sparkline.length - 2];
    const curr = sparkline[sparkline.length - 1];
    const diff = curr - prev;
    if (invertTrend) {
      // Down = good (for error count)
      if (diff < -0.5) { trendDir = 'up'; delta = diff.toFixed(1); }
      else if (diff > 0.5) { trendDir = 'down'; delta = diff.toFixed(1); }
    } else {
      if (diff > 0.5) { trendDir = 'up'; delta = `+${diff.toFixed(1)}`; }
      else if (diff < -0.5) { trendDir = 'down'; delta = diff.toFixed(1); }
    }
  }

  const trendLabel = trendDir === 'stable' ? '→' : trendDir === 'up' ? '↑' : '↓';
  const trendClass = invertTrend
    ? trendDir === 'up' ? 'trend-good' : trendDir === 'down' ? 'trend-bad' : 'trend-stable'
    : trendDir === 'up' ? 'trend-good' : trendDir === 'down' ? 'trend-bad' : 'trend-stable';

  // Build SVG sparkline path from sparkline data
  const buildSparkline = (data) => {
    if (!data || data.length < 2) return null;
    const w = 80, h = 28;
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 1;
    const points = data.map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * h;
      return `${x},${y}`;
    });
    return `M ${points.join(' L ')}`;
  };

  const sparklinePath = buildSparkline(sparkline);

  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </span>
      {delta !== null ? (
        <span className={`kpi-change ${trendClass}`}>
          {trendLabel} {delta}
        </span>
      ) : (
        <span className="kpi-change trend-stable">—</span>
      )}
      {sparklinePath && (
        <svg className="kpi-sparkline" viewBox={`0 0 80 28`} preserveAspectRatio="none">
          <polyline
            points={sparkline.map((v, i) => {
              const x = (i / (sparkline.length - 1)) * 80;
              const min = Math.min(...sparkline);
              const max = Math.max(...sparkline);
              const range = max - min || 1;
              const y = 28 - ((v - min) / range) * 28;
              return `${x},${y}`;
            }).join(' ')}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
            strokeLinecap="round"
          />
        </svg>
      )}
    </div>
  );
}
