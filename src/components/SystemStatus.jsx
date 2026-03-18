import './SystemStatus.css';

const statusConfig = {
  operational: { cls: 'status-green', label: 'Operational' },
  degraded: { cls: 'status-yellow', label: 'Degraded' },
  down: { cls: 'status-red', label: 'Down' },
  unknown: { cls: 'status-unknown', label: 'Unknown' },
};

const overallIcon = {
  operational: '●',
  degraded: '◐',
  down: '○',
  unknown: '?',
};

export default function SystemStatus({ systemStatus, loading }) {
  if (loading) {
    return (
      <div className="system-status">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-row" style={{ height: '32px', marginBottom: '8px' }} />
        ))}
      </div>
    );
  }

  if (!systemStatus) return null;

  const overall = statusConfig[systemStatus.overall] || statusConfig.unknown;

  return (
    <div className="system-status">
      <div className="system-overall">
        <span className={`overall-dot ${overall.cls}`}>{overallIcon[systemStatus.overall]}</span>
        <span className={`overall-label ${overall.cls}`}>{overall.label}</span>
      </div>
      <ul className="service-list">
        {systemStatus.services.map((svc) => {
          const cfg = statusConfig[svc.status] || statusConfig.unknown;
          return (
            <li key={svc.name} className="service-item">
              <div className="service-info">
                <span className={`service-dot ${cfg.cls}`} />
                <span className="service-name">{svc.name}</span>
              </div>
              <div className="service-meta">
                <span className={`service-status ${cfg.cls}`}>{cfg.label}</span>
                <span className="service-detail">{svc.detail}</span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
