import { useState, useEffect } from 'react';
import axios from 'axios';
import LeaseForm from './LeaseForm';
import DrillDownModal from './DrillDownModal';
import { getLeaseDashboardConfig } from '../config/moduleDashboards';
import { exportToExcel, exportToPDF } from '../utils/dashboardUtils.jsx';
import '../styles/redwood-authentic.css';
import '../styles/ModuleLayout.css';

function Leases() {
  const [leases, setLeases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    status: '',
    property_id: '',
    tenant_id: ''
  });
  const [showForm, setShowForm] = useState(false);
  const [selectedLease, setSelectedLease] = useState(null);
  const [viewMode, setViewMode] = useState('dashboard'); // 'dashboard' or 'list'
  const [dashboardStats, setDashboardStats] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [drillDownModal, setDrillDownModal] = useState({ isOpen: false, title: '', data: [], columns: [] });
  const dashboardConfig = getLeaseDashboardConfig();

  useEffect(() => {
    fetchLeases();
    fetchDashboardStats();
  }, [filters]);

  const fetchDashboardStats = async () => {
    try {
      setStatsLoading(true);
      const response = await axios.get('/api/leases/stats');
      setDashboardStats(response.data.data);
    } catch (error) {
      console.error('Error fetching lease stats:', error);
      setDashboardStats(null);
    } finally {
      setStatsLoading(false);
    }
  };

  const fetchLeases = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.status) params.append('status', filters.status);
      if (filters.property_id) params.append('property_id', filters.property_id);
      if (filters.tenant_id) params.append('tenant_id', filters.tenant_id);

      const response = await axios.get(`/api/leases?${params}`);
      setLeases(response.data.data || []);
    } catch (error) {
      console.error('Error fetching leases:', error);
      setLeases([]);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'ACTIVE':
        return 'rw-badge rw-badge-success';
      case 'EXPIRED':
        return 'rw-badge rw-badge-error';
      case 'PENDING':
        return 'rw-badge rw-badge-warning';
      default:
        return 'rw-badge';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const handleCreate = () => {
    setSelectedLease(null);
    setShowForm(true);
  };

  const handleEdit = (lease) => {
    setSelectedLease(lease);
    setShowForm(true);
  };

  const handleExportExcel = () => {
    if (dashboardStats) {
      exportToExcel(dashboardStats, 'lease-dashboard.csv');
    }
  };

  const handleExportPDF = () => {
    if (dashboardStats) {
      exportToPDF(dashboardStats, 'lease-dashboard.pdf');
    }
  };

  const handleDrillDown = (chartType) => {
    if (!dashboardStats) return;

    let modalData = { isOpen: true, title: '', data: [], columns: [] };

    switch (chartType) {
      case 'leaseExpiryTimeline':
        modalData.title = 'Lease Expiry Timeline - Detailed View';
        modalData.data = Array.isArray(dashboardStats.leaseExpiryTimeline) ? dashboardStats.leaseExpiryTimeline : [];
        modalData.columns = [
          { key: 'month', label: 'Month' },
          { key: 'expiring', label: 'Expiring Leases' },
          { key: 'revenue', label: 'Revenue Impact', render: (val) => `KES ${(val / 1000000).toFixed(1)}M` }
        ];
        break;
      case 'revenueByLeaseType':
        modalData.title = 'Revenue by Lease Type - Detailed View';
        modalData.data = Array.isArray(dashboardStats.revenueByLeaseType) ? dashboardStats.revenueByLeaseType : [];
        modalData.columns = [
          { key: 'type', label: 'Lease Type' },
          { key: 'count', label: 'Count' },
          { key: 'revenue', label: 'Revenue', render: (val) => `KES ${(val / 1000000).toFixed(1)}M` },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      case 'leaseDurationDistribution':
        modalData.title = 'Lease Duration Distribution - Detailed View';
        modalData.data = Array.isArray(dashboardStats.leaseDurationDistribution) ? dashboardStats.leaseDurationDistribution : [];
        modalData.columns = [
          { key: 'duration', label: 'Duration' },
          { key: 'count', label: 'Count' },
          { key: 'percentage', label: 'Percentage', render: (val) => `${val}%` }
        ];
        break;
      default:
        return;
    }

    setDrillDownModal(modalData);
  };

  const handleDelete = async (lease) => {
    if (!window.confirm(`Are you sure you want to delete this lease?`)) {
      return;
    }

    try {
      const leaseId = lease.LEASE_ID || lease.lease_id;
      await axios.delete(`/api/leases/${leaseId}`);
      fetchLeases();
    } catch (err) {
      console.error('Error deleting lease:', err);
      alert('Failed to delete lease');
    }
  };

  const handleFormSuccess = () => {
    fetchLeases();
  };

  // Prepare KPI data from backend stats (guard missing kpis)
  const kpiData = dashboardStats && dashboardStats.kpis ? [
    {
      label: 'Active Leases',
      value: dashboardStats.kpis.activeLeases.toString(),
      change: '+8 this month',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg>',
      bgColor: '#E8F0F2',
      color: '#2C5F6F'
    },
    {
      label: 'Monthly Revenue',
      value: `KES ${(dashboardStats.kpis.monthlyRevenue / 1000000).toFixed(1)}M`,
      change: '+5.2% from last month',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"></line><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>',
      bgColor: '#FFE5DC',
      color: '#FF6B35'
    },
    {
      label: 'Expiring Soon',
      value: dashboardStats.kpis.expiringSoon.toString(),
      change: 'Next 90 days',
      changeType: 'warning',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>',
      bgColor: '#FFF3E0',
      color: '#F57C00'
    },
    {
      label: 'Avg Lease Value',
      value: `KES ${(dashboardStats.kpis.avgLeaseValue / 1000).toFixed(0)}K`,
      change: '+3.8% YoY',
      changeType: 'positive',
      icon: '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="20" x2="12" y2="10"></line><line x1="18" y1="20" x2="18" y2="4"></line><line x1="6" y1="20" x2="6" y2="16"></line></svg>',
      bgColor: '#E8E0F5',
      color: '#6B4C9A'
    }
  ] : dashboardConfig.kpis;

  return (
    <div className="rw-page">
      <div className="rw-page-header">
        <h1 className="rw-page-title">Lease Management</h1>
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

          <button className="rw-button rw-button-accent" onClick={handleCreate}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            <span>Add Lease</span>
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
            </>
          )}

          {/* Charts - 3 columns */}
          {dashboardStats && (
            <div className="rw-grid-3">
              {/* Chart 1: Lease Expiry Timeline */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('leaseExpiryTimeline')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Lease Expiry Timeline</h3>
                    <p className="rw-chart-subtitle">Next 6 Months</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {(Array.isArray(dashboardStats.leaseExpiryTimeline) ? dashboardStats.leaseExpiryTimeline : []).map((item, i) => {
                    const timeline = Array.isArray(dashboardStats.leaseExpiryTimeline) ? dashboardStats.leaseExpiryTimeline : [];
                    const maxExpiring = timeline.length ? Math.max(...timeline.map(l => l.expiring)) : 0;
                    const heightPercent = (item.expiring / maxExpiring) * 100;
                    return (
                      <div key={i} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontSize: '12px', fontWeight: '500' }}>{item.month}</span>
                          <span style={{ fontSize: '12px', fontWeight: '600', color: '#FF6B35' }}>{item.expiring}</span>
                        </div>
                        <div style={{ height: '8px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{
                            height: '100%',
                            width: `${heightPercent}%`,
                            background: i % 2 === 0 ? '#2C5F6F' : '#FF6B35',
                            borderRadius: '4px'
                          }}></div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#757575', marginTop: '2px' }}>
                          KES {(item.revenue / 1000000).toFixed(1)}M
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Chart 2: Revenue by Lease Type */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('revenueByLeaseType')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Revenue by Lease Type</h3>
                    <p className="rw-chart-subtitle">Monthly Breakdown</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px 0' }}>
                  {(Array.isArray(dashboardStats.revenueByLeaseType) ? dashboardStats.revenueByLeaseType : []).map((item, i) => (
                    <div key={i} style={{ display: 'grid', gridTemplateColumns: '100px 1fr 80px', gap: '12px', alignItems: 'center', marginBottom: '12px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '500', color: '#2C5F6F' }}>{item.type}</div>
                      <div style={{ height: '28px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%',
                          width: `${item.percentage}%`,
                          background: i === 0 ? '#2C5F6F' : i === 1 ? '#FF6B35' : '#00758F',
                          display: 'flex',
                          alignItems: 'center',
                          padding: '0 8px'
                        }}>
                          <span style={{ fontSize: '12px', color: 'white', fontWeight: '600' }}>{item.count}</span>
                        </div>
                      </div>
                      <div style={{ fontSize: '13px', fontWeight: '600', textAlign: 'right' }}>{item.percentage}%</div>
                    </div>
                  ))}
                </div>
                <div style={{ paddingTop: '12px', borderTop: '1px solid #EEEEEE' }}>
                  <span style={{ fontSize: '12px', color: '#757575' }}>KES {dashboardStats.kpis ? ((dashboardStats.kpis.monthlyRevenue || 0) / 1000000).toFixed(1) : '0'}M Total</span>
                </div>
              </div>

              {/* Chart 3: Lease Duration Distribution */}
              <div className="rw-chart-container" style={{ cursor: 'pointer' }} onClick={() => handleDrillDown('leaseDurationDistribution')}>
                <div className="rw-chart-header">
                  <div>
                    <h3 className="rw-chart-title">Lease Duration</h3>
                    <p className="rw-chart-subtitle">Distribution</p>
                  </div>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="8"></circle>
                    <path d="m21 21-4.35-4.35"></path>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                </div>
                <div style={{ padding: '20px', display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                  <div style={{ width: '100%' }}>
                    {(Array.isArray(dashboardStats.leaseDurationDistribution) ? dashboardStats.leaseDurationDistribution : []).map((item, i) => {
                      const colors = ['#2C5F6F', '#FF6B35', '#00758F', '#6B4C9A'];
                      return (
                        <div key={i} style={{ marginBottom: '16px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <span style={{ fontSize: '13px', fontWeight: '500' }}>{item.duration}</span>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: colors[i] }}>{item.count}</span>
                          </div>
                          <div style={{ height: '24px', background: '#F5F5F5', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%',
                              width: `${item.percentage}%`,
                              background: colors[i],
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}>
                              <span style={{ fontSize: '11px', color: 'white', fontWeight: '600' }}>{item.percentage}%</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <>
          {/* Filters */}
          <div className="rw-card" style={{ marginBottom: '24px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px' }}>
              <div>
                <label className="rw-label">Status</label>
                <select
                  className="rw-input"
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                >
                  <option value="">All Statuses</option>
                  <option value="ACTIVE">Active</option>
                  <option value="EXPIRED">Expired</option>
                  <option value="PENDING">Pending</option>
                </select>
              </div>
            </div>
          </div>

          {/* Leases Table */}
          <div className="rw-card">
            <h2 className="rw-card-title">All Leases</h2>
            {loading ? (
              <p>Loading leases...</p>
            ) : leases.length === 0 ? (
              <p>No leases found.</p>
            ) : (
          <table className="rw-table">
            <thead>
              <tr>
                <th>Lease Code</th>
                <th>Property</th>
                <th>Tenant</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Monthly Rent</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {leases.map((lease) => (
                <tr key={lease.LEASE_ID}>
                  <td>{lease.LEASE_CODE}</td>
                  <td>{lease.PROPERTY_NAME || 'N/A'}</td>
                  <td>{lease.TENANT_NAME || 'N/A'}</td>
                  <td>{formatDate(lease.START_DATE)}</td>
                  <td>{formatDate(lease.END_DATE)}</td>
                  <td>{formatCurrency(lease.MONTHLY_RENT)}</td>
                  <td>
                    <span className={getStatusBadgeClass(lease.STATUS)}>
                      {lease.STATUS}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className="rw-button rw-button-secondary"
                        style={{ fontSize: '12px', padding: '4px 12px' }}
                        onClick={() => handleEdit(lease)}
                        title="Edit lease"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                        </svg>
                      </button>
                      <button
                        className="rw-button rw-button-danger"
                        style={{ fontSize: '12px', padding: '4px 12px', background: '#D32F2F', color: 'white' }}
                        onClick={() => handleDelete(lease)}
                        title="Delete lease"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="3 6 5 6 21 6"></polyline>
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
            )}
          </div>
        </>
      )}

      <style jsx="true">{`
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

        .reports-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: var(--spacing-lg);
        }

        .report-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: var(--spacing-md);
        }

        .report-period {
          font-size: var(--font-size-sm);
          color: var(--redwood-gray-600);
        }

        .report-footer {
          margin-top: var(--spacing-md);
          padding-top: var(--spacing-md);
          border-top: 1px solid var(--redwood-gray-200);
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .report-total {
          font-size: var(--font-size-md);
          font-weight: 600;
          color: var(--redwood-gray-900);
        }
      `}</style>

      {/* Lease Form Modal */}
      <LeaseForm
        isOpen={showForm}
        onClose={() => setShowForm(false)}
        lease={selectedLease}
        onSuccess={handleFormSuccess}
      />

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

export default Leases;
