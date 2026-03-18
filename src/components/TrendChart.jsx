import './TrendChart.css';

/**
 * Simple SVG bar chart for task volume.
 * data: Array<{ date, label, completed, failed, running }>
 */
export function VolumeChart({ data = [] }) {
  if (!data.length) return <div className="chart-empty">No data</div>;

  const maxVal = Math.max(...data.map(d => d.total || 0), 1);
  const barW = Math.min(32, Math.floor((100 - 2) / data.length));

  return (
    <div className="chart-wrap">
      <div className="bar-chart">
        {data.map((d, i) => {
          const totalH = Math.max(4, (d.total / maxVal) * 100);
          const failH = (d.failed / maxVal) * 100;
          const runH = (d.running / maxVal) * 100;
          return (
            <div key={d.date || i} className="bar-col" style={{ width: `${barW}%` }}>
              <div className="bar-stack">
                <div
                  className="bar bar-completed"
                  style={{ height: `${totalH}%` }}
                  title={`${d.label}: ${d.completed} completed, ${d.failed} failed, ${d.running} running`}
                />
                <div className="bar bar-running" style={{ height: `${runH}%` }} />
                <div className="bar bar-failed" style={{ height: `${failH}%` }} />
              </div>
              <span className="bar-label">{d.label}</span>
            </div>
          );
        })}
      </div>
      <div className="chart-legend">
        <span className="legend-item"><span className="dot dot-green" /> Completed</span>
        <span className="legend-item"><span className="dot dot-pink" /> Running</span>
        <span className="legend-item"><span className="dot dot-red" /> Failed</span>
      </div>
    </div>
  );
}

/**
 * Simple SVG line chart for quality trend.
 * data: Array<{ date, label, avgQuality }>
 */
export function QualityChart({ data = [] }) {
  const valid = data.filter(d => d.avgQuality != null);
  if (valid.length < 2) return <div className="chart-empty">Not enough quality data</div>;

  const min = 1;
  const max = 5;
  const W = 100;
  const H = 60;

  const pts = valid.map((d, i) => {
    const x = (i / (valid.length - 1)) * W;
    const y = H - ((d.avgQuality - min) / (max - min)) * H;
    return `${x},${y}`;
  });

  const areaPts = `0,${H} ${pts.join(' ')} ${W},${H}`;

  return (
    <div className="chart-wrap">
      <svg viewBox={`0 0 ${W} ${H + 10}`} className="line-chart" preserveAspectRatio="none">
        <defs>
          <linearGradient id="qGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c084fc" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#c084fc" stopOpacity="0" />
          </linearGradient>
        </defs>
        <polygon points={areaPts} fill="url(#qGrad)" />
        <polyline points={pts.join(' ')} fill="none" stroke="#c084fc" strokeWidth="1.5" strokeLinejoin="round" />
        {valid.map((d, i) => {
          const x = (i / (valid.length - 1)) * W;
          const y = H - ((d.avgQuality - min) / (max - min)) * H;
          return (
            <circle key={d.date || i} cx={x} cy={y} r="2" fill="#c084fc" title={`${d.label}: ${d.avgQuality}`} />
          );
        })}
      </svg>
      <div className="chart-labels">
        {valid.map((d, i) => {
          if (i === 0 || i === valid.length - 1 || i === Math.floor(valid.length / 2)) {
            return <span key={d.date || i} className="chart-label">{d.label}</span>;
          }
          return <span key={d.date || i} />;
        })}
      </div>
      <div className="chart-legend">
        <span className="legend-item"><span className="dot dot-pink" /> Avg Quality</span>
      </div>
    </div>
  );
}
