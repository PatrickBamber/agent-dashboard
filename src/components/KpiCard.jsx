import './KpiCard.css';

const trendIcon = (direction) => {
  if (direction === 'up') return '↑';
  if (direction === 'down') return '↓';
  return '→';
};

/**
 * @param {string} label
 * @param {number|string} value
 * @param {{ direction: string, delta: number }} trend
 * @param {string} [unit] - e.g. '%' or ''
 * @param {boolean} [invertTrend] - for error count: down = good
 */
export default function KpiCard({ label, value, trend, unit = '', invertTrend = false }) {
  const effectiveTrend = invertTrend
    ? { direction: trend.direction === 'up' ? 'down' : trend.direction === 'down' ? 'up' : 'stable', delta: trend.delta }
    : trend;

  return (
    <div className="kpi-card">
      <span className="kpi-label">{label}</span>
      <span className="kpi-value">
        {value}
        {unit && <span className="kpi-unit">{unit}</span>}
      </span>
      {trend && (
        <span className={`kpi-change trend-${effectiveTrend.direction}`}>
          {trendIcon(effectiveTrend.direction)} {effectiveTrend.delta}
        </span>
      )}
    </div>
  );
}
