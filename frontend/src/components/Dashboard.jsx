import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/Dashboard.css';

function Dashboard() {
  const { user } = useAuth();
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
      { category: 'HVAC Systems', cost: 1250000, percentage: 32, color: 'var(--primary-500)' },
      { category: 'Plumbing', cost: 980000, percentage: 25, color: 'var(--secondary-500)' },
      { category: 'Electrical', cost: 750000, percentage: 19, color: 'var(--accent-500)' },
      { category: 'Elevators', cost: 620000, percentage: 16, color: 'var(--warning-500)' },
      { category: 'Security Systems', cost: 320000, percentage: 8, color: 'var(--gray-600)' }
    ]);
  }, []);

  const formatCurrency = (amount) => {
    return `KES ${(amount / 1000000).toFixed(1)}M`;
  };

  const statCards = [
    {
      key: 'totalProperties',
      label: 'Total Properties',
      value: stats.totalProperties,
      change: '12% from last month',
      trend: 'positive',
      icon: 'properties',
      accent: 'primary'
    },
    {
      key: 'activeLeases',
      label: 'Active Leases',
      value: stats.activeLeases,
      change: '8% from last month',
      trend: 'positive',
      icon: 'leases',
      accent: 'teal'
    },
    {
      key: 'workOrders',
      label: 'Open Work Orders',
      value: stats.openWorkOrders,
      change: '3 urgent',
      trend: 'negative',
      icon: 'workorders',
      accent: 'amber'
    },
    {
      key: 'revenue',
      label: 'Monthly Revenue',
      value: formatCurrency(stats.monthlyRevenue),
      change: '15% from last month',
      trend: 'positive',
      icon: 'revenue',
      accent: 'purple'
    }
  ];

  return (
    <div className="dashboard">
      <header className="dashboard__header">
        <div className="dashboard__header-inner">
          <div className="dashboard__title-block">
            <h1 className="dashboard__title">Dashboard</h1>
            <p className="dashboard__welcome">
              {user?.full_name ? `Welcome back, ${user.full_name.split(' ')[0]}` : 'Welcome back'} — here’s your portfolio overview.
            </p>
          </div>
          <div className="dashboard__actions">
            <Link to="/reports" className="dashboard__btn dashboard__btn--secondary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18" aria-hidden>
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              Export / Reports
            </Link>
            <Link to="/properties" className="dashboard__btn dashboard__btn--primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="18" height="18" aria-hidden>
                <path d="M12 5v14M5 12h14" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              New Property
            </Link>
          </div>
        </div>
      </header>

      <div className="dashboard__body">
        <section className="dashboard__kpis" aria-label="Key metrics">
          {statCards.map((card) => (
            <article
              key={card.key}
              className={`dashboard__kpi dashboard__kpi--${card.accent}`}
              data-testid={`${card.key}-stat`}
            >
              <div className="dashboard__kpi-head">
                <span className="dashboard__kpi-label">{card.label}</span>
                <span className={`dashboard__kpi-icon dashboard__kpi-icon--${card.accent}`} aria-hidden>
                  {card.icon === 'properties' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
                  )}
                  {card.icon === 'leases' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeWidth="2"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  )}
                  {card.icon === 'workorders' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" strokeWidth="2"/></svg>
                  )}
                  {card.icon === 'revenue' && (
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor"><line x1="12" y1="1" x2="12" y2="23" strokeWidth="2"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6" strokeWidth="2"/></svg>
                  )}
                </span>
              </div>
              <div className="dashboard__kpi-value">{card.value}</div>
              <div className={`dashboard__kpi-change dashboard__kpi-change--${card.trend}`}>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" width="14" height="14"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" strokeWidth="2"/></svg>
                <span>{card.change}</span>
              </div>
            </article>
          ))}
        </section>

        <div className="dashboard__charts">
          <section className="dashboard__card dashboard__card--chart">
            <div className="dashboard__card-head">
              <h2 className="dashboard__card-title">Revenue by Property</h2>
              <Link to="/properties" className="dashboard__card-action">View all</Link>
            </div>
            <div className="dashboard__bar-chart">
              {revenueData.map((item, index) => (
                <div key={index} className="dashboard__bar-row">
                  <span className="dashboard__bar-label">{item.property}</span>
                  <div className="dashboard__bar-track">
                    <div className="dashboard__bar-fill" style={{ width: `${Math.min(item.percentage * 4.5, 100)}%` }}>
                      <span className="dashboard__bar-value">{formatCurrency(item.revenue)}</span>
                    </div>
                  </div>
                  <span className="dashboard__bar-pct">{item.percentage}%</span>
                </div>
              ))}
            </div>
          </section>

          <section className="dashboard__card dashboard__card--chart">
            <div className="dashboard__card-head">
              <h2 className="dashboard__card-title">Maintenance Cost Analysis</h2>
              <Link to="/workorders" className="dashboard__card-action">Details</Link>
            </div>
            <div className="dashboard__donut-wrap">
              <div className="dashboard__donut">
                <svg viewBox="0 0 200 200" width="200" height="200" aria-hidden>
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
                    const pathData = [`M 100 100`, `L ${x1} ${y1}`, `A 80 80 0 ${largeArcFlag} 1 ${x2} ${y2}`, `Z`].join(' ');
                    acc.paths.push(<path key={index} d={pathData} fill={item.color} opacity="0.92"/>);
                    acc.angle = endAngle;
                    return acc;
                  }, { paths: [], angle: 0 }).paths}
                  <circle cx="100" cy="100" r="56" fill="var(--gray-50)"/>
                </svg>
                <div className="dashboard__donut-center">
                  <span className="dashboard__donut-total">{formatCurrency(maintenanceData.reduce((sum, item) => sum + item.cost, 0))}</span>
                  <span className="dashboard__donut-label">Total cost</span>
                </div>
              </div>
              <ul className="dashboard__donut-legend">
                {maintenanceData.map((item, index) => (
                  <li key={index} className="dashboard__legend-item">
                    <span className="dashboard__legend-dot" style={{ background: item.color }}/>
                    <span className="dashboard__legend-name">{item.category}</span>
                    <span className="dashboard__legend-value">{formatCurrency(item.cost)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        </div>

        <section className="dashboard__card dashboard__card--table">
          <div className="dashboard__card-head">
            <h2 className="dashboard__card-title">Property Occupancy Rates</h2>
            <Link to="/properties" className="dashboard__card-action">Export</Link>
          </div>
          <div className="dashboard__table-wrap">
            <table className="dashboard__table">
              <thead>
                <tr>
                  <th>Property</th>
                  <th>Occupied</th>
                  <th>Total</th>
                  <th>Occupancy</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {occupancyData.map((item, index) => (
                  <tr key={index}>
                    <td className="dashboard__table-property">{item.property}</td>
                    <td>{item.occupied}</td>
                    <td>{item.total}</td>
                    <td>
                      <div className="dashboard__occupancy-cell">
                        <div className="dashboard__progress">
                          <div
                            className={`dashboard__progress-fill ${item.rate < 85 ? 'danger' : item.rate < 90 ? 'warning' : ''}`}
                            style={{ width: `${item.rate}%` }}
                          />
                        </div>
                        <span className="dashboard__occupancy-pct">{item.rate}%</span>
                      </div>
                    </td>
                    <td>
                      <span className={`dashboard__badge ${item.rate >= 90 ? 'success' : item.rate >= 85 ? 'warning' : 'danger'}`}>
                        {item.rate >= 90 ? 'Excellent' : item.rate >= 85 ? 'Good' : 'Low'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}

export default Dashboard;
