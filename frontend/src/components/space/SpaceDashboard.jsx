import { useState, useEffect } from 'react';
import axios from 'axios';
import '../../styles/redwood-authentic.css';

function SpaceDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('/api/space/stats');
      setStats(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching space stats:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="rw-loading">Loading space data...</div>;
  }

  if (!stats) {
    return <div className="rw-error">Failed to load space data</div>;
  }

  // API returns { success: true, data: { kpis: {...}, spacesByType } } — normalize for dashboard
  const payload = stats.data || stats;
  const rawKpis = payload.kpis || {};
  const kpis = Array.isArray(rawKpis)
    ? rawKpis
    : [
        { label: 'Total Spaces', value: rawKpis.totalSpaces ?? 0, subtitle: 'Total' },
        { label: 'Occupied', value: rawKpis.occupied ?? 0, subtitle: 'In use' },
        { label: 'Vacant', value: rawKpis.vacant ?? 0, subtitle: 'Available' },
        { label: 'Reserved', value: rawKpis.reserved ?? 0, subtitle: 'Reserved' },
        { label: 'Total Area', value: rawKpis.totalArea ?? 0, subtitle: 'sq ft' },
        { label: 'Occupancy Rate', value: `${rawKpis.occupancyRate ?? 0}%`, subtitle: '' }
      ].filter(k => k.value != null);
  const charts = payload.charts || {};
  const occupancyByBuilding = Array.isArray(charts.occupancyByBuilding) ? charts.occupancyByBuilding : [];
  const spaceTypeDistribution = Array.isArray(charts.spaceTypeDistribution) ? charts.spaceTypeDistribution : (Array.isArray(payload.spacesByType) ? payload.spacesByType : []);
  const utilizationTrend = Array.isArray(charts.utilizationTrend) ? charts.utilizationTrend : [];
  const recentChanges = Array.isArray(payload.recentChanges) ? payload.recentChanges : [];
  const spaceTypeTotal = spaceTypeDistribution.reduce((sum, i) => sum + (i.count || 0), 0);

  return (
    <div className="rw-dashboard">
      {/* KPI Cards */}
      <div className="rw-kpi-grid">
        {kpis.map((kpi, index) => (
          <div key={index} className="rw-kpi-card">
            <div className="rw-kpi-label">{kpi.label}</div>
            <div className="rw-kpi-value">{kpi.value}</div>
            <div className="rw-kpi-subtitle">{kpi.subtitle}</div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="rw-section" style={{ marginTop: '24px' }}>
        <h2 className="rw-section-title">Space Analytics</h2>
        <div className="rw-charts-grid">
          {/* Occupancy by Building */}
          <div className="rw-card">
            <div className="rw-card-header">
              <h3 className="rw-chart-title">Occupancy by Building</h3>
            </div>
            <div className="rw-card-body">
              <div className="rw-chart-container">
                {occupancyByBuilding.length === 0 ? <p className="rw-muted">No building data available</p> : occupancyByBuilding.map((item, index) => (
                  <div key={index} className="rw-bar-chart-item">
                    <div className="rw-bar-label">{item.building}</div>
                    <div className="rw-bar-wrapper">
                      <div 
                        className="rw-bar" 
                        style={{ 
                          width: `${item.percentage || 0}%`,
                          backgroundColor: item.color || '#2C5F6F' 
                        }}
                      >
                        <span className="rw-bar-value">{item.percentage ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Space Type Distribution */}
          <div className="rw-card">
            <div className="rw-card-header">
              <h3 className="rw-chart-title">Space Type Distribution</h3>
            </div>
            <div className="rw-card-body">
              <div className="rw-chart-container">
                {spaceTypeDistribution.map((item, index) => (
                  <div key={index} className="rw-bar-chart-item">
                    <div className="rw-bar-label">{item.type}</div>
                    <div className="rw-bar-wrapper">
                      <div 
                        className="rw-bar" 
                        style={{ 
                          width: `${spaceTypeTotal ? ((item.count || 0) / spaceTypeTotal * 100).toFixed(0) : 0}%`,
                          backgroundColor: item.color || '#2C5F6F' 
                        }}
                      >
                        <span className="rw-bar-value">{item.count ?? 0}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Utilization Trend */}
          <div className="rw-card">
            <div className="rw-card-header">
              <h3 className="rw-chart-title">Utilization Trend (Last 6 Months)</h3>
            </div>
            <div className="rw-card-body">
              <div className="rw-chart-container">
                {utilizationTrend.length === 0 ? <p className="rw-muted">No trend data available</p> : utilizationTrend.map((item, index) => (
                  <div key={index} className="rw-bar-chart-item">
                    <div className="rw-bar-label">{item.month}</div>
                    <div className="rw-bar-wrapper">
                      <div 
                        className="rw-bar" 
                        style={{ 
                          width: `${item.utilization || 0}%`,
                          backgroundColor: '#2C5F6F'
                        }}
                      >
                        <span className="rw-bar-value">{item.utilization ?? 0}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="rw-section" style={{ marginTop: '24px' }}>
        <h2 className="rw-section-title">Recent Space Changes</h2>
        <div className="rw-table-container">
          <table className="rw-table">
            <thead>
              <tr>
                <th>Space</th>
                <th>Building</th>
                <th>Floor</th>
                <th>Change Type</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {recentChanges.length === 0 ? (
                <tr><td colSpan={5} className="rw-muted">No recent changes</td></tr>
              ) : recentChanges.map((change, index) => (
                <tr key={index}>
                  <td>{change.space}</td>
                  <td>{change.building}</td>
                  <td>{change.floor}</td>
                  <td><span className={`rw-badge rw-status-${(change.type || '').toLowerCase()}`}>{change.type}</span></td>
                  <td>{change.date}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default SpaceDashboard;

