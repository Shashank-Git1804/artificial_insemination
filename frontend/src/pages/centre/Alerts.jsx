import { useEffect, useState, useCallback } from 'react';
import api from '../../api/axios';

const PAGE_SIZE = 20;

export default function CentreAlerts() {
  const [alerts, setAlerts]   = useState([]);
  const [filter, setFilter]   = useState('all');
  const [page, setPage]       = useState(1);
  const [total, setTotal]     = useState(0);
  const [loading, setLoading] = useState(false);

  const fetchAlerts = useCallback(async (currentPage = 1, currentFilter = 'all') => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        result: 'positive',
        limit:  PAGE_SIZE,
        skip:   (currentPage - 1) * PAGE_SIZE,
      });
      if (currentFilter !== 'all') params.set('type', currentFilter);

      const { data } = await api.get(`/predictions?${params}`);
      // Deduplicate by _id in case of duplicate renders
      const seen = new Set();
      const deduped = (Array.isArray(data.predictions) ? data.predictions : data)
        .filter(p => { if (seen.has(p._id)) return false; seen.add(p._id); return true; });

      setAlerts(deduped);
      setTotal(data.total || deduped.length);
    } catch (e) {
      console.error('Alerts fetch error:', e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load + auto-refresh every 60s
  useEffect(() => {
    fetchAlerts(page, filter);
    const interval = setInterval(() => fetchAlerts(page, filter), 60_000);
    return () => clearInterval(interval);
  }, [page, filter, fetchAlerts]);

  const handleFilter = (f) => { setFilter(f); setPage(1); };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="page">
      <div className="page-header">
        <h2>🚨 Heat & Health Alerts</h2>
        <p>Positive AI detections — auto-refreshes every 60s</p>
      </div>

      <div className="filter-tabs">
        {[['all','📋 All'],['heat','🌡️ Heat'],['infection','🔬 Infection']].map(([f, label]) => (
          <button key={f} className={`tab ${filter === f ? 'active' : ''}`} onClick={() => handleFilter(f)}>
            {label}
          </button>
        ))}
        <button onClick={() => fetchAlerts(page, filter)} style={{ marginLeft: 'auto', fontSize: 12, padding: '4px 10px' }}>
          🔄 Refresh
        </button>
      </div>

      {loading && <p style={{ textAlign: 'center', padding: 20, color: '#888' }}>Loading alerts...</p>}

      {!loading && alerts.length === 0 && (
        <p className="empty">No alerts found.</p>
      )}

      <div className="alerts-grid">
        {alerts.map(p => (
          <div key={p._id} className={`alert-card ${p.type}`}>
            <div className="alert-header">
              <span className="alert-type-badge">
                {p.type === 'heat' ? '🌡️ Heat Detected' : '🔬 Infection Suspected'}
              </span>
              <span className="alert-time">
                {new Date(p.createdAt).toLocaleDateString('en-IN', {
                  day: 'numeric', month: 'short', year: 'numeric',
                  hour: '2-digit', minute: '2-digit',
                })}
              </span>
            </div>
            <div className="alert-body">
              <div className="alert-animal">
                🐄 {p.animal?.species} — <strong>{p.animal?.tagId}</strong>
                {p.animal?.breed && ` (${p.animal.breed})`}
              </div>
              <div className="alert-farmer">
                👨‍🌾 {p.farmer?.name} | 📞 {p.farmer?.phone}
              </div>
              <div className="alert-location">📍 {p.farmer?.village}, {p.farmer?.district}</div>
              <div className="confidence-bar small">
                <div className="confidence-fill" style={{ width: `${p.confidence}%` }} />
              </div>
              <p className="confidence-text">Confidence: {p.confidence}%</p>
              <p className="alert-recommendation">{p.recommendation}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e0', cursor: 'pointer' }}>
            ← Prev
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(n => (
            <button key={n} onClick={() => setPage(n)}
              style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid #cbd5e0', cursor: 'pointer',
                background: page === n ? 'var(--primary)' : '#fff',
                color: page === n ? '#fff' : '#2d3748', fontWeight: page === n ? 700 : 400 }}>
              {n}
            </button>
          ))}
          <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
            style={{ padding: '6px 14px', borderRadius: 6, border: '1px solid #cbd5e0', cursor: 'pointer' }}>
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
