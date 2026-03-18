import { useState, useEffect } from 'react';
import axios from 'axios';
import DrillDownModal from '../DrillDownModal';
import { getTenantDashboardConfig } from '../../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../../utils/dashboardUtils.jsx';
import '../../styles/redwood-authentic.css';

function TenantDashboard() {
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/tenants/stats');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching tenant stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const dashboardConfig = getTenantDashboardConfig();

  const kpiData = dashboardStats ? [
    {
      label: 'Total Tenants',
      value: dashboardStats.kpis.totalTenants.toString(),
      change: '+8 this month',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path></svg>',
      bgColor: '#E8F3FC',
      color: '#0572CE'
    },
    {
      label: 'Corporate Tenants',
      value: dashboardStats.kpis.corporateTenants.toString(),
      change: `${((dashboardStats.kpis.corporateTenants / dashboardStats.kpis.totalTenants) * 100).toFixed(0)}% of total`,
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    },
    {
      label: 'Avg Tenure',
      value: `${dashboardStats.kpis.avgTenure} years`,
      change: 'Industry leading',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      bgColor: '#FFF3E0',
      color: '#E65100'
    },
    {
      label: 'Payment Rate',
      value: `${dashboardStats.kpis.paymentRate}%`,
      change: 'On-time payments',
      changeType: 'positive',
      icon: '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
      bgColor: '#F3E5F5',
      color: '#6A1B9A'
    }
  ] : dashboardConfig.kpis;

  const handleExportExcel = () => {
    if (dashboardStats) {
      exportToExcel(dashboardStats, 'tenant-dashboard.csv');
    }
  };

  const handleExportPDF = () => {
    if (dashboardStats) {
      exportToPDF(dashboardStats, 'tenant-dashboard.pdf');
    }
  };

  const handleDrillDown = (chartType) => {
    if (!dashboardStats) return;

    let modalData = { isOpen: true, title: '', data: [], columns: [] };

    switch (chartType) {
      case 'tenantsByType':
        modalData.title = 'Tenants by Type - Detailed View';
        modalData.data = dashboardStats.tenantsByType;
        modalData.columns = [
          { key: 'type', label: 'Tenant Type' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;

      case 'tenantsByLocation':
        modalData.title = 'Tenants by Location - Detailed View';
        modalData.data = dashboardStats.tenantsByLocation;
        modalData.columns = [
          { key: 'location', label: 'Location' },
          { key: 'count', label: 'Number of Tenants' }
        ];
        break;

      case 'topTenantsByRevenue':
        modalData.title = 'Top Tenants by Revenue - Detailed View';
        modalData.data = dashboardStats.topTenantsByRevenue;
        modalData.columns = [
          { key: 'name', label: 'Tenant Name' },
          { key: 'leases', label: 'Number of Leases' },
          { key: 'revenue', label: 'Monthly Revenue', render: (val) => `KES ${(val / 1000000).toFixed(2)}M` }
        ];
        break;

      default:
        return;
    }

    setDrillDownModal(modalData);
  };

  return (
    <div className="rw-dashboard">
      {/* Action Bar */}
      <div className="rw-action-bar">
        <div className="rw-action-bar-left">
          <h2 className="rw-section-title">Tenant Dashboard</h2>
        </div>
        {dashboardStats && (
          <div className="rw-action-bar-right">
            <button className="rw-button rw-button-secondary" onClick={handleExportExcel}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>Export Excel</span>
            </button>
            <button className="rw-button rw-button-secondary" onClick={handleExportPDF}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                <polyline points="14 2 14 8 20 8"></polyline>
              </svg>
              <span>Export PDF</span>
            </button>
          </div>
        )}
      </div>

      {statsLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>Loading dashboard...</div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="rw-kpi-grid">
            {kpiData.map((kpi, index) => (
              <div key={index} className="rw-kpi-card">
                <div className="rw-kpi-icon" style={{ backgroundColor: kpi.bgColor, color: kpi.color }}>
                  <div dangerouslySetInnerHTML={{ __html: kpi.icon }} />
                </div>
                <div className="rw-kpi-content">
                  <div className="rw-kpi-label">{kpi.label}</div>
                  <div className="rw-kpi-value">{kpi.value}</div>
                  {kpi.change && (
                    <div className={`rw-kpi-change ${kpi.changeType || 'positive'}`}>
                      {kpi.change}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Charts/Reports Grid */}
          {dashboardStats && (
            <div className="rw-reports-grid">
              {/* Chart 1: Tenants by Type */}
              <div className="rw-card rw-clickable" onClick={() => handleDrillDown('tenantsByType')}>
                <div className="rw-card-header">
                  <h3 className="rw-card-title">Tenants by Type</h3>
                  <span className="rw-card-subtitle">Current Distribution</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <div className="rw-card-content">
                  <div style={{ padding: '20px 0' }}>
                    {dashboardStats.tenantsByType.map((item, i) => (
                      <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                        <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.type}</div>
                        <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${item.percentage}%`, background: i === 0 ? '#0572CE' : i === 1 ? '#42A5F5' : '#90CAF9', display: 'flex', alignItems: 'center', padding: '0 8px' }}>
                            <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                          </div>
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rw-card-footer">
                  <span className="rw-card-total">{dashboardStats.kpis.totalTenants} Total Tenants</span>
                </div>
              </div>

              {/* Chart 2: Tenants by Location */}
              <div className="rw-card rw-clickable" onClick={() => handleDrillDown('tenantsByLocation')}>
                <div className="rw-card-header">
                  <h3 className="rw-card-title">Tenants by Location</h3>
                  <span className="rw-card-subtitle">Nairobi County</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <div className="rw-card-content">
                  <div style={{ padding: '20px 0' }}>
                    {dashboardStats.tenantsByLocation.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < dashboardStats.tenantsByLocation.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
                        <span style={{ fontSize: '14px' }}>{item.location}</span>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#0572CE' }}>{item.count}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rw-card-footer">
                  <span className="rw-card-total">{dashboardStats.tenantsByLocation.length} Locations</span>
                </div>
              </div>

              {/* Chart 3: Top Tenants by Revenue */}
              <div className="rw-card rw-clickable" onClick={() => handleDrillDown('topTenantsByRevenue')}>
                <div className="rw-card-header">
                  <h3 className="rw-card-title">Top Tenants by Revenue</h3>
                  <span className="rw-card-subtitle">February 2026</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ marginLeft: 'auto' }}>
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                  </svg>
                </div>
                <div className="rw-card-content">
                  <div style={{ padding: '20px 0' }}>
                    {dashboardStats.topTenantsByRevenue.map((item, i) => (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: i < dashboardStats.topTenantsByRevenue.length - 1 ? '1px solid #E0E0E0' : 'none' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: '500' }}>{item.name}</div>
                          <div style={{ fontSize: '12px', color: '#666' }}>{item.leases} leases</div>
                        </div>
                        <span style={{ fontSize: '14px', fontWeight: '600', color: '#2E7D32' }}>KES {(item.revenue / 1000000).toFixed(1)}M</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="rw-card-footer">
                  <span className="rw-card-total">Top {dashboardStats.topTenantsByRevenue.length} Tenants</span>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* Drill-Down Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
        title={drillDownModal.title}
        data={drillDownModal.data}
        columns={drillDownModal.columns}
      />
    </div>
  );
}

export default TenantDashboard;

