import './SystemStatus.css';

const statusConfig = {
  healthy:  { cls: 'status-green',    label: 'Healthy'  },
  degraded: { cls: 'status-yellow',   label: 'Degraded' },
  down:     { cls: 'status-red',      label: 'Down'     },
  unknown:  { cls: 'status-unknown',  label: 'Unknown'  },
};

const overallIcon = {
  healthy:  '●',
  degraded: '◐',
  down:     '○',
  unknown:  '?',
};

function getOverallStatus(services) {
  if (!services || services.length === 0) return 'unknown';
  if (services.some(s => s.status === 'down')) return 'down';
  if (services.some(s => s.status === 'degraded')) return 'degraded';
  return 'healthy';
}

function relativeTime(isoString) {
  if (!isoString) return '—';
  const diff = Date.now() - new Date(isoString).getTime();
  const s = Math.floor(diff / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export default function SystemStatus({ services = [], generatedAt, loading }) {
  if (loading && services.length === 0) {
    return (
      <div className="system-status">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-row" style={{ height: '32px', marginBottom: '8px' }} />
        ))}
      </div>
    );
  }

  if (!services || services.length === 0) return null;

  const overall = getOverallStatus(services);
  const overallCfg = statusConfig[overall] || statusConfig.unknown;

  return (
    <div className="system-status">
      <div className="system-overall">
        <span className={`overall-dot ${overallCfg.cls}`}>{overallIcon[overall]}</span>
        <span className={`overall-label ${overallCfg.cls}`}>{overallCfg.label}</span>
        {generatedAt && (
          <span className="overall-timestamp">Checked {relativeTime(generatedAt)}</span>
        )}
      </div>
      <ul className="service-list">
        {services.map((svc) => {
          const cfg = statusConfig[svc.status] || statusConfig.unknown;
          return (
            <li key={svc.service} className="service-item">
              <div className="service-info">
                <span className={`service-dot ${cfg.cls}`} />
                <span className="service-name">{svc.service}</span>
              </div>
              <div className="service-meta">
                <span className={`service-status ${cfg.cls}`}>{cfg.label}</span>
                <span className="service-uptime">{svc.uptime}</span>
                {svc.message && <span className="service-message">{svc.message}</span>}
                <span className="service-checked">{relativeTime(svc.lastChecked)}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
