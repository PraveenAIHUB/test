import { useState, useEffect } from 'react';
import '../styles/Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState({
    totalProperties: 0,
    activeLeases: 0,
    openWorkOrders: 0,
    monthlyRevenue: 0
  });

  const [revenueData, setRevenueData] = useState([]);
  const [occupancyData, setOccupancyData] = useState([]);
  const [maintenanceData, setMaintenanceData] = useState([]);

  useEffect(() => {
    // Load dashboard data
    setStats({
      totalProperties: 28,
      activeLeases: 156,
      openWorkOrders: 12,
      monthlyRevenue: 45800000
    });

    setRevenueData([
      { property: 'Westlands Business Park', revenue: 8500000, percentage: 18.5 },
      { property: 'Kilimani Towers', revenue: 7200000, percentage: 15.7 },
      { property: 'Upper Hill Plaza', revenue: 6800000, percentage: 14.8 },
      { property: 'Karen Office Complex', revenue: 5900000, percentage: 12.9 },
      { property: 'Mombasa Road Industrial', revenue: 4600000, percentage: 10.0 }
    ]);

    setOccupancyData([
      { property: 'Westlands Business Park', occupied: 45, total: 48, rate: 93.8 },
      { property: 'Kilimani Towers', occupied: 38, total: 42, rate: 90.5 },
      { property: 'Upper Hill Plaza', occupied: 32, total: 36, rate: 88.9 },
      { property: 'Karen Office Complex', occupied: 28, total: 30, rate: 93.3 },
      { property: 'CBD Commercial Center', occupied: 24, total: 28, rate: 85.7 }
    ]);

    setMaintenanceData([
      { category: 'HVAC Systems', cost: 1250000, percentage: 32, color: '#667eea' },
      { category: 'Plumbing', cost: 980000, percentage: 25, color: '#764ba2' },
      { category: 'Electrical', cost: 750000, percentage: 19, color: '#14b8a6' },
      { category: 'Elevators', cost: 620000, percentage: 16, color: '#f59e0b' },
      { category: 'Security Systems', cost: 320000, percentage: 8, color: '#8b5cf6' }
    ]);
  }, []);

  const formatCurrency = (amount) => {
    return `KES ${(amount / 1000000).toFixed(1)}M`;
  };

  return (
    <div className="dashboard-container">
      {/* Page Header */}
      <div className="dashboard-header">
        <div className="dashboard-header-content">
          <div className="dashboard-title-row">
            <h1 className="dashboard-title">Dashboard</h1>
            <div className="dashboard-actions">
              <button className="dashboard-btn">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                Export
              </button>
              <button className="dashboard-btn dashboard-btn-primary">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="16" height="16">
                  <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                New Property
              </button>
            </div>
          </div>
          <p className="dashboard-subtitle">Overview of your property portfolio performance</p>
        </div>
      </div>

      {/* Main Content */}
      <div className="dashboard-content">
        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card" data-testid="total-properties-stat">
            <div className="stat-header">
              <p className="stat-label">Total Properties</p>
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="9 22 9 12 15 12 15 22" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="stat-value">{stats.totalProperties}</div>
            <div className="stat-change positive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>12% from last month</span>
            </div>
          </div>

          <div className="stat-card" data-testid="active-leases-stat">
            <div className="stat-header">
              <p className="stat-label">Active Leases</p>
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <polyline points="14 2 14 8 20 8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="13" x2="8" y2="13" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <line x1="16" y1="17" x2="8" y2="17" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="stat-value">{stats.activeLeases}</div>
            <div className="stat-change positive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>8% from last month</span>
            </div>
          </div>

          <div className="stat-card" data-testid="work-orders-stat">
            <div className="stat-header">
              <p className="stat-label">Open Work Orders</p>
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="stat-value">{stats.openWorkOrders}</div>
            <div className="stat-change negative">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>3 urgent</span>
            </div>
          </div>

          <div className="stat-card" data-testid="monthly-revenue-stat">
            <div className="stat-header">
              <p className="stat-label">Monthly Revenue</p>
              <div className="stat-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <line x1="12" y1="1" x2="12" y2="23" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
            </div>
            <div className="stat-value">{formatCurrency(stats.monthlyRevenue)}</div>
            <div className="stat-change positive">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>15% from last month</span>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="charts-grid">
          {/* Revenue Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Revenue by Property</h3>
              <div className="chart-actions">
                <button className="chart-btn">View All</button>
              </div>
            </div>
            <div className="bar-chart">
              {revenueData.map((item, index) => (
                <div key={index} className="bar-item">
                  <div className="bar-label">{item.property}</div>
                  <div className="bar-visual">
                    <div className="bar-fill" style={{ width: `${item.percentage * 5}%` }}>
                      <span className="bar-value">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                  <div className="bar-percentage">{item.percentage}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* Maintenance Chart */}
          <div className="chart-card">
            <div className="chart-header">
              <h3 className="chart-title">Maintenance Cost Analysis</h3>
              <div className="chart-actions">
                <button className="chart-btn">Details</button>
              </div>
            </div>
            <div className="donut-chart-container">
              <div className="donut-chart">
                <svg viewBox="0 0 200 200" width="200" height="200">
                  {maintenanceData.reduce((acc, item, index) => {
                    const total = maintenanceData.reduce((sum, d) => sum + d.percentage, 0);
                    const startAngle = acc.angle;
                    const angle = (item.percentage / total) * 360;
                    const endAngle = startAngle + angle;
                    
                    const x1 = 100 + 80 * Math.cos((startAngle - 90) * Math.PI / 180);
                    const y1 = 100 + 80 * Math.sin((startAngle - 90) * Math.PI / 180);
                    const x2 = 100 + 80 * Math.cos((endAngle - 90) * Math.PI / 180);
                    const y2 = 100 + 80 * Math.sin((endAngle - 90) * Math.PI / 180);
                    
                    const largeArcFlag = angle > 180 ? 1 : 0;
                    
                    const pathData = [
                      `M 100 100`,
                      `L ${x1} ${y1}`,
                      `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`,
                      `Z`
                    ].join(' ');
                    
                    acc.paths.push(
                      <path
                        key={index}
                        d={pathData}
                        fill={item.color}
                        opacity="0.9"
                      />
                    );
                    acc.angle = endAngle;
                    return acc;
                  }, { paths: [], angle: 0 }).paths}
                  <circle cx="100" cy="100" r="55" fill="white"/>
                </svg>
                <div className="donut-center">
                  <div className="donut-total">
                    {formatCurrency(maintenanceData.reduce((sum, item) => sum + item.cost, 0))}
                  </div>
                  <div className="donut-label">Total Cost</div>
                </div>
              </div>
              <div className="donut-legend">
                {maintenanceData.map((item, index) => (
                  <div key={index} className="legend-item">
                    <div className="legend-info">
                      <div className="legend-color" style={{ background: item.color }}></div>
                      <span className="legend-name">{item.category}</span>
                    </div>
                    <span className="legend-value">{formatCurrency(item.cost)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Occupancy Table */}
        <div className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Property Occupancy Rates</h3>
            <div className="chart-actions">
              <button className="chart-btn">Export</button>
            </div>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Property</th>
                <th>Occupied Units</th>
                <th>Total Units</th>
                <th>Occupancy Rate</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {occupancyData.map((item, index) => (
                <tr key={index}>
                  <td style={{ fontWeight: 600 }}>{item.property}</td>
                  <td>{item.occupied}</td>
                  <td>{item.total}</td>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div className="progress-bar" style={{ width: '120px' }}>
                        <div 
                          className={`progress-fill ${item.rate < 85 ? 'danger' : item.rate < 90 ? 'warning' : ''}`}
                          style={{ width: `${item.rate}%` }}
                        ></div>
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{item.rate}%</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${item.rate >= 90 ? 'active' : item.rate >= 85 ? 'pending' : 'inactive'}`}>
                      {item.rate >= 90 ? 'Excellent' : item.rate >= 85 ? 'Good' : 'Low'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;
