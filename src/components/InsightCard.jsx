import { useState, useEffect, useCallback } from 'react';
import './InsightCard.css';

function timeAgo(isoString) {
  if (!isoString) return '';
  const diff = Date.now() - new Date(isoString).getTime();
  const m = Math.floor(diff / 60000);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export default function InsightCard() {
  const [insight, setInsight] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchInsight = useCallback(async () => {
    try {
      const res = await fetch('/api/insight');
      if (res.ok) {
        const data = await res.json();
        setInsight(data);
      }
    } catch {
      // silently ignore — insight is supplementary
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInsight();
  }, [fetchInsight]);

  if (loading) {
    return (
      <div className="insight-card insight-loading">
        <div className="skeleton-row" style={{ height: '20px', width: '60%' }} />
        <div className="skeleton-row" style={{ height: '16px', width: '80%', marginTop: '8px' }} />
      </div>
    );
  }

  if (!insight?.text) return null;

  return (
    <div className="insight-card">
      <div className="insight-header">
        <span className="insight-icon">💡</span>
        <span className="insight-title">Daily Insight</span>
        <span className="insight-time">{timeAgo(insight.generatedAt)}</span>
      </div>
      <p className="insight-text">{insight.text}</p>
      {insight.stats && (
        <div className="insight-stats">
          <span title="Completed">{insight.stats.completed ?? 0} ✓</span>
          <span title="Failed" className={insight.stats.failed > 0 ? 'insight-fail' : ''}>{insight.stats.failed ?? 0} ✗</span>
          <span title="Running">{insight.stats.active ?? 0} ⚡</span>
          {insight.stats.avgQuality != null && (
            <span title="Avg quality">★ {insight.stats.avgQuality}</span>
          )}
        </div>
      )}
    </div>
  );
}
