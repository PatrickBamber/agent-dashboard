import './SystemStatus.css';

interface Service {
  service: string;
  status: 'healthy' | 'degraded' | 'down' | 'unknown';
  uptime?: string;
  lastChecked?: string;
  message?: string;
}

interface SystemStatusProps {
  services?: Service[];
  loading?: boolean;
}

const statusColor: Record<string, string> = {
  healthy: 'var(--green)',
  degraded: 'var(--yellow)',
  down: 'var(--red)',
  unknown: 'var(--text-dim)',
};

function timeAgo(iso: string | null | undefined): string {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export default function SystemStatus({ services,  loading }: SystemStatusProps) {
  if (loading) {
    return (
      <div className="system-status">
        {[...Array(3)].map((_, i) => <div key={i} className="skeleton-row" style={{ height: '44px' }} />)}
      </div>
    );
  }

  if (!services?.length) {
    return <div className="system-status"><p className="system-empty">No services found.</p></div>;
  }

  return (
    <div className="system-status">
      {services.map(s => (
        <div key={s.service} className="service-row">
          <div className="service-info">
            <span className="service-name">{s.service}</span>
            {s.message && <span className="service-message">{s.message}</span>}
          </div>
          <div className="service-meta">
            <span className="service-uptime">{s.uptime ?? '—'}</span>
            <span className="service-checked">{timeAgo(s.lastChecked)}</span>
            <span className="service-dot" style={{ background: statusColor[s.status] || 'var(--text-dim)' }} />
          </div>
        </div>
      ))}
    </div>
  );
}
