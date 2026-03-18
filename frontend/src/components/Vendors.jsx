import { useState, useEffect } from 'react';
import axios from 'axios';
import DrillDownModal from './DrillDownModal';
import VendorForm from './VendorForm';
import { getVendorDashboardConfig } from '../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState('dashboard');
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const [showVendorForm, setShowVendorForm] = useState(false);
  const dashboardConfig = getVendorDashboardConfig();

  useEffect(() => {
    fetchVendors();
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/vendors/stats');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching vendor stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchVendors = async () => {
    try {
      const response = await axios.get('/api/vendors');
      setVendors(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = () => {
    if (dashboardStats) {
      exportToExcel(dashboardStats, 'vendor-dashboard.csv');
    }
  };

  const handleExportPDF = () => {
    if (dashboardStats) {
      exportToPDF(dashboardStats, 'vendor-dashboard.pdf');
    }
  };

  const handleDrillDown = (chartType) => {
    if (!dashboardStats) return;

    let modalData = { isOpen: true, title: '', data: [], columns: [] };

    switch (chartType) {
      case 'vendorsByCategory':
        modalData.title = 'Vendors by Category - Detailed View';
        modalData.data = dashboardStats.vendorsByCategory;
        modalData.columns = [
          { key: 'category', label: 'Category' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'topVendorsBySpend':
        modalData.title = 'Top Vendors by Spend - Detailed View';
        modalData.data = dashboardStats.topVendorsBySpend;
        modalData.columns = [
          { key: 'name', label: 'Vendor Name' },
          { key: 'category', label: 'Category' },
          { key: 'spend', label: 'Spend', render: (val) => `KES ${(val / 1000000).toFixed(2)}M` }
        ];
        break;
      case 'performanceRatings':
        modalData.title = 'Performance Ratings - Detailed View';
        modalData.data = dashboardStats.performanceRatings;
        modalData.columns = [
          { key: 'rating', label: 'Rating' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      default:
        return;
    }

    setDrillDownModal(modalData);
  };

  // Prepare KPI data from backend stats
  const kpiData = dashboardStats ? [
    {
      label: 'Active Vendors',
      value: dashboardStats.kpis.activeVendors,
      change: '+3 this month',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      bgColor: '#E8F0F2',
      color: '#2C5F6F'
    },
    {
      label: 'Average Rating',
      value: `${dashboardStats.kpis.avgRating}/5.0`,
      change: 'Excellent performance',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>',
      bgColor: '#FFF8E1',
      color: '#F57C00'
    },
    {
      label: 'Monthly Spend',
      value: `KES ${(dashboardStats.kpis.monthlySpend / 1000000).toFixed(1)}M`,
      change: '+8.2% from last month',
      changeType: 'warning',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#FFF3E0',
      color: '#FF6B35'
    },
    {
      label: 'On-Time Delivery',
      value: `${dashboardStats.kpis.onTimeDelivery}%`,
      change: 'Above target',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      bgColor: '#E8F5E9',
      color: '#2E7D32'
    }
  ] : dashboardConfig.kpis;

  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <div>
          <h1 className="rw-page-title">Vendor Management</h1>
          <p className="rw-page-subtitle">Manage service providers and contractors</p>
        </div>
        <div className="rw-page-actions">
          {/* View Toggle */}
          <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
            <button
              className={`rw-button ${viewMode === 'dashboard' ? 'rw-button-primary' : 'rw-button-secondary'}`}
              onClick={() => setViewMode('dashboard')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="7" height="7"></rect>
                <rect x="14" y="3" width="7" height="7"></rect>
                <rect x="14" y="14" width="7" height="7"></rect>
                <rect x="3" y="14" width="7" height="7"></rect>
              </svg>
              <span>Dashboard</span>
            </button>
            <button
              className={`rw-button ${viewMode === 'list' ? 'rw-button-primary' : 'rw-button-secondary'}`}
              onClick={() => setViewMode('list')}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="8" y1="6" x2="21" y2="6"></line>
                <line x1="8" y1="12" x2="21" y2="12"></line>
                <line x1="8" y1="18" x2="21" y2="18"></line>
                <line x1="3" y1="6" x2="3.01" y2="6"></line>
                <line x1="3" y1="12" x2="3.01" y2="12"></line>
                <line x1="3" y1="18" x2="3.01" y2="18"></line>
              </svg>
              <span>List View</span>
            </button>
          </div>

          {/* Export Buttons */}
          {viewMode === 'dashboard' && dashboardStats && (
            <div style={{ display: 'flex', gap: '8px', marginRight: '16px' }}>
              <button className="rw-button rw-button-secondary" onClick={handleExportExcel}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                <span>Export Excel</span>
              </button>
              <button className="rw-button rw-button-secondary" onClick={handleExportPDF}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
                  <polyline points="14 2 14 8 20 8"></polyline>
                  <line x1="16" y1="13" x2="8" y2="13"></line>
                  <line x1="16" y1="17" x2="8" y2="17"></line>
                  <polyline points="10 9 9 9 8 9"></polyline>
                </svg>
                <span>Export PDF</span>
              </button>
            </div>
          )}

          <button className="rw-button rw-button-accent" onClick={() => setShowVendorForm(true)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Vendor</span>
          </button>
        </div>
      </div>

      {/* Dashboard View */}
      {viewMode === 'dashboard' ? (
        <>
          {statsLoading ? (
            <div className="rw-loading">
              <div className="rw-spinner"></div>
              <p style={{ marginTop: '16px' }}>Loading dashboard...</p>
            </div>
          ) : (
            <>
              {/* KPI Cards */}
              <div className="rw-kpi-grid" style={{ marginBottom: '24px' }}>
                {kpiData.map((kpi, index) => (
                  <div key={index} className="rw-kpi-card">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '12px' }}>
                      <div style={{
                        width: '48px',
                        height: '48px',
                        borderRadius: '8px',
                        backgroundColor: kpi.bgColor,
                        color: kpi.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center'
                      }}>
                        <div dangerouslySetInnerHTML={{ __html: kpi.icon }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div className="rw-kpi-label">{kpi.label}</div>
                        <div className="rw-kpi-value">{kpi.value}</div>
                      </div>
                    </div>
                    {kpi.change && (
                      <div className={`rw-kpi-change ${kpi.changeType}`}>
                        {kpi.change}
                      </div>
                    )}
                  </div>
                ))}
              </div>

          {/* Charts - 3 columns */}
          {dashboardStats && (
            <div className="rw-grid-3">
              {/* Chart 1: Vendors by Category */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('vendorsByCategory')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Vendors by Category</h3>
                    <p className="rw-chart-subtitle">Distribution</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.vendorsByCategory.map((item, i) => {
                    const colors = ['#2C5F6F', '#FF6B35', '#00758F', '#6B4C9A', '#F57C00'];
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.category}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: colors[i] }}>{item.count}</span>
                        </div>
                        <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${item.percentage}%`,
                            background: colors[i],
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Top Vendors by Spend */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('topVendorsBySpend')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Top Vendors by Spend</h3>
                    <p className="rw-chart-subtitle">Monthly Expenditure</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.topVendorsBySpend.map((item, i) => (
                    <div key={i} style={{
                      padding: '12px',
                      background: '#F5F5F5',
                      borderRadius: '6px',
                      marginBottom: '8px',
                      borderLeft: '3px solid #2C5F6F'
                    }}>
                      <div style={{ fontSize: '13px', fontWeight: '600', color: '#2C5F6F', marginBottom: '4px' }}>
                        {item.name}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                        <span style={{ fontSize: '11px', color: '#757575' }}>{item.category}</span>
                        <span style={{ fontSize: '11px', fontWeight: '600', color: '#FF6B35' }}>
                          KES {(item.spend / 1000000).toFixed(2)}M
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Chart 3: Performance Ratings */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('performanceRatings')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Performance Ratings</h3>
                    <p className="rw-chart-subtitle">Vendor Quality</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {dashboardStats.performanceRatings.map((item, i) => {
                    const colors = ['#2E7D32', '#2C5F6F', '#F57C00', '#D32F2F'];
                    return (
                      <div key={i} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.rating}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: colors[i] }}>{item.count}</span>
                        </div>
                        <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${item.percentage}%`,
                            background: colors[i],
                            borderRadius: '4px'
                          }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
            </>
          )}
        </>
      ) : (
        <>
          <div className="rw-card">
        <div className="rw-card-header">
          <h2 className="rw-card-title">All Vendors ({vendors.length})</h2>
        </div>
        <div className="rw-card-content">
          {loading ? (
            <p style={{ textAlign: 'center', padding: '40px', color: 'var(--redwood-gray-600)' }}>Loading...</p>
          ) : (
            <table className="rw-table">
              <thead>
                <tr>
                  <th>Vendor Code</th>
                  <th>Vendor Name</th>
                  <th>Type</th>
                  <th>Service Category</th>
                  <th>Contact Person</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Rating</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {vendors.map((vendor) => (
                  <tr key={vendor.VENDOR_ID}>
                    <td><strong>{vendor.VENDOR_CODE}</strong></td>
                    <td>{vendor.VENDOR_NAME}</td>
                    <td>{vendor.VENDOR_TYPE}</td>
                    <td>{vendor.SERVICE_CATEGORY}</td>
                    <td>{vendor.CONTACT_PERSON}</td>
                    <td>{vendor.CONTACT_EMAIL}</td>
                    <td>{vendor.CONTACT_PHONE}</td>
                    <td>⭐ {vendor.RATING}</td>
                    <td>
                      <span className="rw-badge" style={{ backgroundColor: '#E8F5E9', color: '#2E7D32' }}>
                        {vendor.STATUS}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
        </>
      )}

      <style jsx>{`
        .kpi-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: var(--spacing-lg);
        }
        .kpi-card {
          display: flex;
          gap: var(--spacing-md);
        }
        .kpi-icon {
          width: 56px;
          height: 56px;
          border-radius: var(--radius-lg);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .kpi-content {
          flex: 1;
        }
        .kpi-label {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-600);
          margin-bottom: var(--spacing-xs);
        }
        .kpi-value {
          font-size: var(--font-size-3xl);
          font-weight: 600;
          color: var(--redwood-gray-900);
          margin-bottom: var(--spacing-xs);
        }
        .kpi-change {
          font-size: var(--font-size-xs);
          font-weight: 500;
        }
        .kpi-change.positive { color: var(--redwood-success); }
        .kpi-change.negative { color: var(--redwood-error); }
        .kpi-change.neutral { color: var(--redwood-gray-600); }
        .kpi-change.warning { color: var(--redwood-warning); }
      `}</style>

      {/* Drill-Down Modal */}
      <DrillDownModal
        isOpen={drillDownModal.isOpen}
        onClose={() => setDrillDownModal({ ...drillDownModal, isOpen: false })}
        title={drillDownModal.title}
        data={drillDownModal.data}
        columns={drillDownModal.columns}
      />

      <VendorForm
        isOpen={showVendorForm}
        onClose={() => setShowVendorForm(false)}
        onSuccess={() => { fetchVendors(); fetchDashboardStats(); }}
      />
    </div>
  );
}

export default Vendors;
