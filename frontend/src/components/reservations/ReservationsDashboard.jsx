import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/redwood-authentic.css';

function ReservationsDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/reservations/stats');
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setLoading(false);
    }
  };

  if (loading) return <div className="rw-loading">Loading...</div>;
  if (!stats) return <div className="rw-error">Failed to load data</div>;

  return (
    <div className="rw-dashboard">
      <div className="rw-kpi-grid">
        {stats.kpis?.map((kpi, index) => (
          <div key={index} className="rw-kpi-card">
            <div className="rw-kpi-label">{kpi.label}</div>
            <div className="rw-kpi-value">{kpi.value}</div>
            <div className="rw-kpi-subtitle">{kpi.subtitle}</div>
          </div>
        ))}
      </div>
      <div className="rw-section" style={{ marginTop: '24px' }}>
        <h2 className="rw-section-title">Analytics</h2>
        <p className="rw-section-description">Comprehensive reservations analytics and insights</p>
      </div>
    </div>
  );
}

export default ReservationsDashboard;
