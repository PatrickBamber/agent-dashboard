import './TrendChart.css';

interface VolumeData {
  date: string;
  label: string;
  completed: number;
  failed: number;
  running: number;
  total: number;
}

interface QualityData {
  date: string;
  label: string;
  avgQuality: number | null;
}

function VolumeChart({ data = [] }: { data: VolumeData[] }) {
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
                <div className="bar bar-completed" style={{ height: `${totalH}%` }}
                  title={`${d.label}: ${d.completed} completed, ${d.failed} failed, ${d.running} running`} />
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

function QualityChart({ data = [] }: { data: QualityData[] }) {
  const valid = data.filter(d => d.avgQuality != null);
  if (!valid.length) return <div className="chart-empty">No data</div>;
  const maxVal = 5;

  return (
    <div className="chart-wrap">
      <div className="line-chart">
        {valid.map((d, i) => {
          const x = (i / Math.max(valid.length - 1, 1)) * 100;
          const y = 100 - ((d.avgQuality ?? 0) / maxVal) * 100;
          return (
            <g key={d.date || i}>
              <circle cx={x} cy={y} r="4" fill="var(--pink)" />
              <text x={x} y={y + 14} className="chart-label" textAnchor="middle">
                {d.avgQuality?.toFixed(1)}
              </text>
            </g>
          );
        })}
        <polyline
          points={valid.map((d, i) => {
            const x = (i / Math.max(valid.length - 1, 1)) * 100;
            const y = 100 - ((d.avgQuality ?? 0) / maxVal) * 100;
            return `${x},${y}`;
          }).join(' ')}
          fill="none"
          stroke="var(--pink)"
          strokeWidth="2"
        />
      </div>
      <div className="chart-labels">
        {valid.filter((_, i) => i % Math.ceil(valid.length / 5) === 0).map(d => (
          <span key={d.date} className="chart-label">{d.label}</span>
        ))}
      </div>
    </div>
  );
}

export { VolumeChart, QualityChart };
